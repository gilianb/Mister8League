# Refonte premium du site — spec de design

Date : 7 septembre 2026. Périmètre : toutes les pages du site (public, inscription,
authentification, espace joueur, administration) et le kit UI partagé. Le code métier,
les requêtes et les actions serveur ne changent pas.

## 1. Brief

Le site fonctionne mais son rendu est jugé « basique et généré par IA » : cartes
arrondies identiques partout, étiquettes en capitales espacées au-dessus de chaque
titre, séparateurs `✦ ✦ ✦`, police d'affiche (Bevan) et double cadre « poster »,
photos en filigrane à 7 %. L'objectif est un rendu nettement plus premium, qui reste
fidèle à l'esprit Mister 8 (boutique de cartes à Courbevoie, chapeau de paille, noir
et or) et à la vocation du site : des joueurs français, des tournois One Piece, une
ligue par saison avec une finale.

Références : mister-8.com (fond sombre, accents or, produits gradés, ton expert mais
accessible), le logo (chapeau de paille or au ruban rouge, lettrage sombre) et les
photos réelles des tournois (salle pleine, tapis de jeu, cartes en main).

Une session précédente a commencé la refonte sans terminer : elle a introduit des
classes utilitaires (`page-shell`, `section-kicker`, `editorial-link`,
`surface-panel`, `text-cream-500`) qui n'existent pas encore dans `globals.css`, a
créé `AuthFrame` et `admin.css`, retravaillé calendrier, règlement, confidentialité,
`EventCard`, l'espace joueur et la navigation admin. Cette spec reprend ce travail,
le complète et corrige ce qui restait des tics « générés ».

## 2. Direction : « Le Championnat »

Une identité de ligue sportive avec une finition collector. Le site parle comme un
circuit compétitif (rangs, points, coupe de qualification, billets) et emprunte à
la boutique son noir chaud et son or. Le chapeau est l'emblème ; la paille est la
couleur de ce qui compte (points, rangs, places restantes) ; le rouge du ruban est
la couleur de l'action.

Ce qui disparaît : Bevan et le style « affiche », les `✦ ✦ ✦`, le double cadre, les
photos délavées en fond, les étiquettes en capitales espacées au-dessus de chaque
bloc, les flèches `→` / `↗` collées à chaque lien, la numérotation `01 / 02` des
menus (ce ne sont pas des séquences), l'italique sur un seul mot dans les titres.

### Couleurs

| Rôle | Nom | Valeur |
| --- | --- | --- |
| Fond de page | `coal-900` | `#1B1816` |
| En-tête, pied de page, contrôles | `coal-950` | `#141210` |
| Panneaux | `coal-800` | `#26221E` |
| Filets, bordures de champs | `coal-700` | `#332E28` |
| Paille (accent signature) | `gold-400` | `#F6C36B` |
| Ruban (action principale) | `brand` | `#E8392B` |
| Ivoire (texte) | `cream-200` / `cream-100` | `#F3EBDA` / `#F9F3E6` |
| Papier (surfaces claires : billets, règlement) | `paper` / `paper-50` | `#F2E9D6` / `#FAF5EA` |
| Encre (texte sur papier) | `ink` | `#221F1C` |

Les nuances intermédiaires (`cream-300/400/500/600`, `gold-300/500/600`,
`ink-400/600`, `paper-200`) existent pour les hiérarchies de texte et les filets.
Un seul filet : or à 14 % d'opacité (`.hairline`) sur le sombre, encre à 12 % sur le
papier. Pas d'ombres grises ; les surfaces se distinguent par leur valeur, pas par
une ombre portée.

### Typographie

- **Fraunces** (display, taille optique) pour les titres et les grands chiffres :
  rang, points, jour du mois, compte à rebours, prix. C'est la voix du site.
  Graisse 500 à 700, interlettrage resserré (−0.02 em à −0.04 em) au-delà de 40 px.
- **Archivo** (grotesque) pour tout le reste : texte, navigation, boutons, tableaux,
  formulaires. Graisses 400, 500, 600.
- Échelle : 13 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64 px. Corps de texte à 16 px,
  interligne 1.6, lignes de 60 ch au plus.
