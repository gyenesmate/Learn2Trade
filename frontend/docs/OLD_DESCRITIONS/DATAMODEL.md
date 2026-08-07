# Adatmodell

Ez a dokumentum részletezi a projektben használt fő adatmodelleket, azok mezőit és kapcsolatait a `client/src/app/const/models.ts` alapján.

> Megjegyzés: az `id` mezők (pl. `Investment.id`) a Firestore dokumentumazonosítókhoz igazodnak.

## User
**Leírás:** A felhasználókat reprezentáló entitás.

| Mező                | Típus                                      | Leírás |
|---------------------|--------------------------------------------|--------|
| uid                 | string                                     | Felhasználó egyedi azonosítója |
| userName            | string                                     | Felhasználónév |
| email               | string                                     | Email cím |
| avatarUrl           | string \| null \| undefined                | Profilkép URL (opcionális) |
| preferences         | object                                     | Felhasználói beállítások |
| └ watchlistSubscriptions | WatchlistSubscription[] \| null \| undefined | Figyelőlista előfizetések (opcionális) |
| └ investments       | Investment[] \| null \| undefined         | Befektetések (opcionális) |
| └ websiteCurrencyBalance | number                                 | Weboldalon elérhető egyenleg |
| └ profitIndex       | number                                     | Profit index |
| └ theme             | string                                     | Téma neve |
| isAdmin             | boolean                                    | Admin jogosultság |
| isBanned            | boolean                                    | Tiltott (kitiltott) felhasználó |
| createdAt           | Timestamp                                  | Létrehozás ideje |
| updatedAt           | Timestamp \| undefined                     | Utolsó módosítás ideje (opcionális) |

## CryptoCurrency
**Leírás:** Kriptovalutákat reprezentáló entitás.

| Mező           | Típus   | Leírás |
|----------------|---------|--------|
| id             | string  | Kriptovaluta egyedi azonosítója |
| name           | string  | Kriptovaluta neve |
| symbol         | string  | Rövidítés (pl. BTC) |
| exchangeCurrency | string | Milyen pénznemre váltható (pl. USD) |

## WatchlistSubscription
**Leírás:** Felhasználó által figyelt kriptovaluták.

| Mező              | Típus   | Leírás |
|-------------------|---------|--------|
| id                | string  | Előfizetés azonosítója |
| cryptoCurrencyId  | string  | Hivatkozott kriptovaluta azonosítója |

## Investment
**Leírás:** Felhasználó befektetései kriptovalutákba.

| Mező           | Típus         | Leírás |
|----------------|--------------|--------|
| id             | string       | Befektetés azonosítója |
| cryptoCurrencyId | string      | Kriptovaluta azonosító |
| userId         | string       | Felhasználó azonosítója |
| amount         | number       | Mennyiség (a kiválasztott kriptovalutában) |
| buyingPrice    | number       | Vásárlási ár |
| sellingPrice   | number \| null | Eladási ár (ha eladva) |
| isSold         | boolean \| null | El lett-e adva |
| description    | string       | Leírás |
| soldAt         | Timestamp \| null | Eladás ideje (ha eladva) |
| createdAt      | Timestamp    | Létrehozás ideje |

## PriceAlert
**Leírás:** Árfigyelmeztetések a figyelt kriptovalutákhoz.

| Mező                  | Típus   | Leírás |
|-----------------------|---------|--------|
| id                    | string  | Figyelmeztetés azonosítója |
| cryptoCurrencyId      | string  | Hivatkozott kriptovaluta azonosítója |
| userId                | string  | A figyelmeztetés tulajdonosának azonosítója |
| alertPrice            | number  | Ár, amelynél figyelmeztet |
| description           | string  | Leírás |
| type                  | 'above' \| 'below' | Milyen irányú ármozgásra figyelmeztet |
| isActive              | boolean | Aktív-e a riasztás |
| createdAt             | Timestamp | Létrehozás ideje |

---
## Kapcsolatok (áttekintés)

- `User.preferences.watchlistSubscriptions[]` elemei `cryptoCurrencyId` alapján hivatkoznak `CryptoCurrency`-re.
- `Investment.userId` → `User.uid`, `Investment.cryptoCurrencyId` → `CryptoCurrency.id`.
- `PriceAlert.userId` → `User.uid`, `PriceAlert.cryptoCurrencyId` → `CryptoCurrency.id`.
