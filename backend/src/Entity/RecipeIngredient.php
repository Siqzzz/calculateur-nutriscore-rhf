<?php

namespace App\Entity;

use App\Repository\RecipeIngredientRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RecipeIngredientRepository::class)]
#[ORM\Table(name: 'recipe_ingredient')]
class RecipeIngredient
{
    public const FRITURE_NON = 'non';
    public const FRITURE_1_PASSAGE = '1_passage';
    public const FRITURE_SURGELE = 'surgele';
    public const FRITURE_2_PASSAGES_PLUS = '2_passages_plus';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Recipe::class, inversedBy: 'recipeIngredients')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Recipe $recipe;

    #[ORM\ManyToOne(targetEntity: Ingredient::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Ingredient $ingredient;

    #[ORM\Column]
    private float $poidsInitial = 0.0;

    #[ORM\Column]
    private bool $estCuit = false;

    #[ORM\Column(length: 20)]
    private string $methodeFriture = self::FRITURE_NON;

    // Override manuel de la part comestible (null = utiliser valeur de l'ingrédient)
    #[ORM\Column(nullable: true)]
    private ?float $partComestibleOverride = null;

    // Poids final calculé (après part comestible + rendement cuisson)
    #[ORM\Column(nullable: true)]
    private ?float $poidsFinalCalcule = null;

    #[ORM\Column]
    private int $position = 0;

    public function getId(): ?int { return $this->id; }

    public function getRecipe(): Recipe { return $this->recipe; }
    public function setRecipe(Recipe $recipe): static { $this->recipe = $recipe; return $this; }

    public function getIngredient(): Ingredient { return $this->ingredient; }
    public function setIngredient(Ingredient $ingredient): static { $this->ingredient = $ingredient; return $this; }

    public function getPoidsInitial(): float { return $this->poidsInitial; }
    public function setPoidsInitial(float $v): static { $this->poidsInitial = $v; return $this; }

    public function isEstCuit(): bool { return $this->estCuit; }
    public function setEstCuit(bool $v): static { $this->estCuit = $v; return $this; }

    public function getMethodeFriture(): string { return $this->methodeFriture; }
    public function setMethodeFriture(string $v): static { $this->methodeFriture = $v; return $this; }

    public function getPartComestibleOverride(): ?float { return $this->partComestibleOverride; }
    public function setPartComestibleOverride(?float $v): static { $this->partComestibleOverride = $v; return $this; }

    public function getPoidsFinalCalcule(): ?float { return $this->poidsFinalCalcule; }
    public function setPoidsFinalCalcule(?float $v): static { $this->poidsFinalCalcule = $v; return $this; }

    public function getPosition(): int { return $this->position; }
    public function setPosition(int $v): static { $this->position = $v; return $this; }

    public function getEffectivePartComestible(): float
    {
        return $this->partComestibleOverride ?? $this->ingredient->getPartComestible() ?? 1.0;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'ingredient' => $this->ingredient->toArray(),
            'poidsInitial' => $this->poidsInitial,
            'estCuit' => $this->estCuit,
            'methodeFriture' => $this->methodeFriture,
            'partComestibleOverride' => $this->partComestibleOverride,
            'poidsFinalCalcule' => $this->poidsFinalCalcule,
            'position' => $this->position,
        ];
    }
}
