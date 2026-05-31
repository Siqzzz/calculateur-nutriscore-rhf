<?php

namespace App\Controller\Api;

use App\Entity\Ingredient;
use App\Repository\IngredientRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/ingredients', name: 'api_ingredients_')]
class IngredientController extends AbstractController
{
    public function __construct(
        private readonly IngredientRepository $repo,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        // Lister les ingrédients personnalisés (sans filtre de recherche)
        if ($request->query->getString('type') === 'custom') {
            $items = $this->repo->findAllCustom();
            return $this->json([
                'data'  => array_map(fn($i) => $i->toArray(), $items),
                'total' => count($items),
                'page'  => 1,
                'limit' => count($items),
            ]);
        }

        $search = trim($request->query->getString('search', ''));
        $page   = max(1, $request->query->getInt('page', 1));
        $limit  = min(100, max(1, $request->query->getInt('limit', 20)));
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

    // ─── CRUD ingrédients personnalisés ─────────────────────────────────────

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['nom'])) {
            return $this->json(['error' => 'Le champ "nom" est requis'], 400);
        }

        $ing = new Ingredient();
        $ing->setNom(trim($data['nom']));
        $ing->setEstPersonnalise(true);
        $this->hydrate($ing, $data);

        try {
            $this->em->persist($ing);
            $this->em->flush();
        } catch (\Exception) {
            return $this->json(['error' => 'Un ingrédient avec ce nom existe déjà'], 409);
        }

        return $this->json($ing->toArray(), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $ing = $this->repo->find($id);
        if (!$ing) {
            return $this->json(['error' => 'Ingrédient introuvable'], 404);
        }
        if (!$ing->isEstPersonnalise()) {
            return $this->json(['error' => 'Seuls les ingrédients personnalisés peuvent être modifiés'], 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!empty($data['nom'])) {
            $ing->setNom(trim($data['nom']));
        }
        $this->hydrate($ing, $data);

        try {
            $this->em->flush();
        } catch (\Exception) {
            return $this->json(['error' => 'Un ingrédient avec ce nom existe déjà'], 409);
        }

        return $this->json($ing->toArray());
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $ing = $this->repo->find($id);
        if (!$ing) {
            return $this->json(['error' => 'Ingrédient introuvable'], 404);
        }
        if (!$ing->isEstPersonnalise()) {
            return $this->json(['error' => 'Seuls les ingrédients personnalisés peuvent être supprimés'], 403);
        }

        $this->em->remove($ing);
        $this->em->flush();

        return $this->json(null, 204);
    }

    // ────────────────────────────────────────────────────────────────────────

    private function hydrate(Ingredient $ing, array $data): void
    {
        $f = static fn($v): ?float => ($v !== null && $v !== '') ? (float) $v : null;

        if (array_key_exists('energieKj', $data))         $ing->setEnergieKj($f($data['energieKj']));
        if (array_key_exists('lipides', $data))            $ing->setLipides($f($data['lipides']));
        if (array_key_exists('acideGrasSatures', $data))   $ing->setAcideGrasSatures($f($data['acideGrasSatures']));
        if (array_key_exists('glucides', $data))           $ing->setGlucides($f($data['glucides']));
        if (array_key_exists('sucres', $data))             $ing->setSucres($f($data['sucres']));
        if (array_key_exists('fibres', $data))             $ing->setFibres($f($data['fibres']));
        if (array_key_exists('proteines', $data))          $ing->setProteines($f($data['proteines']));
        if (array_key_exists('sel', $data))                $ing->setSel($f($data['sel']));
        if (array_key_exists('fruitsLegumesPct', $data))   $ing->setFruitsLegumesPct($f($data['fruitsLegumesPct']));
        if (array_key_exists('partComestible', $data))     $ing->setPartComestible($f($data['partComestible']));
        if (array_key_exists('rendementCuisson', $data))   $ing->setRendementCuisson($f($data['rendementCuisson']));
        if (array_key_exists('estViandeRouge', $data))     $ing->setEstViandeRouge((bool) $data['estViandeRouge']);
        if (array_key_exists('pctViandeRouge', $data))     $ing->setPctViandeRouge($f($data['pctViandeRouge']));
        if (array_key_exists('presenceEdulorant', $data))  $ing->setPresenceEdulorant((bool) $data['presenceEdulorant']);
    }
}
