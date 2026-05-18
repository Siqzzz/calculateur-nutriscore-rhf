<?php

namespace App\Entity;

use App\Repository\RecipeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RecipeRepository::class)]
#[ORM\Table(name: 'recipe')]
#[ORM\HasLifecycleCallbacks]
class Recipe
{
    public const TYPE_GENERAL = 'general';
    public const TYPE_VIANDE = 'viande';
    public const TYPE_BOISSONS = 'boissons';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $nom;

    #[ORM\Column(length: 20)]
    private string $type = self::TYPE_GENERAL;

    #[ORM\OneToMany(targetEntity: RecipeIngredient::class, mappedBy: 'recipe', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $recipeIngredients;

    // Résultats Nutri-Score (calculés et mis en cache)
    #[ORM\Column(nullable: true)]
    private ?float $scoreNutri = null;

    #[ORM\Column(length: 1, nullable: true)]
    private ?string $gradeNutri = null;

    #[ORM\Column(nullable: true)]
    private ?float $energieKj100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $energieKcal100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $proteines100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $glucides100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $lipides100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $sucres100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $fibres100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $acideGrasSatures100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $sodium100g = null;

    #[ORM\Column(nullable: true)]
    private ?float $sel100g = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->recipeIngredients = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getType(): string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }

    public function getRecipeIngredients(): Collection { return $this->recipeIngredients; }

    public function addRecipeIngredient(RecipeIngredient $ri): static
    {
        if (!$this->recipeIngredients->contains($ri)) {
            $this->recipeIngredients->add($ri);
            $ri->setRecipe($this);
        }
        return $this;
    }

    public function removeRecipeIngredient(RecipeIngredient $ri): static
    {
        $this->recipeIngredients->removeElement($ri);
        return $this;
    }

    public function getScoreNutri(): ?float { return $this->scoreNutri; }
    public function setScoreNutri(?float $v): static { $this->scoreNutri = $v; return $this; }

    public function getGradeNutri(): ?string { return $this->gradeNutri; }
    public function setGradeNutri(?string $v): static { $this->gradeNutri = $v; return $this; }

    public function setNutriNutrition(array $data): static
    {
        $this->energieKj100g = $data['energieKj'] ?? null;
        $this->energieKcal100g = $data['energieKcal'] ?? null;
        $this->proteines100g = $data['proteines'] ?? null;
        $this->glucides100g = $data['glucides'] ?? null;
        $this->lipides100g = $data['lipides'] ?? null;
        $this->sucres100g = $data['sucres'] ?? null;
        $this->fibres100g = $data['fibres'] ?? null;
        $this->acideGrasSatures100g = $data['acideGrasSatures'] ?? null;
        $this->sodium100g = $data['sodium'] ?? null;
        $this->sel100g = $data['sel'] ?? null;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'type' => $this->type,
            'scoreNutri' => $this->scoreNutri,
            'gradeNutri' => $this->gradeNutri,
            'nutrition100g' => [
                'energieKj' => $this->energieKj100g,
                'energieKcal' => $this->energieKcal100g,
                'proteines' => $this->proteines100g,
                'glucides' => $this->glucides100g,
                'lipides' => $this->lipides100g,
                'sucres' => $this->sucres100g,
                'fibres' => $this->fibres100g,
                'acideGrasSatures' => $this->acideGrasSatures100g,
                'sodium' => $this->sodium100g,
                'sel' => $this->sel100g,
            ],
            'ingredients' => array_map(
                fn(RecipeIngredient $ri) => $ri->toArray(),
                $this->recipeIngredients->toArray()
            ),
            'createdAt' => $this->createdAt->format(\DateTimeInterface::ATOM),
            'updatedAt' => $this->updatedAt->format(\DateTimeInterface::ATOM),
        ];
    }
}
