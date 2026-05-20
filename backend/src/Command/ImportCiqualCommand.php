<?php

namespace App\Command;

use App\Entity\EdiblePortion;
use App\Entity\Ingredient;
use Doctrine\ORM\EntityManagerInterface;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:import-ciqual',
    description: 'Importe les ingrédients CIQUAL et les rendements depuis le fichier Excel RHF',
)]
class ImportCiqualCommand extends Command
{
    private const BATCH_SIZE = 100;

    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument(
            'fichier',
            InputArgument::OPTIONAL,
            'Chemin vers le fichier .xlsm',
            '/data/Calculateur_RHF.xlsm'
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $fichier = $input->getArgument('fichier');

        if (!file_exists($fichier)) {
            $io->error("Fichier introuvable : $fichier");
            return Command::FAILURE;
        }

        $io->info("Chargement du fichier Excel (peut prendre quelques minutes)...");

        $sheetsToLoad = ['Part comestible-Rendement', 'Feuille calcul CIQ+BDD', 'Base de données'];
        $reader = IOFactory::createReaderForFile($fichier);
        $reader->setLoadSheetsOnly($sheetsToLoad);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($fichier);

        $io->section('Import des rendements de cuisson (Part comestible-Rendement)');
        $this->importEdiblePortions($spreadsheet, $io);

        $io->section('Import des ingrédients CIQUAL (Feuille calcul CIQ+BDD)');
        $this->importIngredients($spreadsheet, $io);

        $io->success('Import terminé avec succès.');
        return Command::SUCCESS;
    }

    private function importEdiblePortions(\PhpOffice\PhpSpreadsheet\Spreadsheet $spreadsheet, SymfonyStyle $io): void
    {
        try {
            $sheet = $spreadsheet->getSheetByName('Part comestible-Rendement');
        } catch (\Exception $e) {
            $io->warning('Feuille "Part comestible-Rendement" introuvable, import ignoré.');
            return;
        }

        // Supprimer les anciens enregistrements
        $this->em->createQuery('DELETE FROM App\Entity\EdiblePortion')->execute();

        $rowCount = 0;
        foreach ($sheet->getRowIterator(2) as $row) {
            $cells = $row->getCellIterator('A', 'F');
            $cells->setIterateOnlyExistingCells(false);
            $data = [];
            foreach ($cells as $cell) {
                $data[] = $cell->getValue();
            }

            $categorie = $data[0] ?? null;
            $sousCat   = $data[1] ?? null;

            if (empty($categorie) && empty($sousCat)) {
                continue;
            }

            $ep = new EdiblePortion();
            $ep->setCategorie($categorie ? (string) $categorie : null);
            $ep->setSousCategorie($sousCat ? (string) $sousCat : null);
            $ep->setPartComestible($this->toFloat($data[2] ?? null));
            $ep->setCommentairePartComestible(isset($data[3]) ? (string) $data[3] : null);
            $ep->setRendementCuisson($this->toFloat($data[4] ?? null));
            $ep->setCommentaireRendement(isset($data[5]) ? (string) $data[5] : null);

            $this->em->persist($ep);
            $rowCount++;

            if ($rowCount % self::BATCH_SIZE === 0) {
                $this->em->flush();
                $this->em->clear(EdiblePortion::class);
                $io->write('.');
            }
        }

        $this->em->flush();
        $this->em->clear(EdiblePortion::class);
        $io->newLine();
        $io->writeln("<info>$rowCount rendements importés</info>");
    }

