<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240001000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création des tables initiales : ingredient, edible_portion, recipe, recipe_ingredient';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE ingredient (
            id SERIAL NOT NULL,
            aliment_code VARCHAR(20) DEFAULT NULL,
            nom VARCHAR(255) NOT NULL,
            groupe_nom VARCHAR(255) DEFAULT NULL,
            sous_groupe_nom VARCHAR(255) DEFAULT NULL,
            energie_kj DOUBLE PRECISION DEFAULT NULL,
            energie_kcal DOUBLE PRECISION DEFAULT NULL,
            proteines DOUBLE PRECISION DEFAULT NULL,
            glucides DOUBLE PRECISION DEFAULT NULL,
            lipides DOUBLE PRECISION DEFAULT NULL,
            sucres DOUBLE PRECISION DEFAULT NULL,
            fibres DOUBLE PRECISION DEFAULT NULL,
            acide_gras_satures DOUBLE PRECISION DEFAULT NULL,
            sodium DOUBLE PRECISION DEFAULT NULL,
            sel DOUBLE PRECISION DEFAULT NULL,
            fruits_legumes_pct DOUBLE PRECISION DEFAULT NULL,
            part_comestible DOUBLE PRECISION DEFAULT NULL,
            rendement_cuisson DOUBLE PRECISION DEFAULT NULL,
            est_viande_rouge BOOLEAN NOT NULL DEFAULT FALSE,
            pct_viande_rouge DOUBLE PRECISION DEFAULT NULL,
            presence_edulorant BOOLEAN NOT NULL DEFAULT FALSE,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6E3B2E8B6C6E55B5 ON ingredient (nom)');
        $this->addSql('CREATE INDEX idx_ingredient_nom ON ingredient (nom)');

        $this->addSql('CREATE TABLE edible_portion (
            id SERIAL NOT NULL,
            categorie VARCHAR(100) DEFAULT NULL,
            sous_categorie VARCHAR(100) DEFAULT NULL,
            part_comestible DOUBLE PRECISION DEFAULT NULL,
            commentaire_part_comestible VARCHAR(255) DEFAULT NULL,
            rendement_cuisson DOUBLE PRECISION DEFAULT NULL,
            commentaire_rendement VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY(id)
        )');

        $this->addSql('CREATE TABLE recipe (
            id SERIAL NOT NULL,
            nom VARCHAR(255) NOT NULL,
            type VARCHAR(20) NOT NULL DEFAULT \'general\',
            score_nutri DOUBLE PRECISION DEFAULT NULL,
            grade_nutri VARCHAR(1) DEFAULT NULL,
            energie_kj100g DOUBLE PRECISION DEFAULT NULL,
            energie_kcal100g DOUBLE PRECISION DEFAULT NULL,
            proteines100g DOUBLE PRECISION DEFAULT NULL,
            glucides100g DOUBLE PRECISION DEFAULT NULL,
            lipides100g DOUBLE PRECISION DEFAULT NULL,
            sucres100g DOUBLE PRECISION DEFAULT NULL,
            fibres100g DOUBLE PRECISION DEFAULT NULL,
            acide_gras_satures100g DOUBLE PRECISION DEFAULT NULL,
            sodium100g DOUBLE PRECISION DEFAULT NULL,
            sel100g DOUBLE PRECISION DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('COMMENT ON COLUMN recipe.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN recipe.updated_at IS \'(DC2Type:datetime_immutable)\'');

        $this->addSql('CREATE TABLE recipe_ingredient (
            id SERIAL NOT NULL,
            recipe_id INT NOT NULL,
            ingredient_id INT NOT NULL,
            poids_initial DOUBLE PRECISION NOT NULL DEFAULT 0,
            est_cuit BOOLEAN NOT NULL DEFAULT FALSE,
            methode_friture VARCHAR(20) NOT NULL DEFAULT \'non\',
            part_comestible_override DOUBLE PRECISION DEFAULT NULL,
            poids_final_calcule DOUBLE PRECISION DEFAULT NULL,
            position INT NOT NULL DEFAULT 0,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IDX_recipe_ingredient_recipe ON recipe_ingredient (recipe_id)');
        $this->addSql('ALTER TABLE recipe_ingredient ADD CONSTRAINT FK_recipe_ingredient_recipe
            FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE recipe_ingredient ADD CONSTRAINT FK_recipe_ingredient_ingredient
            FOREIGN KEY (ingredient_id) REFERENCES ingredient (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE recipe_ingredient DROP CONSTRAINT FK_recipe_ingredient_recipe');
        $this->addSql('ALTER TABLE recipe_ingredient DROP CONSTRAINT FK_recipe_ingredient_ingredient');
        $this->addSql('DROP TABLE recipe_ingredient');
        $this->addSql('DROP TABLE recipe');
        $this->addSql('DROP TABLE edible_portion');
        $this->addSql('DROP INDEX idx_ingredient_nom');
        $this->addSql('DROP TABLE ingredient');
    }
}
