# 🔒 Guide des Règles de Sécurité Firebase

Ce guide explique comment déployer et configurer les règles de sécurité Firebase pour votre jeu Zoo Tycoon 3D.

## 📁 Fichiers de Règles

### 1. **firestore.rules** - Firestore Database (Recommandé)
Fichier de règles pour Cloud Firestore (utilisé actuellement dans le jeu).

### 2. **database.rules.json** - Realtime Database
Fichier de règles pour Realtime Database (pour utilisation future).

---

## 🚀 Déploiement des Règles

### Méthode 1 : Via Firebase Console (Facile)

#### Pour Firestore :
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **zoo1-d3a2c**
3. Dans le menu de gauche : **Firestore Database** → **Règles**
4. Copiez le contenu de [firestore.rules](firestore.rules)
5. Collez dans l'éditeur
6. Cliquez sur **Publier**

#### Pour Realtime Database :
1. Dans le menu de gauche : **Realtime Database** → **Règles**
2. Copiez le contenu de [database.rules.json](database.rules.json)
3. Collez dans l'éditeur
4. Cliquez sur **Publier**

---

### Méthode 2 : Via Firebase CLI (Avancé)

#### Installation
```bash
npm install -g firebase-tools
firebase login
```

#### Initialisation (première fois)
```bash
firebase init

# Sélectionnez :
# - Firestore
# - Realtime Database
# - Projet : zoo1-d3a2c
```

#### Déploiement
```bash
# Déployer les règles Firestore uniquement
firebase deploy --only firestore:rules

# Déployer les règles Realtime Database uniquement
firebase deploy --only database

# Déployer toutes les règles
firebase deploy --only firestore:rules,database
```

---

## 🛡️ Sécurité des Règles Firestore

### Règles Implémentées

#### **Collection `users`**
```javascript
✅ Lecture : Tout utilisateur authentifié
✅ Création : Uniquement son propre profil avec données valides
✅ Modification : Uniquement son propre profil
✅ Suppression : Uniquement son propre profil
```

**Protection :**
- L'utilisateur ne peut pas modifier son `uid`, `email`, ou `createdAt`
- Validation des champs obligatoires
- Empêche la création de profils pour d'autres utilisateurs

#### **Collection `zoos`**
```javascript
✅ Lecture : Zoos publics OU son propre zoo
✅ Création : Uniquement son propre zoo avec données valides
✅ Modification : Uniquement son propre zoo
✅ Suppression : Uniquement son propre zoo
```

**Protection :**
- Impossible de lire les zoos privés des autres
- Impossible de modifier le `userId` d'un zoo
- Validation des champs obligatoires (`userId`, `userName`, `isPublic`, etc.)

#### **Collections Futures** (Préparées)
```javascript
📊 stats : Lecture pour tous, écriture authentifiée
💬 comments : Lecture pour tous, écriture propre contenu
🏆 achievements : Lecture pour tous, écriture propre achievements
```

---

## 🔍 Fonctions Helper

### `isAuthenticated()`
Vérifie si l'utilisateur est connecté.

### `isOwner(userId)`
Vérifie si l'utilisateur est le propriétaire de la ressource.

### `isValidUser()`
Valide la structure et le contenu des données utilisateur.

### `isValidZoo()`
Valide la structure et le contenu des données zoo.

---

## 🧪 Tester les Règles

### Dans Firebase Console

1. Allez dans **Firestore Database** → **Règles**
2. Cliquez sur l'onglet **Simulateur de règles**
3. Configurez un test :

**Exemple 1 : Lecture du profil**
```
Type : get
Emplacement : /users/USER_ID
Authentifié : Oui (avec UID)
```

**Exemple 2 : Création d'un zoo**
```
Type : create
Emplacement : /zoos/USER_ID
Authentifié : Oui (avec UID = USER_ID)
Données : {
  "userId": "USER_ID",
  "userName": "Test User",
  "isPublic": true,
  "lastUpdated": "2024-01-01"
}
```

---

## 🛠️ Structure des Données

### Collection `users/{userId}`
```json
{
  "uid": "string (obligatoire, = userId)",
  "email": "string (obligatoire, = auth.email)",
  "displayName": "string (obligatoire, 1-50 chars)",
  "createdAt": "string (obligatoire, ISO date)",
  "friends": ["userId1", "userId2", ...],
  "publicZoos": ["zooId1", ...]
}
```