    private function importIngredients(\PhpOffice\PhpSpreadsheet\Spreadsheet $spreadsheet, SymfonyStyle $io): void
    {
        $sheetName = 'Feuille calcul CIQ+BDD';
        $sheet = $spreadsheet->getSheetByName($sheetName);

        if (!$sheet) {
            $io->warning("Feuille \"$sheetName\" introuvable, tentative avec \"Base de données\".");
            $sheet = $spreadsheet->getSheetByName('Base de données');
        }

        if (!$sheet) {
            $io->error('Aucune feuille de données ingrédients trouvée.');
            return;
        }

        // Lire la ligne d'en-tête pour trouver les colonnes
        $headers = [];
        foreach ($sheet->getRowIterator(1, 1) as $row) {
            $cells = $row->getCellIterator();
            $cells->setIterateOnlyExistingCells(false);
            $col = 0;
            foreach ($cells as $cell) {
                $headers[$col] = trim((string) ($cell->getValue() ?? ''));
                $col++;
            }
        }

        $colMap = $this->buildColumnMap($headers);
        $io->writeln('Colonnes détectées : ' . implode(', ', array_keys($colMap)));

        // Supprimer les anciens ingrédients
        $this->em->createQuery('DELETE FROM App\Entity\Ingredient')->execute();

        $progressBar = $io->createProgressBar();
        $progressBar->start();
        $rowCount = 0;
        $skipped  = 0;
        $nomsInseres = []; // pour éviter les doublons

        foreach ($sheet->getRowIterator(2) as $row) {
            $cells = $row->getCellIterator();
            $cells->setIterateOnlyExistingCells(false);
            $data = [];
            $col = 0;
            foreach ($cells as $cell) {
                $data[$col] = $cell->getValue();
                $col++;
            }

            $nom = isset($colMap['nom']) ? trim((string) ($data[$colMap['nom']] ?? '')) : null;

            if (empty($nom) || $nom === 'Ingrédients' || isset($nomsInseres[$nom])) {
                $skipped++;
                continue;
            }
            $nomsInseres[$nom] = true;

            $ing = new Ingredient();
            $ing->setNom($nom);
            $ing->setAlimentCode(isset($colMap['alim_code']) ? (string) ($data[$colMap['alim_code']] ?? '') : null);
            $ing->setGroupeNom(isset($colMap['grp_nom']) ? (string) ($data[$colMap['grp_nom']] ?? null) : null);
            $ing->setSousGroupeNom(isset($colMap['ssgrp_nom']) ? (string) ($data[$colMap['ssgrp_nom']] ?? null) : null);

            $ing->setEnergieKj($this->col($data, $colMap, 'energie_kj'));
            $ing->setEnergieKcal($this->col($data, $colMap, 'energie_kcal'));
            $ing->setProteines($this->col($data, $colMap, 'proteines'));
            $ing->setGlucides($this->col($data, $colMap, 'glucides'));
            $ing->setLipides($this->col($data, $colMap, 'lipides'));
            $ing->setSucres($this->col($data, $colMap, 'sucres'));
            $ing->setFibres($this->col($data, $colMap, 'fibres'));
            $ing->setAcideGrasSatures($this->col($data, $colMap, 'ags'));
            $ing->setSodium($this->col($data, $colMap, 'sodium'));
            // Sel = sodium × 400/1000 si absent de la feuille
            $sel = $this->col($data, $colMap, 'sel');
            if ($sel === null) {
                $sodium = $ing->getSodium();
                $sel = $sodium !== null ? round($sodium * 0.4 / 100, 4) : null;
            }
            $ing->setSel($sel);
            $ing->setFruitsLegumesPct($this->col($data, $colMap, 'fln_pct'));
            $ing->setPartComestible($this->col($data, $colMap, 'part_comestible'));
            $ing->setRendementCuisson($this->col($data, $colMap, 'rendement'));

            $ing->setAlimentCuit($this->detecterAlimentCuit($nom));

            if (isset($colMap['pct_viande_rouge'])) {
                $pct = $this->toFloat($data[$colMap['pct_viande_rouge']] ?? null);
                if ($pct !== null && $pct > 0) {
                    $ing->setEstViandeRouge(true);
                    $ing->setPctViandeRouge($pct);
                }
            }

            if (isset($colMap['edulcorant'])) {
                $edu = strtoupper(trim((string) ($data[$colMap['edulcorant']] ?? '')));
                $ing->setPresenceEdulorant($edu === 'OUI');
            }

            $this->em->persist($ing);
            $rowCount++;

            if ($rowCount % self::BATCH_SIZE === 0) {
                $this->em->flush();
                $this->em->clear(Ingredient::class);
                $progressBar->advance(self::BATCH_SIZE);
            }
        }

        $this->em->flush();
        $this->em->clear(Ingredient::class);
        $progressBar->finish();
        $io->newLine(2);
        $io->writeln("<info>$rowCount ingrédients importés ($skipped lignes ignorées)</info>");
    }

