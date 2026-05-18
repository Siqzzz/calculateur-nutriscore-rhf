<?php

namespace App\Service;

use App\Entity\Recipe;
use App\Entity\RecipeIngredient;

class NutriScoreCalculator
{
    // Facteurs de rendement friture (basés sur la feuille "test" de l'Excel)
    private const RENDEMENT_FRITURE_1_PASSAGE = 0.93;
    private const RENDEMENT_FRITURE_SURGELE   = 0.85;
    private const RENDEMENT_FRITURE_2_PASSAGES = 0.80;

    // Tables de points Nutri-Score (aliments généraux et viande)
    // Source : règlement UE Nutri-Score 2023
    private const POINTS_ENERGIE_KJ = [
        335 => 0, 670 => 1, 1005 => 2, 1340 => 3, 1675 => 4,
        2010 => 5, 2345 => 6, 2680 => 7, 3015 => 8, 3350 => 9,
    ];
    private const POINTS_SUCRES = [
        4.5 => 0, 9 => 1, 13.5 => 2, 18 => 3, 22.5 => 4,
        27 => 5, 31 => 6, 36 => 7, 40 => 8, 45 => 9,
    ];
    private const POINTS_AGS = [
        1 => 0, 2 => 1, 3 => 2, 4 => 3, 5 => 4,
        6 => 5, 7 => 6, 8 => 7, 9 => 8, 10 => 9,
    ];
    private const POINTS_SODIUM = [
        90 => 0, 180 => 1, 270 => 2, 360 => 3, 450 => 4,
        540 => 5, 630 => 6, 720 => 7, 810 => 8, 900 => 9,
    ];
    private const POINTS_FIBRES = [
        0.9 => 0, 1.9 => 1, 2.8 => 2, 3.7 => 3, 4.7 => 4,
    ];
    private const POINTS_PROTEINES = [
        1.6 => 0, 3.2 => 1, 4.8 => 2, 6.4 => 3, 8.0 => 4,
    ];
    private const POINTS_FLN = [
        40 => 0, 60 => 1, 80 => 2,
    ];

    // Boissons : seuils énergie différents (kJ/100mL)
    private const POINTS_ENERGIE_BOISSONS = [
        0 => 0, 30 => 1, 60 => 2, 90 => 3, 120 => 4,
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
            'poidsFinalTotal' => 0.0,
            'energieKj'       => 0.0,
            'energieKcal'     => 0.0,
            'proteines'       => 0.0,
            'glucides'        => 0.0,
            'lipides'         => 0.0,
            'sucres'          => 0.0,
            'fibres'          => 0.0,
            'acideGrasSatures'=> 0.0,
            'sodium'          => 0.0,
            'sel'             => 0.0,
            'fruitsLegumesPct'=> 0.0,
        ];

        foreach ($ingredients as $ri) {
            /** @var RecipeIngredient $ri */
            $ing = $ri->getIngredient();

            $partComestible   = $ri->getEffectivePartComestible();
            $rendementCuisson = $this->getRendementCuisson($ri);

            $poidsComestible = $ri->getPoidsInitial() * $partComestible;
            $poidsFinal      = $poidsComestible * $rendementCuisson;

            $ri->setPoidsFinalCalcule($poidsFinal);

            $totaux['poidsFinalTotal'] += $poidsFinal;

            // Valeurs nutritionnelles × poids final / 100
            $facteur = $poidsFinal / 100;
            $totaux['energieKj']        += ($ing->getEnergieKj() ?? 0) * $facteur;
            $totaux['energieKcal']      += ($ing->getEnergieKcal() ?? 0) * $facteur;
            $totaux['proteines']        += ($ing->getProteines() ?? 0) * $facteur;
            $totaux['glucides']         += ($ing->getGlucides() ?? 0) * $facteur;
            $totaux['lipides']          += ($ing->getLipides() ?? 0) * $facteur;
            $totaux['sucres']           += ($ing->getSucres() ?? 0) * $facteur;
            $totaux['fibres']           += ($ing->getFibres() ?? 0) * $facteur;
            $totaux['acideGrasSatures'] += ($ing->getAcideGrasSatures() ?? 0) * $facteur;
            $totaux['sodium']           += ($ing->getSodium() ?? 0) * $facteur;
            $totaux['sel']              += ($ing->getSel() ?? 0) * $facteur;

            // FLN : pondéré par le poids de l'ingrédient
            $totaux['fruitsLegumesPct'] += ($ing->getFruitsLegumesPct() ?? 0) * $poidsFinal;
        }

