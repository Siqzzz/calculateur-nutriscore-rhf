<?php

namespace App\Entity;

use App\Repository\EdiblePortionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EdiblePortionRepository::class)]
#[ORM\Table(name: 'edible_portion')]
class EdiblePortion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $categorie = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $sousCategorie = null;

    #[ORM\Column(nullable: true)]
    private ?float $partComestible = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $commentairePartComestible = null;

    #[ORM\Column(nullable: true)]
    private ?float $rendementCuisson = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $commentaireRendement = null;

    public function getId(): ?int { return $this->id; }

    public function getCategorie(): ?string { return $this->categorie; }
    public function setCategorie(?string $v): static { $this->categorie = $v; return $this; }

    public function getSousCategorie(): ?string { return $this->sousCategorie; }
    public function setSousCategorie(?string $v): static { $this->sousCategorie = $v; return $this; }

    public function getPartComestible(): ?float { return $this->partComestible; }
    public function setPartComestible(?float $v): static { $this->partComestible = $v; return $this; }

    public function getCommentairePartComestible(): ?string { return $this->commentairePartComestible; }
    public function setCommentairePartComestible(?string $v): static { $this->commentairePartComestible = $v; return $this; }

    public function getRendementCuisson(): ?float { return $this->rendementCuisson; }
    public function setRendementCuisson(?float $v): static { $this->rendementCuisson = $v; return $this; }

    public function getCommentaireRendement(): ?string { return $this->commentaireRendement; }
    public function setCommentaireRendement(?string $v): static { $this->commentaireRendement = $v; return $this; }
}
