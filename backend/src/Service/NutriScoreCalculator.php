<?php

namespace App\Service;

use App\Entity\Recipe;
use App\Entity\RecipeIngredient;

class NutriScoreCalculator
{
    /*
     * Facteurs multiplicatifs friture (appliqués au rendement CIQUAL de l'ingrédient).
     * Source : feuille "test", lignes 26-47, colonnes B et C.
     *   Col B : IF(H="1 passage",       VLOOKUP(rendement_ciqual) * 0.9,  0)
     *   Col C : IF(H="Frites surgelées OU 2 passages et plus", VLOOKUP(...) * 0.85, 0)
     * "Surgelé" et "2 passages+" sont la même catégorie dans l'Excel (facteur identique 0.85).
     */
    private const FACTEUR_FRITURE_1_PASSAGE         = 0.9;
    private const FACTEUR_FRITURE_SURGELE_2PASSAGES  = 0.85;

    /*
     * Tables de points — composante N (éléments défavorables)
     * Lecture : value ≤ seuil → points de la ligne ; value > tous les seuils → count($table) = 10.
     */
    private const POINTS_ENERGIE_KJ = [
        335  => 0, 670  => 1, 1005 => 2, 1340 => 3, 1675 => 4,
        2010 => 5, 2345 => 6, 2680 => 7, 3015 => 8, 3350 => 9,
    ];
    private const POINTS_SUCRES = [
        4.5 => 0, 9   => 1, 13.5 => 2, 18 => 3, 22.5 => 4,
        27  => 5, 31  => 6, 36   => 7, 40 => 8, 45   => 9,
    ];
    private const POINTS_AGS = [
        1  => 0, 2 => 1, 3 => 2, 4 => 3, 5  => 4,
        6  => 5, 7 => 6, 8 => 7, 9 => 8, 10 => 9,
    ];
    private const POINTS_SODIUM = [
        90  => 0, 180 => 1, 270 => 2, 360 => 3, 450 => 4,
        540 => 5, 630 => 6, 720 => 7, 810 => 8, 900 => 9,
    ];

    /*
     * Tables de points — composante P (éléments favorables)
     * Fibres et protéines : max = 5 pts (fallback count($table) = 5).
     * FLN : table non-linéaire, gérée par pointsFln().
     */
    private const POINTS_FIBRES = [
        0.9 => 0, 1.9 => 1, 2.8 => 2, 3.7 => 3, 4.7 => 4,
    ];
    private const POINTS_PROTEINES = [
        1.6 => 0, 3.2 => 1, 4.8 => 2, 6.4 => 3, 8.0 => 4,
    ];

    // Boissons : seuils énergie différents (kJ/100 mL)
    private const POINTS_ENERGIE_BOISSONS = [
        0   => 0, 30  => 1, 60  => 2, 90  => 3, 120 => 4,
        150 => 5, 180 => 6, 210 => 7, 240 => 8, 270 => 9,
    ];

    public function calculate(Recipe $recipe): array
    {
        $ingredients = $recipe->getRecipeIngredients()->toArray();

        if (empty($ingredients)) {
            return ['score' => null, 'grade' => null, 'nutrition' => []];
        }

        $totaux = $this->calculerTotauxRecette($ingredients);

        if ($totaux['poidsFinalTotal'] <= 0) {
            return ['score' => null, 'grade' => null, 'nutrition' => []];
        }

        $nutrition100g = $this->ramenerA100g($totaux);

        [$score, $grade] = match ($recipe->getType()) {
            Recipe::TYPE_BOISSONS => $this->calculerScoreBoissons($nutrition100g),
            Recipe::TYPE_VIANDE   => $this->calculerScoreViande($nutrition100g),
            default               => $this->calculerScoreGeneral($nutrition100g),
        };

        return [
            'score'     => $score,
            'grade'     => $grade,
            'nutrition' => $nutrition100g,
        ];
    }