    private function buildColumnMap(array $headers): array
    {
        $map = [];
        foreach ($headers as $col => $header) {
            // mb_strtolower pour gérer correctement les accents UTF-8
            $h = mb_strtolower(trim((string) $header), 'UTF-8');

            // Nom de l'ingrédient — plusieurs noms possibles selon la feuille
            if ($h === 'alim_nom_fr' || $h === 'ingrédients' || $h === 'ingredients'
                || str_contains($h, 'alim_nom_fr') || str_contains($h, 'ingrédient')) {
                $map['nom'] = $col;
            } elseif ($h === 'alim_code') {
                $map['alim_code'] = $col;
            } elseif ($h === 'alim_grp_nom_fr') {
                $map['grp_nom'] = $col;
            } elseif ($h === 'alim_ssgrp_nom_fr') {
                $map['ssgrp_nom'] = $col;
            }
            // Énergie kJ — priorité au règlement UE 1169/2011
            elseif (str_contains($h, 'nergie') && str_contains($h, 'kj') && !isset($map['energie_kj'])) {
                $map['energie_kj'] = $col;
            } elseif (str_contains($h, 'nergie') && str_contains($h, 'kcal') && !isset($map['energie_kcal'])) {
                $map['energie_kcal'] = $col;
            }
            // Macronutriments — prendre "N x facteur de Jones" en priorité pour les protéines
            elseif (str_contains($h, 'prot') && str_contains($h, 'jones') && str_contains($h, 'g/100')) {
                $map['proteines'] = $col;
            } elseif (str_contains($h, 'prot') && str_contains($h, 'g/100') && !isset($map['proteines'])) {
                $map['proteines'] = $col;
            } elseif (str_contains($h, 'glucides') && str_contains($h, 'g/100')) {
                $map['glucides'] = $col;
            } elseif (str_contains($h, 'lipides') && str_contains($h, 'g/100')) {
                $map['lipides'] = $col;
            } elseif (str_contains($h, 'sucres') && str_contains($h, 'g/100')) {
                $map['sucres'] = $col;
            } elseif (str_contains($h, 'fibres') && str_contains($h, 'g/100')) {
                $map['fibres'] = $col;
            } elseif ((str_contains($h, 'satur') || str_contains($h, 'ags')) && str_contains($h, 'g/100')) {
                $map['ags'] = $col;
            } elseif (str_contains($h, 'sodium') && (str_contains($h, 'mg/100') || str_contains($h, 'g/100'))) {
                $map['sodium'] = $col;
            } elseif (str_contains($h, 'sel') && str_contains($h, 'g/100')) {
                $map['sel'] = $col;
            }
            // FLN — % fruits, légumes, légumineuses
            elseif (str_contains($h, 'fruits') || str_contains($h, 'l') && str_contains($h, 'gumes')) {
                $map['fln_pct'] = $col;
            } elseif (str_contains($h, 'part comestible') || $h === 'part_comestible') {
                $map['part_comestible'] = $col;
            } elseif (str_contains($h, 'rendement') || $h === 'rendement_cuisson') {
                $map['rendement'] = $col;
            } elseif (str_contains($h, 'viande rouge') && str_contains($h, '%')) {
                $map['pct_viande_rouge'] = $col;
            } elseif (str_contains($h, 'dulcorant')) {
                $map['edulcorant'] = $col;
            }
        }
        return $map;
    }

    private function detecterAlimentCuit(string $nom): bool
    {
        $n = mb_strtolower($nom, 'UTF-8');
        $motsCles = [
            'cuit', 'cuite', 'cuits', 'cuites',
            'rôti', 'rôtie', 'grillé', 'grillée',
            'poché', 'pochée', 'poêlé', 'poêlée',
            'frit', 'frite', 'bouilli', 'bouillie',
            'braisé', 'braisée', 'sauté', 'sautée',
            'fumé', 'fumée', 'à l\'eau', 'au four', 'à la vapeur',
            'en conserve', 'appertisé', 'stérilisé',
        ];
        foreach ($motsCles as $mot) {
            if (str_contains($n, $mot)) {
                return true;
            }
        }
        return false;
    }

    /** Accès sécurisé à une colonne optionnelle du colMap */
    private function col(array $data, array $colMap, string $key): ?float
    {
        if (!isset($colMap[$key])) {
            return null;
        }
        return $this->toFloat($data[$colMap[$key]] ?? null);
    }

    private function toFloat(mixed $value): ?float
    {
        if ($value === null || $value === '' || $value === '-') {
            return null;
        }
        $v = str_replace(',', '.', (string) $value);
        if (!is_numeric($v)) {
            return null;
        }
        return (float) $v;
    }
}
