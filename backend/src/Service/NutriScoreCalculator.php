<?php

namespace App\Service;

use App\Entity\Recipe;
use App\Entity\RecipeIngredient;

class NutriScoreCalculator
{
    // Facteurs de rendement friture (basés sur la feuille "test" de l'Excel)
    private const RENDEMENT_FRITURE_1_PASSAGE    = 0.93;
    private const RENDEMENT_FRITURE_SURGELE      = 0.85;
    private const RENDEMENT_FRITURE_2_PASSAGES   = 0.80;

    /*
     * Tables de points Nutri-Score — Tableau 1 (composante N, éléments défavorables)
     * Seuil = valeur MAXIMALE pour obtenir le score de la ligne précédente.
     * Ex : énergie ≤ 335 kJ → 0 pt ; > 335 kJ → 1 pt ; > 670 kJ → 2 pts ; … ; > 3350 → 10 pts
     * La fonction pointsTable() retourne count($table) si la valeur dépasse tous les seuils → max = 10.
     */
    private const POINTS_ENERGIE_KJ = [
        335  => 0, 670  => 1, 1005 => 2, 1340 => 3, 1675 => 4,
        2010 => 5, 2345 => 6, 2680 => 7, 3015 => 8, 3350 => 9,
    ];
    private const POINTS_SUCRES = [
        4.5 => 0, 9  => 1, 13.5 => 2, 18 => 3, 22.5 => 4,
        27  => 5, 31 => 6, 36   => 7, 40 => 8, 45   => 9,
    ];
    private const POINTS_AGS = [
        1  => 0, 2 => 1, 3 => 2, 4 => 3, 5  => 4,
        6  => 5, 7 => 6, 8 => 7, 9 => 8, 10 => 9,
    ];
    // Sodium en mg/100g (= sel g/100g × 1000 / 2.5)
    private const POINTS_SODIUM = [
        90  => 0, 180 => 1, 270 => 2, 360 => 3, 450 => 4,
        540 => 5, 630 => 6, 720 => 7, 810 => 8, 900 => 9,
    ];

    /*
     * Tables de points Nutri-Score — Tableau 2 (composante P, éléments favorables)
     * Max = 5 pts pour protéines et fibres.
     * FLN est non-linéaire : 0 → 1 → 2 → (pas de 3 ni 4) → 5 pts pour > 80 %.
     * FLN est traité par la méthode dédiée pointsFln().
     */
    private const POINTS_FIBRES = [
        0.9 => 0, 1.9 => 1, 2.8 => 2, 3.7 => 3, 4.7 => 4,
        // > 4.7 → 5 pts via le fallback count($table)
    ];
    private const POINTS_PROTEINES = [
        1.6 => 0, 3.2 => 1, 4.8 => 2, 6.4 => 3, 8.0 => 4,
        // > 8.0 → 5 pts via le fallback count($table)
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
            'poidsFinalTotal'  => 0.0,   // poids cuit (part comestible × rendement cuisson)
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

            $partComestible   = $ri->getEffectivePartComestible();
            $rendementCuisson = $this->getRendementCuisson($ri);

            // Poids comestible brut (avant cuisson) — base pour les valeurs nutritionnelles CIQUAL
            $poidsComestible = $ri->getPoidsInitial() * $partComestible;

            // Poids final cuit — base pour le poids total de la recette
            $poidsFinal = $poidsComestible * $rendementCuisson;

            $ri->setPoidsFinalCalcule($poidsFinal);

            // Le poids total de la recette utilise le poids APRÈS cuisson
            $totaux['poidsFinalTotal'] += $poidsFinal;

            // Les valeurs nutritionnelles CIQUAL sont exprimées pour 100 g de produit brut comestible.
            // On pondère donc par le poids comestible brut (avant cuisson).
            $facteurNutri = $poidsComestible / 100;
            $totaux['energieKj']        += ($ing->getEnergieKj() ?? 0)        * $facteurNutri;
            $totaux['energieKcal']      += ($ing->getEnergieKcal() ?? 0)      * $facteurNutri;
            $totaux['proteines']        += ($ing->getProteines() ?? 0)        * $facteurNutri;
            $totaux['glucides']         += ($ing->getGlucides() ?? 0)         * $facteurNutri;
            $totaux['lipides']          += ($ing->getLipides() ?? 0)          * $facteurNutri;
            $totaux['sucres']           += ($ing->getSucres() ?? 0)           * $facteurNutri;
            $totaux['fibres']           += ($ing->getFibres() ?? 0)           * $facteurNutri;
            $totaux['acideGrasSatures'] += ($ing->getAcideGrasSatures() ?? 0) * $facteurNutri;
            $totaux['sodium']           += ($ing->getSodium() ?? 0)           * $facteurNutri;
            $totaux['sel']              += ($ing->getSel() ?? 0)              * $facteurNutri;

            // FLN : moyenne pondérée par le poids comestible brut
            $totaux['fruitsLegumesPct'] += ($ing->getFruitsLegumesPct() ?? 0) * $poidsComestible;
        }

        // Moyenne pondérée FLN (dénominateur = poids comestible total, recalculé ici)
        $poidsComestibleTotal = array_sum(
            array_map(
                fn(RecipeIngredient $ri) => $ri->getPoidsInitial() * $ri->getEffectivePartComestible(),
                $ingredients
            )
        );
        if ($poidsComestibleTotal > 0) {
            $totaux['fruitsLegumesPct'] /= $poidsComestibleTotal;
        }

        return $totaux;
    }

    private function getRendementCuisson(RecipeIngredient $ri): float
    {
        if (!$ri->isEstCuit()) {
            return 1.0;
        }

        return match ($ri->getMethodeFriture()) {
            RecipeIngredient::FRITURE_1_PASSAGE       => self::RENDEMENT_FRITURE_1_PASSAGE,
            RecipeIngredient::FRITURE_SURGELE         => self::RENDEMENT_FRITURE_SURGELE,
            RecipeIngredient::FRITURE_2_PASSAGES_PLUS => self::RENDEMENT_FRITURE_2_PASSAGES,
            default => $ri->getIngredient()->getRendementCuisson() ?? 1.0,
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

        // Règle : si pts_N ≥ 11 ET pts_FLN < 5, les protéines ne sont pas soustraites
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
     * Lookup générique dans une table de seuils.
     * Chaque entrée [seuil => pts] signifie : value ≤ seuil → pts.
     * Si la valeur dépasse tous les seuils, retourne count($table) (= max + 1).
     * Cela donne 10 pour les tables N à 10 entrées, et 5 pour les tables P à 5 entrées.
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
     * Points FLN (Fruits, Légumes, Légumineuses, fruits à coques, huiles végétales).
     * Table non-linéaire : les niveaux 3 et 4 n'existent pas.
     * ≤ 40 % → 0 pt | > 40 % → 1 pt | > 60 % → 2 pts | > 80 % → 5 pts
     */
    private function pointsFln(float $value): int
    {
        if ($value > 80) {
            return 5;
        }
        if ($value > 60) {
            return 2;
        }
        if ($value > 40) {
            return 1;
        }
        return 0;
    }
}
