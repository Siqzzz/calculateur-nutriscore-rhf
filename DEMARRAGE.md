# Démarrage rapide

## Prérequis
- Docker Desktop installé et démarré

## 1. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env si besoin (changer les mots de passe)
```

## 2. Lancer les conteneurs
```bash
docker compose up -d --build
```

## 3. Installer les dépendances backend
```bash
docker compose exec backend composer install
```

## 4. Installer les dépendances frontend
```bash
docker compose exec frontend npm install
```

## 5. Créer la base de données et les tables
```bash
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

## 6. Importer les données CIQUAL
Copier le fichier Excel dans le dossier `backend/` puis :
```bash
docker compose exec backend php bin/console app:import-ciqual /var/www/html/Calculateur_RHF.xlsm
```

## 7. Accéder à l'application
Ouvrir http://localhost dans votre navigateur.

---

## URLs utiles
| URL | Description |
|-----|-------------|
| http://localhost | Application React |
| http://localhost/api/ingredients?search=carotte | API ingrédients |
| http://localhost/api/recipes | API recettes |

## Commandes utiles
```bash
# Arrêter
docker compose down

# Voir les logs
docker compose logs -f

# Reconstruire un service
docker compose build backend

# Accéder au shell PHP
docker compose exec backend bash

# Accéder à PostgreSQL
docker compose exec db psql -U rhf_user -d rhf
```