        // Moyenne pondérée pour FLN
        if ($totaux['poidsFinalTotal'] > 0) {
            $totaux['fruitsLegumesPct'] /= $totaux['poidsFinalTotal'];
        }

        return $totaux;
    }

    private function getRendementCuisson(RecipeIngredient $ri): float
    {
        if (!$ri->isEstCuit()) {
            return 1.0;
        }

        return match ($ri->getMethodeFriture()) {
            RecipeIngredient::FRITURE_1_PASSAGE    => self::RENDEMENT_FRITURE_1_PASSAGE,
            RecipeIngredient::FRITURE_SURGELE      => self::RENDEMENT_FRITURE_SURGELE,
            RecipeIngredient::FRITURE_2_PASSAGES_PLUS => self::RENDEMENT_FRITURE_2_PASSAGES,
            default => $ri->getIngredient()->getRendementCuisson() ?? 1.0,
        };
    }

    private function ramenerA100g(array $totaux): array
    {
        $poids = $totaux['poidsFinalTotal'];
        return [
            'energieKj'        => round($totaux['energieKj'] / $poids * 100, 2),
            'energieKcal'      => round($totaux['energieKcal'] / $poids * 100, 2),
            'proteines'        => round($totaux['proteines'] / $poids * 100, 2),
            'glucides'         => round($totaux['glucides'] / $poids * 100, 2),
            'lipides'          => round($totaux['lipides'] / $poids * 100, 2),
            'sucres'           => round($totaux['sucres'] / $poids * 100, 2),
            'fibres'           => round($totaux['fibres'] / $poids * 100, 2),
            'acideGrasSatures' => round($totaux['acideGrasSatures'] / $poids * 100, 2),
            'sodium'           => round($totaux['sodium'] / $poids * 100, 2),
            'sel'              => round($totaux['sel'] / $poids * 100, 2),
            'fruitsLegumesPct' => round($totaux['fruitsLegumesPct'], 2),
        ];
    }

    private function calculerScoreGeneral(array $n): array
    {
        $ptsN = $this->pointsTable($n['energieKj'], self::POINTS_ENERGIE_KJ)
              + $this->pointsTable($n['sucres'], self::POINTS_SUCRES)
              + $this->pointsTable($n['acideGrasSatures'], self::POINTS_AGS)
              + $this->pointsTable($n['sodium'], self::POINTS_SODIUM);

        $ptsFln      = $this->pointsTable($n['fruitsLegumesPct'], self::POINTS_FLN);
        $ptsFibres   = $this->pointsTable($n['fibres'], self::POINTS_FIBRES);
        $ptsProteines = $this->pointsTable($n['proteines'], self::POINTS_PROTEINES);

        // Règle spéciale : si N >= 11 et FLN < 5, les protéines ne sont pas soustraites
        $ptsP = $ptsFln + $ptsFibres;
        if ($ptsN < 11 || $ptsFln >= 5) {
            $ptsP += $ptsProteines;
        }

        $score = $ptsN - $ptsP;
        return [$score, $this->gradeGeneral($score)];
    }

    private function calculerScoreViande(array $n): array
    {
        // Même algorithme que général pour RHF (simplification)
        return $this->calculerScoreGeneral($n);
    }

    private function calculerScoreBoissons(array $n): array
    {
        $ptsN = $this->pointsTable($n['energieKj'], self::POINTS_ENERGIE_BOISSONS)
              + $this->pointsTable($n['sucres'], self::POINTS_SUCRES)
              + $this->pointsTable($n['acideGrasSatures'], self::POINTS_AGS)
              + $this->pointsTable($n['sodium'], self::POINTS_SODIUM);

        $ptsFln       = $this->pointsTable($n['fruitsLegumesPct'], self::POINTS_FLN);
        $ptsFibres    = $this->pointsTable($n['fibres'], self::POINTS_FIBRES);
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
            $score < 1  => 'A',
            $score <= 2 => 'B',
            $score <= 10 => 'C',
            $score <= 18 => 'D',
            default     => 'E',
        };
    }

    private function pointsTable(float $value, array $table): int
    {
        $pts = count($table) - 1;
        foreach ($table as $threshold => $points) {
            if ($value <= $threshold) {
                return $points;
            }
        }
        return $pts;
    }
}