### Collection `zoos/{userId}`
```json
{
  "userId": "string (obligatoire, = userId)",
  "userName": "string (obligatoire)",
  "isPublic": "boolean (obligatoire)",
  "lastUpdated": "string (obligatoire, ISO date)",
  "version": "string (obligatoire)",
  "timestamp": "number (obligatoire)",
  "zoo": {
    "money": "number",
    "date": { "month": "number", "year": "number" },
    "zooRating": "number",
    "guestCount": "number"
  },
  "grid": { "width": "number", "height": "number", "tiles": "array" },
  "exhibits": "array",
  "animals": "array",
  "buildings": "array",
  "entrance": "object | null",
  "expansion": { "currentSize": "number" },
  "satisfaction": { "history": "array", "average": "number" },
  "unlockedAnimals": "array"
}
```

---

## ⚠️ Règles par Défaut (À REMPLACER)

### Firestore (NON SÉCURISÉ)
```javascript
// ⛔ NE PAS UTILISER EN PRODUCTION
allow read, write: if true;
```

### Firestore (TROP RESTRICTIF)
```javascript
// ⛔ BLOQUE TOUT
allow read, write: if false;
```

### ✅ Utiliser les règles de [firestore.rules](firestore.rules)

---

## 🔐 Bonnes Pratiques

### ✅ À FAIRE
- Toujours authentifier les utilisateurs
- Valider les données côté serveur (règles)
- Limiter l'accès aux données personnelles
- Utiliser des fonctions helper pour la lisibilité
- Tester les règles avant déploiement

### ❌ À ÉVITER
- `allow read, write: if true;` en production
- Faire confiance aux données client
- Exposer des données sensibles
- Règles trop complexes (performances)
- Oublier de mettre à jour après changements

---

## 📊 Monitoring

### Vérifier l'utilisation des règles

1. **Firebase Console** → **Firestore Database** → **Utilisation**
2. Vérifiez les **lectures refusées** / **écritures refusées**
3. Si trop de refus, vérifiez vos règles

### Logs de sécurité

1. **Firebase Console** → **Firestore Database** → **Règles**
2. Consultez les violations récentes
3. Ajustez les règles si nécessaire

---

## 🆘 Dépannage

### Erreur : "Missing or insufficient permissions"

**Cause :** Les règles bloquent l'accès

**Solutions :**
1. Vérifiez que l'utilisateur est authentifié
2. Vérifiez que le `userId` correspond à `auth.uid`
3. Pour les zoos : vérifiez que `isPublic = true` ou que c'est votre zoo
4. Consultez les logs dans Firebase Console

### Erreur : "Document validation failed"

**Cause :** Les données ne respectent pas les validations

**Solutions :**
1. Vérifiez que tous les champs obligatoires sont présents
2. Vérifiez les types de données (string, number, boolean)
3. Pour users : `uid` = `auth.uid` et `email` = `auth.token.email`
4. Pour zoos : `userId` = `auth.uid`

### Les règles ne s'appliquent pas

**Cause :** Règles non déployées ou cache

**Solutions :**
1. Redéployez : `firebase deploy --only firestore:rules`
2. Attendez 1-2 minutes (propagation)
3. Videz le cache du navigateur
4. Vérifiez dans Firebase Console que les règles sont à jour

---

## 📖 Ressources

- [Documentation Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Realtime Database Rules](https://firebase.google.com/docs/database/security)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Tester les règles](https://firebase.google.com/docs/firestore/security/test-rules-emulator)

---

## 🎯 Checklist Déploiement

- [ ] Copier [firestore.rules](firestore.rules) dans Firebase Console
- [ ] Publier les règles Firestore
- [ ] Tester avec le simulateur de règles
- [ ] Vérifier qu'un utilisateur peut créer son profil
- [ ] Vérifier qu'un utilisateur peut sauvegarder son zoo
- [ ] Vérifier qu'un utilisateur peut voir les zoos publics
- [ ] Vérifier qu'un utilisateur NE PEUT PAS voir les zoos privés des autres
- [ ] Vérifier qu'un utilisateur NE PEUT PAS modifier les zoos des autres
- [ ] Monitorer les erreurs pendant les premières heures
- [ ] (Optionnel) Déployer database.rules.json si vous utilisez Realtime Database

---

**Vos données sont maintenant sécurisées ! 🔒**