- Casse de phrase partout. Les capitales sont réservées aux talons de billet (la
  langue des vrais billets) et aux en-têtes de colonnes de tableau, à 11 px, sans
  interlettrage exagéré (0.06 em au plus).

### Mise en page

- Conteneur 1152 px (`page-shell`), gouttières 20 px mobile / 32 px desktop.
- En-tête 72 px, collant, `coal-950`, filet or en bas. Emblème = le vrai chapeau
  (`/brand/chapeau.png`) et un lettrage « Mister 8 / Tournament League » en Fraunces.
- Les titres de page sont alignés à gauche, en très grand (48 à 64 px), suivis d'un
  chapeau de 60 ch au plus. Quand une page a une action principale, elle est à droite
  du titre sur desktop, sous le chapeau sur mobile.
- Les listes (tournois passés, historique, inscriptions) sont des lignes séparées par
  un filet, pas des cartes. Les panneaux (`surface-panel`) ne servent qu'à grouper
  un formulaire ou un bloc de données.
- Rayons : 6 px pour les contrôles, 10 px pour les panneaux, 14 px pour les billets.
- Mouvement : le bandeau photo défilant de l'accueil (existant) et les états de
  survol. Aucune apparition au défilement. `prefers-reduced-motion` respecté.

### Là où le site est audacieux

1. **Le billet.** Chaque tournoi est présenté comme un billet en papier ivoire : un
   corps (titre, date en Fraunces, lieu, prix) et un talon séparé par une perforation
   (deux encoches et un pointillé), qui porte le format, le nombre de places et
   l'action. Sur la page de confirmation, le billet reprend la même forme avec le
   numéro d'inscription et le QR code du PDF. La carte est le produit : on achète
   une place, on reçoit un billet.
2. **Les grands chiffres.** Sur l'accueil et le classement, le rang des huit premiers
   est composé en Fraunces à 40 px et plus, la coupe de qualification est une ligne
   rouge nommée, les points sont en or. Le classement se lit comme un tableau de
   championnat.
3. **Les photos, en vrai.** Pleine largeur, nettes, avec un dégradé vers le charbon
   pour poser le texte : héros de l'accueil, colonne des pages de connexion, image
   d'en-tête du calendrier. Jamais en filigrane.

## 3. Kit UI (src/components/ui)

- `Button` : `brand` (ruban, texte blanc — action principale), `gold` (paille, texte
  encre — action secondaire forte), `outline` (filet ivoire), `ghost`, `danger`,
  `paper` (encre sur papier). Hauteurs 36 / 44 / 52 px, rayon 6 px, casse de phrase,
  état `pending` avec spinner, focus visible or.
- `Card` : `club` (panneau sombre), `paper` (papier, filet encre), `subtle` (fond
  transparent, filet seul). Plus de double cadre.
- `Field`, `Input`, `Select`, `Textarea`, `Checkbox` : étiquette 13 px medium ivoire,
  contrôle 44 px, fond `coal-950`, bordure `coal-700`, anneau de focus or, message
  d'erreur rouge sous le champ.
- `Badge` : pilule 11 px, teintes `neutral / gold / good / warn / bad / info`,
  casse de phrase.
- `Alert` : bandeau avec bordure gauche de couleur, pas d'icône ronde.
- `EmptyState` : titre Fraunces, texte, action ; sans logo décoratif.
- `PageHeader` : chapeau facultatif (ex. saison, date), titre 48–64 px, lede,
  actions, lien de retour avec chevron.
- `SectionHeading` : titre de section Fraunces 28 px + action à droite.
- `StatTile` : chiffre Fraunces 36 px en or ou ivoire, libellé 13 px, sans cadre
  arrondi lourd (filet en haut).
