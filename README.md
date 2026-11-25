# PointeResto — Guide Gastronomique & Espace Restaurateur (Pointe-Noire)

**PointeResto** est une application web full-stack mobile-first permettant aux habitants et visiteurs de Pointe-Noire (République du Congo) de découvrir les établissements culinaires par quartier, consulter les cartes et tarifs en FCFA, publier des avis et s'orienter, tout en offrant aux restaurateurs un espace professionnel sécurisé pour piloter leur établissement en temps réel.

---

## 1. Architecture & Fonctionnement Global

L'application repose sur une architecture découplée en **quatre couches** conteneurisées :

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONT-END (Nginx :8080)                          │
│  HTML5 / CSS3 modulaire / JavaScript ES6+ (api.js, Auth.js, Main.js...) │
│  • Stockage local : jeton JWT (pr_token) + favoris (pointeresto_favorites)│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / JSON + Authorization: Bearer
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     API REST BACK-END (PHP 8.3 :8000)                   │
│  Point d'entrée unique : Backend/Public/Index.php?route=<module>        │
│  • TokenService : vérification cryptographique HMAC-SHA256              │
│  • Contrôleurs : Auth, Restaurant, Menu, Review, Media, Dashboard       │
│  • Diffusion médias : Backend/Public/Uploads.php?file=<hash>.jpg|png    │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│        CACHE CLÉ-VALEUR           │ │      BASE DE DONNÉES              │
│         Redis 7 (:6379)           │ │      PostgreSQL 16 (:5432)        │
│  • Mise en cache des listes       │ │  • 6 tables normalisées (MPD)     │
│  • Invalidation auto sur écriture │ │  • Requêtes préparées PDO         │
│  • Repli fichier si Redis absent  │ │  • Transactions SQL atomiques     │
└───────────────────────────────────┘ └───────────────────────────────────┘