    private function calculerTotauxRecette(array $ingredients): array
    {
        $totaux = [
            'poidsFinalTotal'  => 0.0,
            'poidsVNTotal'     => 0.0,
            'energieKj'        => 0.0,
            'energieKcal'      => 0.0,
            'proteines'        => 0.0,
            'glucides'         => 0.0,
            'lipides'          => 0.0,
            'sucres'           => 0.0,
            'fibres'           => 0.0,
            'acideGrasSatures' => 0.0,
            'sodium'           => 0.0,
            'sel'              => 0.0,
            'fruitsLegumesPct' => 0.0,
        ];

        foreach ($ingredients as $ri) {
            /** @var RecipeIngredient $ri */
            $ing = $ri->getIngredient();

            ['vn' => $poidsVN, 'quantite' => $poidsQuantite] = $this->calculerPoids($ri);

            $ri->setPoidsFinalCalcule($poidsQuantite);

            // Le poids total de la recette est le poids physique final (après cuisson)
            $totaux['poidsFinalTotal'] += $poidsQuantite;

            // Les valeurs nutritionnelles CIQUAL sont référencées au poids VN de chaque ingrédient
            $f = $poidsVN / 100;
            $totaux['energieKj']        += ($ing->getEnergieKj()        ?? 0) * $f;
            $totaux['energieKcal']      += ($ing->getEnergieKcal()      ?? 0) * $f;
            $totaux['proteines']        += ($ing->getProteines()        ?? 0) * $f;
            $totaux['glucides']         += ($ing->getGlucides()         ?? 0) * $f;
            $totaux['lipides']          += ($ing->getLipides()          ?? 0) * $f;
            $totaux['sucres']           += ($ing->getSucres()           ?? 0) * $f;
            $totaux['fibres']           += ($ing->getFibres()           ?? 0) * $f;
            $totaux['acideGrasSatures'] += ($ing->getAcideGrasSatures() ?? 0) * $f;
            $totaux['sodium']           += ($ing->getSodium()           ?? 0) * $f;
            $totaux['sel']              += ($ing->getSel()              ?? 0) * $f;

            // FLN : moyenne pondérée sur la même base que les valeurs nutritionnelles
            $totaux['fruitsLegumesPct'] += ($ing->getFruitsLegumesPct() ?? 0) * $poidsVN;
            $totaux['poidsVNTotal']     += $poidsVN;
        }

        if ($totaux['poidsVNTotal'] > 0) {
            $totaux['fruitsLegumesPct'] /= $totaux['poidsVNTotal'];
        }

        return $totaux;
    }

