<?php

namespace App\Repository;

use App\Entity\Ingredient;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Ingredient>
 */
class IngredientRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ingredient::class);
    }

    public function searchByNom(string $search, int $limit = 20, int $offset = 0): array
    {
        return $this->createQueryBuilder('i')
            ->where('LOWER(i.nom) LIKE LOWER(:search)')
            ->setParameter('search', '%' . $search . '%')
            ->orderBy('i.nom', 'ASC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countByNom(string $search): int
    {
        return (int) $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('LOWER(i.nom) LIKE LOWER(:search)')
            ->setParameter('search', '%' . $search . '%')
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findAllPersonnalises(): array
    {
        return $this->createQueryBuilder('i')
            ->where('i.estPersonnalise = true')
            ->orderBy('i.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findAllPaginated(int $limit, int $offset): array
    {
        return $this->createQueryBuilder('i')
            ->orderBy('i.nom', 'ASC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countAll(): int
    {
        return (int) $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }
}
