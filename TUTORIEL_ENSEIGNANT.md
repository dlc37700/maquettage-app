# 📱 MaquetApp — Tutoriel complet pour les enseignants

> **MaquetApp** est un outil de maquettage d'applications mobiles utilisable directement dans le navigateur, sans installation. Les élèves créent des écrans, placent des composants (boutons, textes, images, barres de navigation…) et collaborent en temps réel au sein d'une même session.

---

## Sommaire

1. [Créer votre compte enseignant](#1-créer-votre-compte-enseignant)
2. [Découvrir votre espace](#2-découvrir-votre-espace)
3. [Déclarer vos établissements](#3-déclarer-vos-établissements)
4. [Partager votre code établissement](#4-partager-votre-code-établissement)
5. [Côté élève — Créer une session](#5-côté-élève--créer-une-session)
6. [Côté élève — Rejoindre une session existante](#6-côté-élève--rejoindre-une-session-existante)
7. [Côté élève — Utiliser l'éditeur](#7-côté-élève--utiliser-léditeur)
8. [Côté élève — Collaborer en temps réel](#8-côté-élève--collaborer-en-temps-réel)
9. [Suivre le travail depuis votre espace](#9-suivre-le-travail-depuis-votre-espace)
10. [Gérer les sessions](#10-gérer-les-sessions)
11. [Exporter les projets](#11-exporter-les-projets)
12. [Questions fréquentes](#12-questions-fréquentes)

---

## 1. Créer votre compte enseignant

1. Ouvrez l'application dans le navigateur.
2. Cliquez sur le bouton **👨‍🏫 Espace enseignant** (barre d'outils en haut).
3. Sur l'écran de connexion, cliquez sur **« Créer un compte enseignant »**.
4. Remplissez le formulaire :
   - **Nom affiché** : votre nom tel qu'il apparaîtra (ex. *M. Dupont*)
   - **Identifiant** : ce que vous taperez pour vous connecter (ex. *mdupont*)
   - **Mot de passe** + **confirmation** (minimum 4 caractères)
5. Cliquez sur **« Créer mon compte »**.

> ✅ Un **code établissement unique** du type **`ENS-A3F7`** est généré automatiquement.
> **C'est le code à donner à vos élèves.** Notez-le ou copiez-le.

6. Cliquez sur **« Continuer vers mon espace »** pour accéder à votre tableau de bord.

---

## 2. Découvrir votre espace

Une fois connecté, vous disposez de **deux onglets** :

| Onglet | Contenu |
|--------|---------|
| **📋 Mes sessions** | Toutes les sessions de vos élèves, groupées par établissement |
| **🏫 Mon établissement** | Votre code ENS, vos établissements déclarés, changement de mot de passe |

---

## 3. Déclarer vos établissements

Avant que vos élèves créent des sessions, déclarez le ou les collèges/lycées où vous enseignez.

1. Allez dans l'onglet **🏫 Mon établissement**.
2. Dans **« Mes établissements déclarés »**, saisissez le nom (ex. *Collège Montaigne*).
3. Cliquez sur **➕ Ajouter**.
4. Répétez pour chaque établissement.

> Vous pouvez ajouter ou supprimer des établissements à tout moment. Les élèves verront votre liste et sélectionneront le bon lors de la création de session.

---

## 4. Partager votre code établissement

1. Allez dans l'onglet **🏫 Mon établissement**.
2. Votre code est affiché en grand — cliquez sur **📋 Copier**.
3. Communiquez ce code à vos élèves (au tableau, dans l'ENT, par message…).

> ⚠️ Sans ce code, les sessions des élèves n'apparaîtront **pas** dans votre espace.

Les élèves peuvent saisir le code avec **ou sans** le préfixe `ENS-` (les deux sont acceptés).

---

## 5. Côté élève — Créer une session

> À expliquer ou projeter en classe avant la première séance.

### Étape 1 — Ouvrir la modal de collaboration
Cliquer sur le bouton **👥 Session** dans la barre d'outils en haut.

### Étape 2 — Remplir le formulaire
- **Ton prénom** : prénom de l'élève (visible sur ses écrans)
- **Nom du projet** : ex. *Application météo*
- **Classe** : ex. *4C*, *3B*

Cliquer sur **🚀 Créer une session**.

### Étape 3 — Saisir le code établissement
L'application demande le code fourni par le professeur (ex. `ENS-A3F7`).
- Saisir le code → cliquer **Valider**
- La liste des établissements déclarés par le professeur apparaît → sélectionner le bon
- Cliquer **Confirmer**

> Si un élève clique **« Ignorer »**, la session sera créée sans être rattachée au professeur et n'apparaîtra pas dans votre tableau de bord.

### Étape 4 — Noter le code PIN
Après validation, l'application affiche :
- Un **code de session à 6 caractères** (ex. `AB3X7K`) → à partager avec les camarades du même projet
- Un **code PIN à 4 chiffres** → **indispensable** pour retrouver son travail à la séance suivante

> 🔑 **Important :** Sur les ordinateurs du collège où le navigateur efface les données entre les séances, le PIN est **la seule façon de récupérer son travail**. Demandez à chaque élève de noter son **prénom + son code PIN**.

---

## 6. Côté élève — Rejoindre une session existante

**Première connexion à un projet de groupe :**
1. Cliquer sur **👥 Session** → **« Rejoindre une session »**
2. Saisir le **code à 6 caractères** donné par le créateur du projet
3. Cliquer **Rejoindre**
4. Entrer son **prénom** → cliquer **Rejoindre comme nouveau membre**
5. Noter son **PIN** qui s'affiche

**Reconnexion à une session déjà rejointe (séance suivante) :**
1. Cliquer sur **👥 Session** → saisir le **code à 6 caractères**
2. Sélectionner son **prénom** dans la liste
3. Saisir son **PIN** → les écrans et le travail précédent se rechargent automatiquement

---

## 7. Côté élève — Utiliser l'éditeur

L'interface est divisée en quatre zones :

```
┌──────────────────────────────────────────────────────┐
│                   Barre d'outils                     │
├──────────┬──────────┬──────────────┬─────────────────┤
│  Écrans  │ Compo-   │    Canvas    │   Propriétés    │
│ (gauche) │ sants    │  (téléphone) │   (droite)      │
│          │ (gauche) │              │                 │
└──────────┴──────────┴──────────────┴─────────────────┘
```

### Gérer les écrans (panneau gauche)
- **➕ Nouvel écran** : ajoute un écran (ex. *Accueil*, *Profil*, *Paramètres*)
- **Double-clic** sur le nom : renommer l'écran
- **Clic** sur un écran : le sélectionner et l'afficher dans le canvas
- **Drag** : réordonner les écrans
- Les écrans des **autres membres** apparaissent en vert (lecture seule)

### Ajouter des composants (palette centrale-gauche)
Glisser-déposer ou cliquer pour ajouter sur l'écran actif :

| Catégorie | Composants disponibles |
|-----------|----------------------|
| **Texte** | Titre, paragraphe, étiquette |
| **Boutons** | Bouton simple, bouton icône, bouton emoji |
| **Médias** | Image, avatar, icône, galerie |
| **Formulaires** | Champ texte, case à cocher, bouton radio, curseur, interrupteur |
| **Navigation** | Barre de navigation (navbar), en-tête (header) |
| **Mise en page** | Carte, bloc de couleur, séparateur, élément de liste, badge |
| **Avancé** | Calendrier, tableau, clavier |

### Modifier un composant (panneau droite)
1. **Cliquer** sur un composant dans le canvas pour le sélectionner
2. Le panneau de droite affiche toutes ses propriétés :
   - Couleur de fond / texte
   - Taille de police, famille de police
   - Rayon de bordure, opacité
   - Icône, emoji, label
   - **Navigation** : relier un bouton à un autre écran (`Naviguer vers`)
3. **Supprimer** : touche `Suppr` ou bouton dans le panneau
4. **Dupliquer** : bouton dans le panneau ou `Ctrl+D`

### Modifier l'arrière-plan d'un écran
- Cliquer sur une zone vide du canvas (pas sur un composant)
- Le panneau droite affiche les options de fond :
  - **Couleur unie**
  - **Dégradé** (deux couleurs + angle)
  - **Image** (depuis l'ordinateur)

### Barre de navigation (Navbar)
La navbar est un composant spécial avec plusieurs icônes cliquables :
1. Ajouter une navbar depuis la palette
2. **Cliquer sur une icône** dans la navbar pour la sélectionner
3. Le panneau droite permet de modifier : icône, couleur, label, écran de destination
4. Bouton **← Retour** dans le panneau pour revenir aux propriétés globales de la navbar
5. **Ajouter/retirer des icônes** depuis les propriétés globales

---

## 8. Côté élève — Collaborer en temps réel

### Voir les écrans des autres
- Les écrans des **camarades** apparaissent dans le panneau gauche avec leur prénom en vert
- Cliquer dessus pour les consulter (lecture seule — on ne peut pas modifier les écrans des autres)

### Chat de session
- Cliquer sur l'icône **💬** en bas à droite pour ouvrir le chat
- Tous les membres voient les messages en temps réel
- Le professeur peut aussi envoyer des messages depuis son espace (ils apparaissent avec un badge **PROF**)

### Appliquer un arrière-plan à tous les écrans (créateur uniquement)
Le **créateur** de la session dispose d'un bouton spécial dans le panneau des écrans :

1. Cliquer sur **🎨 Appliquer arrière-plan à…**
2. Une liste de **tous les écrans** (les siens + ceux des autres) apparaît avec des cases à cocher
3. Cocher les écrans souhaités (ou cliquer **Tout cocher**)
4. Cliquer **Valider**
   - Les **propres écrans** sélectionnés reçoivent le fond immédiatement
   - Les **écrans des autres** envoient une notification à chaque membre concerné :
     - Si le membre **accepte** → son fond est modifié
     - Si le membre **refuse** → son fond reste inchangé

---

## 9. Suivre le travail depuis votre espace

Dans l'onglet **📋 Mes sessions**, les sessions sont groupées par établissement sous forme d'accordéons.

Chaque session affiche :
- Le **code de session** et son **statut** (🟢 Active / ⚫ Inactive / 🔴 Bloquée)
- Le **nom du projet** et la **classe**
- La **liste des membres**
- La date de création et la dernière activité

### Ouvrir le détail d'une session
Cliquer sur **👁️ Détails** pour accéder à deux onglets :

#### Onglet 👤 Membres
- **Aperçu des écrans** de chaque élève (rendu fidèle : textes, boutons, images…)
- **PIN de chaque élève** affiché (utile si un élève a perdu le sien)
- Bouton **📥 Télécharger HTML** : exporte le projet de l'élève en fichier HTML navigable
- Bouton **🚫 Retirer** : exclure un membre de la session

#### Onglet 💬 Messagerie
- Historique complet des messages du chat
- Zone pour **envoyer un message en tant que professeur** (badge **PROF** visible par tous les élèves)
- Bouton **🔄 Actualiser** pour recharger

---

## 10. Gérer les sessions

Depuis la liste ou le détail d'une session :

| Action | Effet |
|--------|-------|
| **🔒 Bloquer** | Empêche tout accès à la session. Les élèves ne peuvent plus entrer. Réversible avec 🔓 Débloquer. |
| **🗑️ Supprimer** | Supprime définitivement la session et toutes ses données. ⚠️ Irréversible. |

> Une session devient **inactive** automatiquement quand tous les élèves ferment leur navigateur.

---

## 11. Exporter les projets

Deux formats disponibles, accessibles depuis le détail d'une session :

### 📥 Tout HTML (session entière)
Génère un fichier `.html` contenant **tous les écrans de tous les membres**, chaque écran étant préfixé par le prénom de l'élève (ex. *Lucas — Accueil*). S'ouvre directement dans n'importe quel navigateur, dans un shell téléphone interactif avec navigation entre les écrans.

### 📥 Tout JSON (session entière)
Exporte toutes les données brutes de la session au format JSON. Peut être réimporté dans l'application via **Fichier → Importer JSON**.

### 📥 Télécharger HTML (par élève)
Dans l'onglet Membres, chaque élève dispose de son propre bouton d'export HTML : seuls ses écrans sont exportés, avec le nom du projet comme titre.

---

## 12. Questions fréquentes

**Un élève ne retrouve plus son travail.**
→ Il doit rejoindre la session (bouton **👥 Session** → entrer le code à 6 caractères → sélectionner son prénom → saisir son PIN). Sans PIN, le travail est perdu sur les ordinateurs partagés.

**Un élève a oublié son PIN.**
→ Depuis votre espace, ouvrez la session → onglet **Membres** → le PIN de chaque élève est visible. Communiquez-le lui.

**La session d'un élève n'apparaît pas dans mon espace.**
→ Il n'a pas saisi votre code établissement lors de la création. Il doit recréer une session en saisissant le code correctement, ou continuer à travailler sans rattachement.

**Plusieurs classes utilisent l'appli en même temps.**
→ Chaque groupe crée sa propre session avec un code différent. Vous voyez toutes vos sessions dans l'onglet **Mes sessions**, groupées par établissement. Le **nom de la classe** saisi par l'élève permet de les distinguer.

**Un élève quitte accidentellement la session.**
→ Il clique sur **👥 Session** → **Rejoindre** → code à 6 caractères → son prénom → PIN. Il retrouve son travail exactement là où il l'avait laissé.

**Comment travailler à plusieurs sur le même projet ?**
→ Un élève crée la session et partage le **code à 6 caractères**. Les autres cliquent sur **Rejoindre** et entrent ce code. Chacun travaille sur ses propres écrans et voit ceux des autres en lecture seule.

**Puis-je bloquer temporairement une session pendant l'évaluation ?**
→ Oui : dans le détail de la session, cliquez sur **🔒 Bloquer**. Les élèves ne peuvent plus accéder à la session. Cliquez sur **🔓 Débloquer** pour rouvrir l'accès.

---

*Ce tutoriel couvre la version actuelle de MaquetApp. Bon cours ! 🎨*
