<?php

namespace App\Controller\Api;

use App\Entity\Recipe;
use App\Entity\RecipeIngredient;
use App\Repository\IngredientRepository;
use App\Repository\RecipeRepository;
use App\Service\NutriScoreCalculator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/recipes', name: 'api_recipes_')]
class RecipeController extends AbstractController
{
    public function __construct(
        private readonly RecipeRepository $recipeRepo,
        private readonly IngredientRepository $ingRepo,
        private readonly EntityManagerInterface $em,
        private readonly NutriScoreCalculator $calculator,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $recipes = $this->recipeRepo->findAll();
        return $this->json(array_map(fn($r) => $r->toArray(), $recipes));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['nom'])) {
            return $this->json(['error' => 'Le champ "nom" est requis'], 400);
        }

        $validTypes = [Recipe::TYPE_GENERAL, Recipe::TYPE_VIANDE, Recipe::TYPE_BOISSONS];
        $type = $data['type'] ?? Recipe::TYPE_GENERAL;
        if (!in_array($type, $validTypes, true)) {
            return $this->json(['error' => 'Type invalide. Valeurs acceptées : ' . implode(', ', $validTypes)], 400);
        }

        $recipe = new Recipe();
        $recipe->setNom($data['nom']);
        $recipe->setType($type);

        $this->em->persist($recipe);
        $this->em->flush();

        return $this->json($recipe->toArray(), 201);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function get(int $id): JsonResponse
    {
        $recipe = $this->recipeRepo->find($id);
        if (!$recipe) {
            return $this->json(['error' => 'Recette introuvable'], 404);
        }
        return $this->json($recipe->toArray());
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $recipe = $this->recipeRepo->find($id);
        if (!$recipe) {
            return $this->json(['error' => 'Recette introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if (!empty($data['nom'])) {
            $recipe->setNom($data['nom']);
        }

        $this->em->flush();
        return $this->json($recipe->toArray());
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $recipe = $this->recipeRepo->find($id);
        if (!$recipe) {
            return $this->json(['error' => 'Recette introuvable'], 404);
        }

        $this->em->remove($recipe);
        $this->em->flush();

        return $this->json(null, 204);
    }

    #[Route('/{id}/ingredients', name: 'add_ingredient', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function addIngredient(int $id, Request $request): JsonResponse
    {
        $recipe = $this->recipeRepo->find($id);
        if (!$recipe) {
            return $this->json(['error' => 'Recette introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['ingredientId'])) {
            return $this->json(['error' => 'Le champ "ingredientId" est requis'], 400);
        }

        $ingredient = $this->ingRepo->find($data['ingredientId']);
        if (!$ingredient) {
            return $this->json(['error' => 'Ingrédient introuvable'], 404);
        }

        $ri = new RecipeIngredient();
        $ri->setIngredient($ingredient);
        $ri->setPoidsInitial((float) ($data['poidsInitial'] ?? 0));
        $ri->setEstCuit((bool) ($data['estCuit'] ?? false));
        $ri->setMethodeFriture($data['methodeFriture'] ?? RecipeIngredient::FRITURE_NON);
        $ri->setPartComestibleOverride(isset($data['partComestibleOverride']) ? (float) $data['partComestibleOverride'] : null);
        $ri->setPosition((int) ($data['position'] ?? $recipe->getRecipeIngredients()->count()));

        $recipe->addRecipeIngredient($ri);
        $this->em->persist($ri);
        $this->em->flush();

        return $this->json($recipe->toArray(), 201);
    }

    #[Route('/{id}/ingredients/{riId}', name: 'update_ingredient', methods: ['PATCH'], requirements: ['id' => '\d+', 'riId' => '\d+'])]
    public function updateIngredient(int $id, int $riId, Request $request): JsonResponse
    {
        $recipe = $this->recipeRepo->find($id);
        if (!$recipe) {
            return $this->json(['error' => 'Recette introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true);

        foreach ($recipe->getRecipeIngredients() as $ri) {
            if ($ri->getId() === $riId) {
                if (isset($data['poidsInitial'])) {
                    $ri->setPoidsInitial((float) $data['poidsInitial']);
                }
                if (isset($data['estCuit'])) {
                    $ri->setEstCuit((bool) $data['estCuit']);
                }
                if (isset($data['methodeFriture'])) {
                    $ri->setMethodeFriture($data['methodeFriture']);
                }
                if (array_key_exists('partComestibleOverride', $data)) {
                    $ri->setPartComestibleOverride(
                        $data['partComestibleOverride'] !== null ? (float) $data['partComestibleOverride'] : null
                    );
                }
                $this->em->flush();
                return $this->json($recipe->toArray());
            }
        }

        return $this->json(['error' => 'Ingrédient de recette introuvable'], 404);
    }

    #[Route('/{id}/ingredients/{riId}', name: 'remove_ingredient', methods: ['DELETE'], requirements: ['id' => '\d+', 'riId' => '\d+'])]
    public function removeIngredient(int $id, int $riId): JsonResponse
    {
        $recipe = $this->recipeRepo->find($id);
        if (!$recipe) {
            return $this->json(['error' => 'Recette introuvable'], 404);
        }

        foreach ($recipe->getRecipeIngredients() as $ri) {
            if ($ri->getId() === $riId) {
                $recipe->removeRecipeIngredient($ri);
                $this->em->remove($ri);
                $this->em->flush();
                return $this->json($recipe->toArray());
            }
        }

        return $this->json(['error' => 'Ingrédient de recette introuvable'], 404);
    }

    #[Route('/{id}/calculate', name: 'calculate', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function calculate(int $id): JsonResponse
    {
        $recipe = $this->recipeRepo->find($id);
        if (!$recipe) {
            return $this->json(['error' => 'Recette introuvable'], 404);
        }

        $result = $this->calculator->calculate($recipe);

        $recipe->setScoreNutri($result['score']);
        $recipe->setGradeNutri($result['grade']);
        if (!empty($result['nutrition'])) {
            $recipe->setNutriNutrition($result['nutrition']);
        }

        $this->em->flush();

        return $this->json([
            'score'     => $result['score'],
            'grade'     => $result['grade'],
            'nutrition' => $result['nutrition'],
            'recipe'    => $recipe->toArray(),
        ]);
    }
}
