<?php

namespace App\Controller\Api;

use App\Repository\IngredientRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/ingredients', name: 'api_ingredients_')]
class IngredientController extends AbstractController
{
    public function __construct(private readonly IngredientRepository $repo) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $search = trim($request->query->getString('search', ''));
        $page   = max(1, $request->query->getInt('page', 1));
        $limit  = min(50, max(1, $request->query->getInt('limit', 20)));
        $offset = ($page - 1) * $limit;

        if (strlen($search) < 2) {
            return $this->json(['data' => [], 'total' => 0, 'page' => $page, 'limit' => $limit]);
        }

        $items = $this->repo->searchByNom($search, $limit, $offset);
        $total = $this->repo->countByNom($search);

        return $this->json([
            'data'  => array_map(fn($i) => $i->toArray(), $items),
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function get(int $id): JsonResponse
    {
        $ingredient = $this->repo->find($id);
        if (!$ingredient) {
            return $this->json(['error' => 'Ingrédient introuvable'], 404);
        }
        return $this->json($ingredient->toArray());
    }
}