    /**
     * Calcule les deux poids pour un ingrédient selon le diagramme de décision RHF.
     *
     * Variables :
     *   - alimentCuit   : les valeurs CIQUAL sont-elles pour l'aliment cuit ?
     *   - consommeTotalement : partComestible = 1 (pas de déchets)
     *   - estCuit       : l'opérateur cuit-il l'ingrédient ?
     *
     * Tableau des 8 cas :
     * ┌────────────┬──────────────┬──────┬──────────────────────────────────────┬───────────────────────────────┐
     * │ alimentCuit│ consommeTotal│ cuit │ Poids quantité (poids final recette) │ Poids VN (valeurs nutritives) │
     * ├────────────┼──────────────┼──────┼──────────────────────────────────────┼───────────────────────────────┤
     * │ CRU        │ Oui          │ Oui  │ pInit × rendement                    │ pInit                         │
     * │ CRU        │ Oui          │ Non  │ pInit                                │ pInit                         │
     * │ CRU        │ Non          │ Oui  │ pInit × partCom × rendement          │ pInit × partCom               │
     * │ CRU        │ Non          │ Non  │ pInit × partCom                      │ pInit × partCom               │
     * │ CUIT       │ Oui          │ Oui  │ pInit × rendement                    │ pInit × rendement             │
     * │ CUIT       │ Oui          │ Non  │ pInit                                │ pInit                         │
     * │ CUIT       │ Non          │ Oui  │ pInit × partCom × rendement          │ pInit × partCom × rendement   │
     * │ CUIT       │ Non          │ Non  │ pInit × partCom                      │ pInit × partCom               │
     * └────────────┴──────────────┴──────┴──────────────────────────────────────┴───────────────────────────────┘
     *
     * Logique clé :
     * - CRU : le rendement cuisson modifie le poids physique final MAIS PAS le poids VN
     *   (les nutriments restent constants, seul le poids de la recette diminue).
     * - CUIT + totalité=Oui : le rendement est ignoré (réchauffage sans changement de masse).
     * - CUIT + totalité=Non : le rendement s'applique aux DEUX poids.
     *
     * @return array{vn: float, quantite: float}
     */
    private function calculerPoids(RecipeIngredient $ri): array
    {
        $ing             = $ri->getIngredient();
        $pInit           = $ri->getPoidsInitial();
        $partCom         = $ri->getEffectivePartComestible();
        $consommeTotal   = ($partCom >= 1.0);
        $alimentCuit     = $ing->isAlimentCuit();
        $rendement       = $ri->isEstCuit() ? $this->getRendementCuisson($ri) : 1.0;

        if (!$alimentCuit) {
            // === ALIMENT CRU ===
            // VN = poids comestible brut (avant cuisson) — les nutriments ne changent pas à la cuisson
            $poidsVN       = $pInit * $partCom;
            // Quantité = poids comestible brut × rendement (si cuit, sinon = VN)
            $poidsQuantite = $poidsVN * $rendement;
        } else {
            // === ALIMENT CUIT ===
            // Les valeurs CIQUAL sont déjà pour l'aliment cuit.
            // Le rendement opérateur s'applique aux deux poids (qu'il y ait part comestible ou non).
            if ($consommeTotal) {
                // Totalité=Oui : pas de part comestible, rendement sur les deux poids
                $poidsVN       = $pInit * $rendement;
                $poidsQuantite = $pInit * $rendement;
            } else {
                // Totalité=Non : part comestible puis rendement sur les deux poids
                $poidsComestible = $pInit * $partCom;
                $poidsVN         = $poidsComestible * $rendement;
                $poidsQuantite   = $poidsComestible * $rendement;
            }
        }

        return ['vn' => $poidsVN, 'quantite' => $poidsQuantite];
    }

    private function getRendementCuisson(RecipeIngredient $ri): float
    {
        // Rendement de base issu de la base CIQUAL (colonne 85 dans l'Excel)
        $rendementCiqual = $ri->getIngredient()->getRendementCuisson() ?? 1.0;

        return match ($ri->getMethodeFriture()) {
            // Friture 1 passage : rendement CIQUAL × 0.9
            RecipeIngredient::FRITURE_1_PASSAGE =>
                $rendementCiqual * self::FACTEUR_FRITURE_1_PASSAGE,

            // Surgelé OU 2 passages+ : même catégorie Excel, rendement CIQUAL × 0.85
            RecipeIngredient::FRITURE_SURGELE,
            RecipeIngredient::FRITURE_2_PASSAGES_PLUS =>
                $rendementCiqual * self::FACTEUR_FRITURE_SURGELE_2PASSAGES,

            // Cuit non frit : rendement CIQUAL sans modification
            // Non cuit : géré en amont (rendement = 1.0 si !estCuit), donc inaccessible ici
            default => $rendementCiqual,
        };
    }