- `Tabs` : onglets soulignés (filet or sous l'actif), pas de pilules.
- `Avatar` : inchangé (cercle, initiale en Fraunces).
- `HatLogo` : rend désormais le PNG du chapeau (emblème officiel).

Utilitaires CSS (`globals.css`) : `page-shell`, `hairline`, `surface-panel`,
`ticket` (papier, rayon 14 px, encoches), `ticket-stub` (perforation), `kicker`
(libellé 13 px semi-gras or, casse de phrase, utilisé seulement quand le libellé
apporte une information : saison, date, statut), `text-link` (lien ivoire souligné
or au survol), `tabular`, `display-number` (Fraunces, chiffres tabulaires).

## 4. Pages

### Accueil
Héros pleine largeur sur `hero-bg.jpg` (dégradé vers le charbon en bas et à gauche) ;
titre « La ligue One Piece de Courbevoie. » puis la promesse de la saison (X places
qualificatives, une finale), deux actions (créer un compte / voir le classement).
À droite, le prochain tournoi en billet avec compte à rebours et places restantes.
Puis : le top 8 en grands chiffres, le bandeau photo, « Comment ça marche » en trois
étapes numérotées (c'est une séquence : jouer, marquer, se qualifier) sur papier,
le dernier tournoi joué.

### Calendrier
En-tête avec photo à droite ; grille de billets pour les tournois à venir ; liste à
filets pour les tournois passés avec lien vers les résultats.

### Classement
Sélecteur de saison en onglets soulignés ; résumé (tournois comptabilisés, nombre de
qualifiés) ; tableau de championnat : rang en Fraunces, avatar + pseudo, tournois,
bilan, meilleur résultat, points en or ; ligne rouge de coupe avec libellé ; ligne
du joueur connecté surlignée.

### Résultats et fiche résultat
Liste des tournois terminés en lignes ; page détail : podium en trois billets
(1er en or), répartition des leaders (donut existant, légende alignée), classement
final en tableau.

### Fiche tournoi
Billet grand format (titre, date, lieu, prix, places, action) sur papier, compte à
rebours, blocs texte (description, déroulé, règles, dotation) en deux colonnes sur
panneaux sombres, bloc contact.

### Inscription, confirmation, retour de paiement, billet public
Formulaire en deux colonnes (participant, deck, facturation / récapitulatif collant
avec total en Fraunces et bouton « Payer avec Mollie »). Confirmation : billet avec
numéro, participant, paiement, bouton de téléchargement. Retour Mollie : panneau
centré avec état. Billet public (QR) : billet compact avec statut et check-in admin.

### Connexion et pages d'authentification
`AuthFrame` : photo à gauche (`amb-04.jpg`) avec accroche, formulaire à droite ;
onglets soulignés connexion / création ; mêmes gabarits pour mot de passe oublié,
nouveau mot de passe, vérification d'e-mail, erreur de lien, callback.

### Espace joueur
Colonne de navigation à gauche (liens soulignés, sans numéros) et image du club ;
tableau de bord : en-tête d'identité (avatar, pseudo, saison), barre de
qualification, quatre chiffres clés, prochains tournois, points par tournoi,
historique, leaders joués, decks. Profil : formulaire en deux sections. Decks :
formulaire + grille de cartes deck. Inscriptions : lignes avec statut et billet.

### Profil public
Même structure que le tableau de bord, en lecture.

### Règlement et confidentialité
Pages papier : titre Fraunces, sommaire collant à gauche, articles séparés par un
filet encre, tableau du barème, encadrés à bordure gauche (bonus, avertissement).

### Administration
Colonne de navigation à gauche, contenu à droite, `admin.css` pour les tableaux
denses. Tableau de bord : chiffres clés, résultats à publier, prochains tournois,
dernières inscriptions. Tournois : tableau. Formulaire tournoi : sections
titrées. Participants : chiffres, ajout en caisse, tableau. Résultats : import,
rapprochement, classement publié. Saisons : liste + formulaire + barème. Joueurs :
chiffres + tableau.

### Divers
Page d'installation (variables manquantes) et page 404 aux couleurs du site.

## 5. Contraintes techniques

- Next 16 (App Router), Tailwind v4 via `@theme` et `@utility` dans `globals.css`.
- Polices via `next/font/google` : Fraunces (axes `opsz`, normal + italique) et
  Archivo. Bevan est retirée.
- Images via `next/image` pour les photos de contenu ; `public/brand/chapeau.png`
  comme emblème.
- Aucun changement de schéma, d'action serveur, de route ou de texte légal.
- Vérification : `npm run typecheck`, `npm run lint`, `npm run build`, tests
  existants, captures d'écran desktop (1440) et mobile (390) des pages publiques.
