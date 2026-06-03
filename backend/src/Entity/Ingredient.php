<?php

namespace App\Entity;

use App\Repository\IngredientRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: IngredientRepository::class)]
#[ORM\Table(name: 'ingredient')]
#[ORM\Index(columns: ['nom'], name: 'idx_ingredient_nom')]
class Ingredient
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $alimentCode = null;

    #[ORM\Column(length: 255, unique: true)]
    private string $nom;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $groupeNom = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $sousGroupeNom = null;

    // Valeurs nutritionnelles pour 100g
    #[ORM\Column(nullable: true)]
    private ?float $energieKj = null;

    #[ORM\Column(nullable: true)]
    private ?float $energieKcal = null;

    #[ORM\Column(nullable: true)]
    private ?float $proteines = null;

    #[ORM\Column(nullable: true)]
    private ?float $glucides = null;

    #[ORM\Column(nullable: true)]
    private ?float $lipides = null;

    #[ORM\Column(nullable: true)]
    private ?float $sucres = null;

    #[ORM\Column(nullable: true)]
    private ?float $fibres = null;

    #[ORM\Column(nullable: true)]
    private ?float $acideGrasSatures = null;

    #[ORM\Column(nullable: true)]
    private ?float $sodium = null;

    #[ORM\Column(nullable: true)]
    private ?float $sel = null;

    // Pourcentage fruits/légumes/légumineuses pour Nutri-Score
    #[ORM\Column(nullable: true)]
    private ?float $fruitsLegumesPct = null;

    // Part comestible et rendement de cuisson (depuis Part comestible-Rendement)
    #[ORM\Column(nullable: true)]
    private ?float $partComestible = null;

    #[ORM\Column(nullable: true)]
    private ?float $rendementCuisson = null;

    // Indique si les valeurs CIQUAL sont exprimées pour l'aliment cuit (true) ou cru (false)
    #[ORM\Column]
    private bool $alimentCuit = false;

    // Spécificités viande rouge
    #[ORM\Column]
    private bool $estViandeRouge = false;

    #[ORM\Column(nullable: true)]
    private ?float $pctViandeRouge = null;

    // Spécificités boissons
    #[ORM\Column]
    private bool $presenceEdulorant = false;

    #[ORM\Column(name: 'est_personnalise')]
    private bool $estPersonnalise = false;

    public function getId(): ?int { return $this->id; }

    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getAlimentCode(): ?string { return $this->alimentCode; }
    public function setAlimentCode(?string $code): static { $this->alimentCode = $code; return $this; }

    public function getGroupeNom(): ?string { return $this->groupeNom; }
    public function setGroupeNom(?string $nom): static { $this->groupeNom = $nom; return $this; }

    public function getSousGroupeNom(): ?string { return $this->sousGroupeNom; }
    public function setSousGroupeNom(?string $nom): static { $this->sousGroupeNom = $nom; return $this; }

    public function getEnergieKj(): ?float { return $this->energieKj; }
    public function setEnergieKj(?float $v): static { $this->energieKj = $v; return $this; }

    public function getEnergieKcal(): ?float { return $this->energieKcal; }
    public function setEnergieKcal(?float $v): static { $this->energieKcal = $v; return $this; }

    public function getProteines(): ?float { return $this->proteines; }
    public function setProteines(?float $v): static { $this->proteines = $v; return $this; }

    public function getGlucides(): ?float { return $this->glucides; }
    public function setGlucides(?float $v): static { $this->glucides = $v; return $this; }

    public function getLipides(): ?float { return $this->lipides; }
    public function setLipides(?float $v): static { $this->lipides = $v; return $this; }

    public function getSucres(): ?float { return $this->sucres; }
    public function setSucres(?float $v): static { $this->sucres = $v; return $this; }

    public function getFibres(): ?float { return $this->fibres; }
    public function setFibres(?float $v): static { $this->fibres = $v; return $this; }

    public function getAcideGrasSatures(): ?float { return $this->acideGrasSatures; }
    public function setAcideGrasSatures(?float $v): static { $this->acideGrasSatures = $v; return $this; }

    public function getSodium(): ?float { return $this->sodium; }
    public function setSodium(?float $v): static { $this->sodium = $v; return $this; }

    public function getSel(): ?float { return $this->sel; }
    public function setSel(?float $v): static { $this->sel = $v; return $this; }

    public function getFruitsLegumesPct(): ?float { return $this->fruitsLegumesPct; }
    public function setFruitsLegumesPct(?float $v): static { $this->fruitsLegumesPct = $v; return $this; }

    public function getPartComestible(): ?float { return $this->partComestible; }
    public function setPartComestible(?float $v): static { $this->partComestible = $v; return $this; }

    public function getRendementCuisson(): ?float { return $this->rendementCuisson; }
    public function setRendementCuisson(?float $v): static { $this->rendementCuisson = $v; return $this; }

    public function isAlimentCuit(): bool { return $this->alimentCuit; }
    public function setAlimentCuit(bool $v): static { $this->alimentCuit = $v; return $this; }

    public function isEstViandeRouge(): bool { return $this->estViandeRouge; }
    public function setEstViandeRouge(bool $v): static { $this->estViandeRouge = $v; return $this; }

    public function getPctViandeRouge(): ?float { return $this->pctViandeRouge; }
    public function setPctViandeRouge(?float $v): static { $this->pctViandeRouge = $v; return $this; }

    public function isPresenceEdulorant(): bool { return $this->presenceEdulorant; }
    public function setPresenceEdulorant(bool $v): static { $this->presenceEdulorant = $v; return $this; }

    public function isEstPersonnalise(): bool { return $this->estPersonnalise; }
    public function setEstPersonnalise(bool $v): static { $this->estPersonnalise = $v; return $this; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'alimentCode' => $this->alimentCode,
            'groupeNom' => $this->groupeNom,
            'sousGroupeNom' => $this->sousGroupeNom,
            'energieKj' => $this->energieKj,
            'energieKcal' => $this->energieKcal,
            'proteines' => $this->proteines,
            'glucides' => $this->glucides,
            'lipides' => $this->lipides,
            'sucres' => $this->sucres,
            'fibres' => $this->fibres,
            'acideGrasSatures' => $this->acideGrasSatures,
            'sodium' => $this->sodium,
            'sel' => $this->sel,
            'fruitsLegumesPct' => $this->fruitsLegumesPct,
            'partComestible' => $this->partComestible,
            'rendementCuisson' => $this->rendementCuisson,
            'alimentCuit' => $this->alimentCuit,
            'estViandeRouge' => $this->estViandeRouge,
            'pctViandeRouge' => $this->pctViandeRouge,
            'presenceEdulorant' => $this->presenceEdulorant,
            'estPersonnalise' => $this->estPersonnalise,
        ];
    }
}