    private function ramenerA100g(array $totaux): array
    {
        $poids = $totaux['poidsFinalTotal'];
        return [
            'energieKj'        => round($totaux['energieKj']        / $poids * 100, 2),
            'energieKcal'      => round($totaux['energieKcal']      / $poids * 100, 2),
            'proteines'        => round($totaux['proteines']        / $poids * 100, 2),
            'glucides'         => round($totaux['glucides']         / $poids * 100, 2),
            'lipides'          => round($totaux['lipides']          / $poids * 100, 2),
            'sucres'           => round($totaux['sucres']           / $poids * 100, 2),
            'fibres'           => round($totaux['fibres']           / $poids * 100, 2),
            'acideGrasSatures' => round($totaux['acideGrasSatures'] / $poids * 100, 2),
            'sodium'           => round($totaux['sodium']           / $poids * 100, 2),
            'sel'              => round($totaux['sel']              / $poids * 100, 2),
            'fruitsLegumesPct' => round($totaux['fruitsLegumesPct'], 2),
        ];
    }

    private function calculerScoreGeneral(array $n): array
    {
        $ptsN = $this->pointsTable($n['energieKj'],        self::POINTS_ENERGIE_KJ)
              + $this->pointsTable($n['sucres'],           self::POINTS_SUCRES)
              + $this->pointsTable($n['acideGrasSatures'], self::POINTS_AGS)
              + $this->pointsTable($n['sodium'],           self::POINTS_SODIUM);

        $ptsFln       = $this->pointsFln($n['fruitsLegumesPct']);
        $ptsFibres    = $this->pointsTable($n['fibres'],    self::POINTS_FIBRES);
        $ptsProteines = $this->pointsTable($n['proteines'], self::POINTS_PROTEINES);

        // Si pts_N ≥ 11 ET pts_FLN < 5, les protéines ne sont pas soustraites
        $ptsP = $ptsFln + $ptsFibres;
        if ($ptsN < 11 || $ptsFln >= 5) {
            $ptsP += $ptsProteines;
        }

        $score = $ptsN - $ptsP;
        return [$score, $this->gradeGeneral($score)];
    }

    private function calculerScoreViande(array $n): array
    {
        return $this->calculerScoreGeneral($n);
    }

    private function calculerScoreBoissons(array $n): array
    {
        $ptsN = $this->pointsTable($n['energieKj'],        self::POINTS_ENERGIE_BOISSONS)
              + $this->pointsTable($n['sucres'],           self::POINTS_SUCRES)
              + $this->pointsTable($n['acideGrasSatures'], self::POINTS_AGS)
              + $this->pointsTable($n['sodium'],           self::POINTS_SODIUM);

        $ptsFln       = $this->pointsFln($n['fruitsLegumesPct']);
        $ptsFibres    = $this->pointsTable($n['fibres'],    self::POINTS_FIBRES);
        $ptsProteines = $this->pointsTable($n['proteines'], self::POINTS_PROTEINES);

        $ptsP = $ptsFln + $ptsFibres;
        if ($ptsN < 11 || $ptsFln >= 5) {
            $ptsP += $ptsProteines;
        }

        $score = $ptsN - $ptsP;
        return [$score, $this->gradeGeneral($score)];
    }

    private function gradeGeneral(int $score): string
    {
        return match (true) {
            $score < 1   => 'A',
            $score <= 2  => 'B',
            $score <= 10 => 'C',
            $score <= 18 => 'D',
            default      => 'E',
        };
    }

    /**
     * Lookup dans une table de seuils [seuil => pts].
     * value ≤ seuil → pts ; value > tous les seuils → count($table) (max : 10 pour N, 5 pour P).
     */
    private function pointsTable(float $value, array $table): int
    {
        foreach ($table as $threshold => $points) {
            if ($value <= $threshold) {
                return $points;
            }
        }
        return count($table);
    }

    /**
     * Points FLN — table non-linéaire (pas de niveaux 3 ni 4).
     * ≤ 40 % → 0 | > 40 % → 1 | > 60 % → 2 | > 80 % → 5
     */
    private function pointsFln(float $value): int
    {
        if ($value > 80) return 5;
        if ($value > 60) return 2;
        if ($value > 40) return 1;
        return 0;
    }
}
