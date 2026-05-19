<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240003000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout du champ is_personnalise sur la table ingredient';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ingredient ADD is_personnalise BOOLEAN NOT NULL DEFAULT FALSE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ingredient DROP COLUMN is_personnalise');
    }
}
