# Plan produit - Boutique couture Maison Marcelina

## 1) Objectif

Lancer une boutique couture en ligne, claire et premium, qui permet:
- de decouvrir la marque et ses collections
- de creer un compte client
- d'acheter facilement
- de garder un lien fort avec Instagram et la prise de contact

## 2) Fonctionnalites cibles (MVP obligatoire)

### A. Authentification (Supabase)
- Inscription/connexion par email + mot de passe.
- Connexion Google OAuth.
- Recuperation de mot de passe.
- Session persistante securisee (token refresh gere par Supabase).
- Page compte client:
  - profil (nom, email, telephone)
  - adresses livraison/facturation
  - historique commandes
  - wishlist

### B. Boutique / Marketplace "Les collections"
- Page "Les collections" (marketplace interne) avec filtres:
  - collection
  - taille
  - couleur
  - prix
  - disponibilite
- Detail produit:
  - photos
  - description
  - prix
  - variantes (taille/couleur)
  - stock en temps reel
  - bouton wishlist
- Collections initiales a publier:
  - Marceline Heritage (vert sauge, beige, taupe, chocolat; motif classique)
  - Marceline Riviera (vives/estivales; vichy, rayures, multicolore)
  - Marceline Audacieuse (vives; leopard, vache, rouge, noir)

### C. Module d'achat
- Panier (ajout, suppression, mise a jour quantite, total auto).
- Checkout en etapes:
  - adresse
  - livraison
  - paiement
  - confirmation
- Paiement en ligne (Stripe recommande pour MVP).
- Gestion anti-erreurs:
  - idempotence sur creation de commande
  - verrouillage du stock au paiement
  - prevention double clic/double paiement
- Email de confirmation commande.

### D. Reseaux sociaux
- Liens visibles vers Instagram sur:
  - header
  - footer
  - page produit
- Bloc Instagram sur la home (dernieres publications ou CTA vers le compte).
- Partage produit (copier lien, partage social).

### E. Contact
- Page contact:
  - formulaire (nom, email, sujet, message)
  - email de support
  - liens reseaux
- Validation front + backend, anti-spam (honeypot ou rate limit).
- Accuse de reception automatique.

### F. Pages de marque
- "Notre histoire" (storytelling Maison Marcelina).
- Home avec mise en avant des collections et best sellers.
- Mentions legales, CGV, politique de confidentialite, retours/livraison.

### G. Back-office admin (gestion boutique)
- Espace admin securise (role admin, routes protegees).
- Gestion catalogue:
  - ajouter un article
  - modifier un article (nom, description, prix, collection, statut)
  - archiver/supprimer un article
- Gestion photos:
  - upload image produit
  - reordonner les photos
  - definir image principale
  - suppression image obsolete
- Gestion stock:
  - mise a jour des variantes (taille/couleur)
  - ajustement manuel des quantites
  - alerte stock faible
- Gestion commandes:
  - liste des commandes
  - changement de statut (en preparation, expediee, livree, annulee)
  - detail client/livraison

### H. Dashboard stats (admin)
- Vue d'ensemble business:
  - visiteurs
  - vues produits
  - ajouts au panier
  - commandes
  - chiffre d'affaires
- KPIs conversion:
  - taux vue produit -> ajout panier
  - taux ajout panier -> achat
  - panier moyen
- Suivi marketing:
  - clics vers/depuis reseaux sociaux
  - taux d'ouverture email (si email marketing active)
- Filtres temporels (jour/semaine/mois) + export CSV.

## 3) Architecture technique cible

### Frontend
- Framework web moderne (Next.js recommande).
- Pages:
  - Home
  - Notre histoire
  - Les collections
  - Produit
  - Panier
  - Checkout
  - Contact
  - Compte
- Composants reutilisables pour cartes produit, filtres, formulaires.

### Backend / donnees
- Supabase:
  - Auth (email + Google)
  - Postgres (produits, collections, variantes, stocks, commandes, wishlist)
  - Storage (images produits)
- Webhooks:
  - paiement confirme -> commande payee
  - paiement echec -> commande annulee
- Tracking analytics:
  - evenements de clic produit
  - evenements d'ajout panier
  - evenements checkout/paiement
  - evenements d'ouverture email (si active)
- Logs utiles uniquement (erreurs paiement, echec auth, echec webhook, timeout).

## 4) Modele de donnees minimal

- users (geres par Supabase Auth)
- profiles (user_id, nom, telephone)
- addresses (user_id, type, adresse, ville, code_postal, pays)
- collections (slug, nom, description, statut)
- products (collection_id, slug, nom, description, prix, actif)
- product_variants (product_id, sku, taille, couleur, stock)
- carts (user_id ou session_id)
- cart_items (cart_id, variant_id, quantite)
- orders (user_id, statut, total, payment_intent_id)
- order_items (order_id, variant_id, prix_unitaire, quantite)
- wishlists (user_id, product_id)
- contacts (nom, email, sujet, message, statut)
- admin_roles (user_id, role)
- analytics_events (event_type, user_id, session_id, product_id, order_id, source, created_at)
- email_events (campaign_id, user_id, event_type, created_at)

## 5) Roadmap de livraison

### Phase 0 - Fondations (1 semaine)
- Initialiser projet frontend + backend.
- Configurer Supabase (auth mail + Google).
- Schema DB + migrations.
- Setup env + start.sh.

### Phase 1 - Catalogue et branding (1 semaine)
- Home + Notre histoire.
- Page marketplace "Les collections" + fiches produit.
- Integrer collections Heritage/Riviera/Audacieuse.
- Lien Instagram.

### Phase 2 - Achat (1 a 2 semaines)
- Panier complet.
- Checkout + Stripe.
- Commandes + confirmations email.
- Gestion stock + idempotence.

### Phase 3 - Compte client et contact (1 semaine)
- Compte client (profil, adresses, commandes, wishlist).
- Formulaire contact robuste.
- Pages legales.

### Phase 4 - Back-office admin + dashboard (1 semaine)
- Espace admin catalogue/photos/stocks/commandes.
- Dashboard analytics (clics, ajouts panier, conversion, CA).
- Tracking des evenements critiques.

### Phase 5 - Stabilisation production (1 semaine)
- Tests E2E parcours achat.
- Monitoring erreurs critiques.
- Optimisation performance SEO.
- Recette finale et mise en production.

## 6) Definition de "pret a ship"

- Tous les parcours critiques passent:
  - login
  - navigation collection
  - ajout panier
  - paiement
  - suivi commande
  - contact
  - administration catalogue
  - lecture dashboard
- Zero bug bloquant sur mobile et desktop.
- Donnees sensibles securisees (RLS, secrets, webhooks signes).
- README a jour (architecture, setup, commandes, variables env).
