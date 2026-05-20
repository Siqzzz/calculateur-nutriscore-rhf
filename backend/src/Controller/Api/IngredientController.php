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
        $search       = trim($request->query->getString('search', ''));
        $page         = max(1, $request->query->getInt('page', 1));
        $limit        = min(50, max(1, $request->query->getInt('limit', 20)));
        $offset       = ($page - 1) * $limit;
        $personnalise = $request->query->getBoolean('personnalise', false);

        if ($personnalise) {
            $items = $this->repo->findAllPersonnalises();
            return $this->json([
                'data'  => array_map(fn($i) => $i->toArray(), $items),
                'total' => count($items),
                'page'  => 1,
                'limit' => count($items),
            ]);
        }

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

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $nom = trim($data['nom'] ?? '');
        if ($nom === '') {
            return $this->json(['error' => 'Le nom est requis.'], 422);
        }
        if ($this->repo->findOneBy(['nom' => $nom])) {
            return $this->json(['error' => 'Un ingrédient avec ce nom existe déjà.'], 422);
        }

        $ing = new Ingredient();
        $ing->setNom($nom);
        $ing->setIsPersonnalise(true);
        $ing->setGroupeNom($data['groupeNom'] ?? null);
        $ing->setEnergieKj(isset($data['energieKj']) ? (float) $data['energieKj'] : null);
        $ing->setEnergieKcal(isset($data['energieKcal']) ? (float) $data['energieKcal'] : null);
        $ing->setProteines(isset($data['proteines']) ? (float) $data['proteines'] : null);
        $ing->setGlucides(isset($data['glucides']) ? (float) $data['glucides'] : null);
        $ing->setLipides(isset($data['lipides']) ? (float) $data['lipides'] : null);
        $ing->setSucres(isset($data['sucres']) ? (float) $data['sucres'] : null);
        $ing->setFibres(isset($data['fibres']) ? (float) $data['fibres'] : null);
        $ing->setAcideGrasSatures(isset($data['acideGrasSatures']) ? (float) $data['acideGrasSatures'] : null);
        $ing->setSel(isset($data['sel']) ? (float) $data['sel'] : null);
        $ing->setFruitsLegumesPct(isset($data['fruitsLegumesPct']) ? (float) $data['fruitsLegumesPct'] : null);
        $ing->setEstViandeRouge((bool) ($data['estViandeRouge'] ?? false));
        $ing->setPctViandeRouge(isset($data['pctViandeRouge']) ? (float) $data['pctViandeRouge'] : null);
        $ing->setPresenceEdulorant((bool) ($data['presenceEdulorant'] ?? false));

        $this->em->persist($ing);
        $this->em->flush();

        return $this->json($ing->toArray(), 201);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $ingredient = $this->repo->find($id);
        if (!$ingredient) {
            return $this->json(['error' => 'Ingrédient introuvable'], 404);
        }
        if (!$ingredient->isPersonnalise()) {
            return $this->json(['error' => 'Seuls les ingrédients personnalisés peuvent être supprimés.'], 403);
        }

        $this->em->remove($ingredient);
        $this->em->flush();

        return $this->json(null, 204);
    }
}
