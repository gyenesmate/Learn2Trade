
# CryptoWatcher — SPECIFICATION.md

## Pontozás (2 pont)

| Tartalom                        | Leírás |
|---------------------------------|--------|
| **Projekt leírás**              | Az alkalmazás rövid bemutatása (mi az app, kinek szól, mit csinál) |
| **Funkcionális követelmények**  | Az alkalmazás fő funkcióinak felsorolása modulonként/funkció-csoportonként |
| **Nem-funkcionális követelmények** | Technológiai döntések (keretrendszer, nyelv, backend), teljesítmény- és UX-elvárások |
| **Felhasználói szerepkörök**    | Legalább 2 szerep vagy interakciós mód leírása |
| **Képernyő-lista / sitemap**    | Az alkalmazás oldalainak felsorolása, navigáció leírása |

---

## Projekt leírás

CryptoWatcher egy webes alkalmazás, amely lehetővé teszi a felhasználók számára, hogy kriptovalutákat figyeljenek, árfolyamriasztásokat állítsanak be, és befektessenek egy belső, weboldalon vezetett egyenleggel. Az alkalmazás célja, hogy egyszerűen és átláthatóan segítse a felhasználókat a kriptovaluta portfóliójuk kezelésében, árfolyamok követésében és befektetési döntéseik támogatásában. Az app mindenki számára elérhető, aki érdeklődik a kriptovaluták iránt, de külön adminisztrátori jogosultságok is léteznek.

## Funkcionális követelmények

- Felhasználói regisztráció és bejelentkezés
- Kriptovaluták listázása, részleteinek megtekintése
- Kriptovaluták figyelőlistára helyezése
- Árfolyamriasztások beállítása figyelt valutákhoz
- Befektetés kriptovalutákba a weboldal egyenlegéből
- Portfólió és befektetések áttekintése
- Saját profil és beállítások szerkesztése
- Adminisztrátor: új kriptovaluták hozzáadása, meglévők törlése
- Adminisztrátor: felhasználók törlése

## Nem-funkcionális követelmények

- **Technológia:** Angular (frontend), Firebase/Firestore (backend és autentikáció)
- **Teljesítmény:** Gyors oldalváltás, valós idejű adatok frissítése (pl. árfolyamok)
- **UX:** Reszponzív, mobilbarát felület, egyszerű navigáció, érthető visszajelzések
- **Biztonság:** Jogosultságkezelés, csak admin végezhet adminisztrációs műveleteket

## Felhasználói szerepkörök

- **Admin:**
	- Új kriptovaluták hozzáadása, meglévők törlése
	- Felhasználók törlése
	- Teljes portfólió és felhasználói adatok áttekintése
- **Felhasználó:**
	- Kriptovaluták figyelése, árfolyamriasztások beállítása
	- Befektetés a weboldal egyenlegéből
	- Saját portfólió és beállítások kezelése

## Képernyő-lista / Sitemap

- **Főoldal**: Áttekintés, bejelentkezés/regisztráció
- **Dashboard**: Portfólió, befektetések, analitika
- **Kriptovaluta részletek**: Árfolyam, grafikon, befektetési lehetőség
- **Profil**: Személyes adatok, beállítások
- **Figyelőlista**: Figyelt valuták, riasztások
- **Admin felület**: Kriptovaluták és felhasználók kezelése
- **Bejelentkezés / Regisztráció**: Felhasználói hitelesítés
- **404 / Not Found**: Nem létező oldal esetén

---

## Nem-funkcionális követelmények

1. A jelszó tárolás bcrypt hash-sel történik.
2. JWT alapú autentikáció, token lejárati idővel.
3. Role-based hozzáférés-vezérlés middleware-rel megvalósítva.
4. CORS konfiguráció a kliens-szerver kommunikációhoz.
5. Hibakezelés: a szerver értelmes HTTP státuszkodokat és hibaüzeneteket ad vissza.
6. Reszponzív felhasználói felület Angular Material komponensekkel.

---

## Telepítés és futtatás

A rendszer minden komponense konténerizált formában lesz üzemeltetve. A rendszer futtatásához szükséges előfeltételek:

- Node.js (v24)
- Angular CLI (v21)

---

## Mappaszerkezet

A GitHub repository várt struktúrája:

| Mappa / Fájl | Leírás |
|---|---|
| `/server` | Express.js szerver forráskód |
| `/client` | Angular alkalmazás forráskód |
| `/docs` | Dokumentáció (ez a specifikáció is) |
| `/prompts` | AI prompt-ok és elemzés |
| `README.md` | Telepítési útmutató |
