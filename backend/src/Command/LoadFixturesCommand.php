<?php

namespace App\Command;

use App\Entity\Ingredient;
use App\Entity\Recipe;
use App\Entity\RecipeIngredient;
use App\Service\NutriScoreCalculator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:load-fixtures', description: 'Charge des données de démonstration (recettes + ingrédients personnalisés)')]
class LoadFixturesCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private NutriScoreCalculator $calculator,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('reset', null, InputOption::VALUE_NONE, 'Supprime toutes les recettes et ingrédients personnalisés avant de charger');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Chargement des données de démonstration');

        if ($input->getOption('reset')) {
            $this->reset($io);
        }

        $ingredients = $this->loadIngredients($io);
        $this->loadRecipes($ingredients, $io);

        $io->success('Données de démonstration chargées avec succès.');
        return Command::SUCCESS;
    }

    private function reset(SymfonyStyle $io): void
    {
        $io->section('Nettoyage des données existantes');

        foreach ($this->em->getRepository(Recipe::class)->findAll() as $r) {
            $this->em->remove($r);
        }
        foreach ($this->em->getRepository(Ingredient::class)->findBy(['estPersonnalise' => true]) as $i) {
            $this->em->remove($i);
        }
        $this->em->flush();

        $io->writeln('  Recettes et ingrédients personnalisés supprimés.');
    }

    /** @return array<string, Ingredient> */
    private function loadIngredients(SymfonyStyle $io): array
    {
        $io->section('Création des ingrédients personnalisés');

        $definitions = [
            'Poulet rôti maison' => [
                'groupe' => 'Viandes et charcuteries',
                'energieKj' => 736,   'energieKcal' => 175,
                'proteines' => 25.0,  'glucides' => 0.0,  'lipides' => 7.5,
                'sucres' => 0.0,      'fibres' => 0.0,    'acideGrasSatures' => 2.1,
                'sodium' => 320,      'sel' => 0.81,
                'partComestible' => 0.72, 'rendementCuisson' => 0.75, 'alimentCuit' => true,
            ],
            'Sauce tomate concassée maison' => [
                'groupe' => 'Sauces et condiments',
                'energieKj' => 155,   'energieKcal' => 37,
                'proteines' => 1.8,   'glucides' => 6.2,  'lipides' => 0.3,
                'sucres' => 5.8,      'fibres' => 1.5,    'acideGrasSatures' => 0.05,
                'sodium' => 230,      'sel' => 0.58,
                'fruitsLegumesPct' => 85.0,
                'partComestible' => 1.0, 'rendementCuisson' => 0.9,
            ],
            'Riz basmati cuit maison' => [
                'groupe' => 'Céréales et féculents',
                'energieKj' => 577,   'energieKcal' => 136,
                'proteines' => 2.8,   'glucides' => 29.5, 'lipides' => 0.4,
                'sucres' => 0.1,      'fibres' => 0.4,    'acideGrasSatures' => 0.1,
                'sodium' => 4,        'sel' => 0.01,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0, 'alimentCuit' => true,
            ],
            'Vinaigrette huile d\'olive maison' => [
                'groupe' => 'Sauces et condiments',
                'energieKj' => 2230,  'energieKcal' => 540,
                'proteines' => 0.2,   'glucides' => 3.0,  'lipides' => 58.0,
                'sucres' => 1.5,      'fibres' => 0.0,    'acideGrasSatures' => 8.2,
                'sodium' => 580,      'sel' => 1.47,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
            'Fromage râpé emmental maison' => [
                'groupe' => 'Produits laitiers',
                'energieKj' => 1644,  'energieKcal' => 395,
                'proteines' => 28.5,  'glucides' => 1.5,  'lipides' => 30.8,
                'sucres' => 0.5,      'fibres' => 0.0,    'acideGrasSatures' => 19.5,
                'sodium' => 560,      'sel' => 1.42,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
            'Lait demi-écrémé maison' => [
                'groupe' => 'Produits laitiers',
                'energieKj' => 195,   'energieKcal' => 46,
                'proteines' => 3.2,   'glucides' => 4.8,  'lipides' => 1.6,
                'sucres' => 4.8,      'fibres' => 0.0,    'acideGrasSatures' => 1.0,
                'sodium' => 43,       'sel' => 0.11,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
            'Farine T65 maison' => [
                'groupe' => 'Céréales et féculents',
                'energieKj' => 1456,  'energieKcal' => 343,
                'proteines' => 10.5,  'glucides' => 70.0, 'lipides' => 1.2,
                'sucres' => 1.0,      'fibres' => 2.5,    'acideGrasSatures' => 0.2,
                'sodium' => 3,        'sel' => 0.01,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
            'Beurre doux artisanal' => [
                'groupe' => 'Corps gras',
                'energieKj' => 3041,  'energieKcal' => 737,
                'proteines' => 0.7,   'glucides' => 0.7,  'lipides' => 81.5,
                'sucres' => 0.7,      'fibres' => 0.0,    'acideGrasSatures' => 52.0,
                'sodium' => 11,       'sel' => 0.03,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
            'Jus d\'orange pressé maison' => [
                'groupe' => 'Boissons',
                'energieKj' => 190,   'energieKcal' => 45,
                'proteines' => 0.7,   'glucides' => 10.0, 'lipides' => 0.2,
                'sucres' => 9.5,      'fibres' => 0.2,    'acideGrasSatures' => 0.02,
                'sodium' => 2,        'sel' => 0.005,
                'fruitsLegumesPct' => 100.0,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
            'Épinards frais maison' => [
                'groupe' => 'Légumes',
                'energieKj' => 97,    'energieKcal' => 23,
                'proteines' => 2.9,   'glucides' => 1.4,  'lipides' => 0.4,
                'sucres' => 0.4,      'fibres' => 2.2,    'acideGrasSatures' => 0.06,
                'sodium' => 65,       'sel' => 0.17,
                'fruitsLegumesPct' => 100.0,
                'partComestible' => 0.95, 'rendementCuisson' => 0.7,
            ],
            'Pommes de terre maison' => [
                'groupe' => 'Légumes',
                'energieKj' => 340,   'energieKcal' => 80,
                'proteines' => 2.0,   'glucides' => 17.0, 'lipides' => 0.1,
                'sucres' => 0.8,      'fibres' => 1.8,    'acideGrasSatures' => 0.03,
                'sodium' => 7,        'sel' => 0.02,
                'fruitsLegumesPct' => 0.0,
                'partComestible' => 0.85, 'rendementCuisson' => 0.95, 'alimentCuit' => true,
            ],
            'Crème fraîche épaisse maison' => [
                'groupe' => 'Produits laitiers',
                'energieKj' => 1296,  'energieKcal' => 314,
                'proteines' => 2.0,   'glucides' => 2.8,  'lipides' => 32.0,
                'sucres' => 2.8,      'fibres' => 0.0,    'acideGrasSatures' => 21.0,
                'sodium' => 38,       'sel' => 0.10,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
            'Smoothie fruits rouges maison' => [
                'groupe' => 'Boissons',
                'energieKj' => 230,   'energieKcal' => 55,
                'proteines' => 0.8,   'glucides' => 12.0, 'lipides' => 0.3,
                'sucres' => 11.5,     'fibres' => 1.2,    'acideGrasSatures' => 0.05,
                'sodium' => 5,        'sel' => 0.01,
                'fruitsLegumesPct' => 100.0,
                'partComestible' => 1.0, 'rendementCuisson' => 1.0,
            ],
        ];

        $result = [];
        $created = 0;

        foreach ($definitions as $nom => $vals) {
            $existing = $this->em->getRepository(Ingredient::class)->findOneBy(['nom' => $nom]);
            if ($existing) {
                $result[$nom] = $existing;
                continue;
            }

            $ing = new Ingredient();
            $ing->setNom($nom);
            $ing->setGroupeNom($vals['groupe'] ?? null);
            $ing->setEnergieKj((float) ($vals['energieKj'] ?? 0));
            $ing->setEnergieKcal((float) ($vals['energieKcal'] ?? 0));
            $ing->setProteines((float) ($vals['proteines'] ?? 0));
            $ing->setGlucides((float) ($vals['glucides'] ?? 0));
            $ing->setLipides((float) ($vals['lipides'] ?? 0));
            $ing->setSucres((float) ($vals['sucres'] ?? 0));
            $ing->setFibres((float) ($vals['fibres'] ?? 0));
            $ing->setAcideGrasSatures((float) ($vals['acideGrasSatures'] ?? 0));
            $ing->setSodium((float) ($vals['sodium'] ?? 0));
            $ing->setSel((float) ($vals['sel'] ?? 0));
            $ing->setFruitsLegumesPct((float) ($vals['fruitsLegumesPct'] ?? 0));
            $ing->setPartComestible((float) ($vals['partComestible'] ?? 1.0));
            $ing->setRendementCuisson((float) ($vals['rendementCuisson'] ?? 1.0));
            $ing->setAlimentCuit((bool) ($vals['alimentCuit'] ?? false));
            $ing->setEstPersonnalise(true);

            $this->em->persist($ing);
            $result[$nom] = $ing;
            $created++;
        }

        $this->em->flush();
        $io->writeln(sprintf('  %d ingrédient(s) créé(s).', $created));

        return $result;
    }

    /** @param array<string, Ingredient> $ings */
    private function loadRecipes(array $ings, SymfonyStyle $io): void
    {
        $io->section('Création des recettes');

        $definitions = [
            [
                'nom' => 'Poulet rôti aux épinards',
                'type' => Recipe::TYPE_VIANDE,
                'lignes' => [
                    ['nom' => 'Poulet rôti maison',            'poids' => 300, 'cuit' => false],
                    ['nom' => 'Épinards frais maison',         'poids' => 200, 'cuit' => true],
                    ['nom' => 'Sauce tomate concassée maison', 'poids' => 100, 'cuit' => false],
                ],
            ],
            [
                'nom' => 'Riz au poulet sauce tomate',
                'type' => Recipe::TYPE_GENERAL,
                'lignes' => [
                    ['nom' => 'Riz basmati cuit maison',       'poids' => 250, 'cuit' => false],
                    ['nom' => 'Poulet rôti maison',            'poids' => 150, 'cuit' => false],
                    ['nom' => 'Sauce tomate concassée maison', 'poids' => 120, 'cuit' => false],
                ],
            ],
            [
                'nom' => 'Gratin dauphinois',
                'type' => Recipe::TYPE_GENERAL,
                'lignes' => [
                    ['nom' => 'Pommes de terre maison',        'poids' => 500, 'cuit' => false],
                    ['nom' => 'Crème fraîche épaisse maison',  'poids' => 200, 'cuit' => false],
                    ['nom' => 'Fromage râpé emmental maison',  'poids' => 80,  'cuit' => false],
                    ['nom' => 'Lait demi-écrémé maison',       'poids' => 100, 'cuit' => false],
                ],
            ],
            [
                'nom' => 'Salade d\'épinards vinaigrette',
                'type' => Recipe::TYPE_GENERAL,
                'lignes' => [
                    ['nom' => 'Épinards frais maison',              'poids' => 200, 'cuit' => false],
                    ['nom' => 'Vinaigrette huile d\'olive maison',  'poids' => 30,  'cuit' => false],
                    ['nom' => 'Sauce tomate concassée maison',      'poids' => 50,  'cuit' => false],
                ],
            ],
            [
                'nom' => 'Jus d\'orange pressé du matin',
                'type' => Recipe::TYPE_BOISSONS,
                'lignes' => [
                    ['nom' => 'Jus d\'orange pressé maison', 'poids' => 250, 'cuit' => false],
                ],
            ],
            [
                'nom' => 'Sauce béchamel maison',
                'type' => Recipe::TYPE_GENERAL,
                'lignes' => [
                    ['nom' => 'Farine T65 maison',        'poids' => 50,  'cuit' => false],
                    ['nom' => 'Beurre doux artisanal',    'poids' => 50,  'cuit' => false],
                    ['nom' => 'Lait demi-écrémé maison',  'poids' => 500, 'cuit' => false],
                ],
            ],
            [
                'nom' => 'Lasagnes bolognaise',
                'type' => Recipe::TYPE_VIANDE,
                'lignes' => [
                    ['nom' => 'Poulet rôti maison',            'poids' => 200, 'cuit' => false],
                    ['nom' => 'Sauce tomate concassée maison', 'poids' => 200, 'cuit' => false],
                    ['nom' => 'Farine T65 maison',             'poids' => 60,  'cuit' => false],
                    ['nom' => 'Beurre doux artisanal',         'poids' => 40,  'cuit' => false],
                    ['nom' => 'Lait demi-écrémé maison',       'poids' => 300, 'cuit' => false],
                    ['nom' => 'Fromage râpé emmental maison',  'poids' => 60,  'cuit' => false],
                ],
            ],
            [
                'nom' => 'Soupe aux épinards et pommes de terre',
                'type' => Recipe::TYPE_GENERAL,
                'lignes' => [
                    ['nom' => 'Épinards frais maison',     'poids' => 200, 'cuit' => true],
                    ['nom' => 'Pommes de terre maison',    'poids' => 300, 'cuit' => true],
                    ['nom' => 'Lait demi-écrémé maison',   'poids' => 200, 'cuit' => false],
                    ['nom' => 'Beurre doux artisanal',     'poids' => 20,  'cuit' => false],
                ],
            ],
            [
                'nom' => 'Smoothie fruits rouges',
                'type' => Recipe::TYPE_BOISSONS,
                'lignes' => [
                    ['nom' => 'Smoothie fruits rouges maison', 'poids' => 300, 'cuit' => false],
                    ['nom' => 'Lait demi-écrémé maison',       'poids' => 100, 'cuit' => false],
                ],
            ],
            [
                'nom' => 'Gratin de riz au fromage',
                'type' => Recipe::TYPE_GENERAL,
                'lignes' => [
                    ['nom' => 'Riz basmati cuit maison',      'poids' => 300, 'cuit' => false],
                    ['nom' => 'Fromage râpé emmental maison', 'poids' => 100, 'cuit' => false],
                    ['nom' => 'Crème fraîche épaisse maison', 'poids' => 100, 'cuit' => false],
                ],
            ],
        ];

        $created = 0;
        foreach ($definitions as $def) {
            $existing = $this->em->getRepository(Recipe::class)->findOneBy(['nom' => $def['nom']]);
            if ($existing) {
                continue;
            }

            $recipe = new Recipe();
            $recipe->setNom($def['nom']);
            $recipe->setType($def['type']);

            foreach ($def['lignes'] as $pos => $ligne) {
                $ingredient = $ings[$ligne['nom']] ?? null;
                if (!$ingredient) {
                    $io->warning(sprintf('Ingrédient introuvable "%s" pour la recette "%s" — ignoré.', $ligne['nom'], $def['nom']));
                    continue;
                }

                $ri = new RecipeIngredient();
                $ri->setIngredient($ingredient);
                $ri->setPoidsInitial((float) $ligne['poids']);
                $ri->setEstCuit((bool) $ligne['cuit']);
                $ri->setPosition($pos);

                $recipe->addRecipeIngredient($ri);
                $this->em->persist($ri);
            }

            $this->em->persist($recipe);
            $this->em->flush();

            $result = $this->calculator->calculate($recipe);
            $recipe->setScoreNutri($result['score']);
            $recipe->setGradeNutri($result['grade']);
            if (!empty($result['nutrition'])) {
                $recipe->setNutriNutrition($result['nutrition']);
            }

            $this->em->flush();

            $grade = $result['grade'] ?? '?';
            $score = $result['score'] ?? '?';
            $io->writeln(sprintf('  %-40s → %s (score %s)', $def['nom'], $grade, $score));
            $created++;
        }

        $io->writeln(sprintf('  %d recette(s) créée(s).', $created));
    }
}
