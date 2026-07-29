# CryptoWatcher — Client

Ez a mappa tartalmazza a CryptoWatcher Angular kliensalkalmazását.

**Cél:** kriptovaluták böngészése és követése (figyelőlista), árfolyamriasztások kezelése, befektetések/portfólió megjelenítése, valamint admin funkciók.

**Technológiák:** Angular (standalone komponensek), Angular Material, Firebase Auth + Firestore.

## Előfeltételek

- Node.js (LTS ajánlott)
- npm

## Lokális futtatás

1) Függőségek telepítése:

```bash
npm install
```

2) Dev szerver indítása:

```bash
npm start
```

Az alkalmazás alapértelmezetten itt fut: `http://localhost:4200/`

## Firebase konfiguráció

A Firebase inicializálás itt található:

- `src/app/services/db.ts`

Ha saját Firebase projektet használsz, a `firebaseConfig` értékeit cseréld le a sajátodra.

## Hasznos parancsok

```bash
# build
npm run build

# unit tesztek (ChromeHeadless)
npm run test:unit

# e2e tesztek (Playwright)
npm run test:e2e
```
