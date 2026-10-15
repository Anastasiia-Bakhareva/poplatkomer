# Postup práce s AI a klíčová rozhodnutí

> **Shrnutí, ne přepis.** Dokument shrnuje průběh práce s agentem Claude Code a zdůvodnění rozhodnutí. Vychází z konverzace v `claude-code-konverzace.md` (komunikace probíhala rusky) a ze zadání `zadani-pro-agenta.md`. Čísla, barvy a nastavení odpovídají finálnímu stavu v repozitáři.

## Nástroje
| Nástroj | K čemu |
|---|---|
| **Claude Code** (desktopová aplikace Claude, model Claude Opus 5.5) | sestavení stránky, testy, kontrola, README |
| **Skill ui-ux-pro-max** (repozitář `nextlevelbuilder/ui-ux-pro-max-skill`) | databáze stylů, palet, písem, grafů a UX pravidel; dotazy přes `search.py --design-system` a `--domain` (style, typography, color, chart, ux, landing) |
| **Playwright + Chromium** | automatická kontrola v prohlížeči na 390 a 1280 px, screenshoty, export reklam |
| **Python** | daňový model `tax_model.py` (zdroj pravdy pro `tax_model.json`) |
| **npm `@fontsource-variable/*`** | písma lokálně, bez externích požadavků |

## Fáze práce a pokyny agentovi

### 1. Zadání jako jediný zdroj pravdy
Agent dostal podrobné zadání (`zadani-pro-agenta.md`): publikum, ověřená data se zdroji a daty, daňový model se vzorcem, právní pravidla, strukturu 7 obrazovek s texty, seznam zákazů „AI slop“, technickou specifikaci a kontrolní seznam převzetí. Pokyn: nevymýšlet data, u každého čísla zdroj a datum, výsledek ověřit sám testy a v prohlížeči, vše neověřené pojmenovat.

### 2. Dokončení podle zadání
Agent převzal rozpracovanou verzi a prošel ji bod po bodu proti zadání. Opravy: inline `style=""` v tabulce (na produkci by je zablokovala CSP), formát velikosti fondu („822 mld. USD“), tabulka přehledu na mobilu (místo vodorovného scrollu řádky pod sebou), výnosy dividend se čtou z `tax_model.json` místo natvrdo v kódu, API podle specifikace (`marketing_consent` vždy false, verze souhlasu `2026-10-v3`, honeypot jako první kontrola).

### 3. Vizuální směr přes skill ui-ux-pro-max
Pokyn: použít databázi skillu, ale odmítnout šablonovité výsledky. Automatický `--design-system` pro „fintech / personal finance“ opakovaně vracel glassmorphism na tmavém pozadí, Inter nebo ručně psané písmo Caveat, tedy typický „AI fintech“ vzhled. Podle pravidla skillu „retry once with a narrower query“ následovalo hledání po doménách a výběr jednotlivých principů:

| Doména skillu | Převzato | Odmítnuto |
|---|---|---|
| `style`: Skeuomorphism | metafora reálného předmětu (jen na měřáku), hloubka číselníků | textury a gradienty všude |
| `style`: Tactile Digital | tlačítka, která se při stisku zamáčknou | deformace, „jelly“ efekty |
| `style`: Bento Grid | moduly různých velikostí | zaoblené karty s měkkými stíny na šedém pozadí |
| `style`: Swiss / Brutalism | viditelné linky mřížky | syrová estetika, systémová písma |
| `landing`: Hero-Centric | nadpis + jeden silný vizuál, málo textu, jedno CTA, náznak pokračování | video v hero |
| `chart` | vodorovné sloupce s popisky u dat (srovnání), waffle (podíl), křivka (vývoj v čase) | koláčový graf, barva jako jediný nosič informace |
| `ux` | text ≥ 16 px, 35–60 znaků na řádek (mobil), chyba u pole přes `aria-describedby`, stav odesílání, `inputmode`, `prefers-reduced-motion` | — |

**Výsledný koncept „měřák“:** název „Poplatkoměr“ zní jako vodoměr nebo elektroměr. Hlavní prvek je proto měřák s číselníky, které se dotočí na částku, jakou poplatky „spotřebují“ za 20 let.

### 4. Vizuální systém (finální specifikace)
**Písmo:** Rubik (variabilní, OFL, lokálně, latin + latin-ext, cca 55 kB). Nadpisy 700, text 400, čísla `tabular-nums`. H1 `clamp(36px, 10vw, 58px)` na mobilu, `clamp(46px, 4.6vw, 64px)` na desktopu.

**Barvy:**
| Role | Hodnota | Použití |
|---|---|---|
| Podklad | `#EDEEE8` + milimetrová mřížka 16/80 px (průhlednost 3–5 %) | světle šedé sekce |
| Plochy | `#FFFFFF` | bílé sekce, karty fondů |
| Text | `#141414`, sekundární `#5A5D57` (kontrast 5,7:1) | |
| Tělo přístroje | `#1B1C1A` s tečkovou texturou 14 px | hlavička, měřák, finální sekce, patička |
| Okénko číselníků | `#0E0F0D`, číslice `#F4F4F0` | |
| Signální oranžová | `#FF5B14` (černý text na ní 5,9:1) | jen akce (CTA) a vybraný fond |
| Fondy | SPYL/SPY `#2F5BEA`, CSPX/IVV `#0A8BBF`, VUAA/VOO `#1E3A8A`, IWDA/URTH `#0E9F6E`, EIMI/IEMG `#8E4FD6` | sloupce, tečky v tabulkách, křivky grafu |
| Americké fondy (v EU nedostupné) | šrafování `#9A9D95` / `#C6C8C0` | |

**Komponenty:**
- *První obrazovka jako „přístrojová deska“:* modulární mřížka s linkami (mobil 2 sloupce, desktop 6): nadpis + 3 štítky + CTA | měřák | waffle 12 × 20 (řádek = rok, tečka = měsíční vklad) | oranžová buňka „12 z 240 vašich měsíčních vkladů sní poplatky“ | volba částky | pás fondů.
- *Tlačítka:* oranžová, 1,5px tuš, „hrana“ `box-shadow 0 4px 0`, při stisku posun o 3 px.
- *Přechody sekcí:* tenké pravítko se stupnicí (dílky po 8 a 40 px).
- *Jednotný stín přístrojových bloků:* `0 26px 52px -30px rgba(20,20,20,.5)`.
- *Animace:* jen funkční (dotočení číselníků, růst sloupců, tečky waffle); `prefers-reduced-motion` je vypne.

### 5. Interaktivní prvky, aby návštěvník zůstal
Pokyn: přidat grafiku a interakci, která vychází z dat, ne dekoraci. Každé číslo se počítá z `etf_data.json` a `tax_model.json`.
- **Přepočet na vklady:** částka poplatků v počtu vašich měsíčních vkladů (IWDA, 5 000 Kč: 12 z 240).
- **Graf „Proč malé procento za 20 let tolik stojí“:** kumulované poplatky 4 evropských fondů, posuvník roku 1–20, výběr fondu.
- **Kvíz „Tři otázky“:** tři časté omyly začátečníka; odpovědi okamžitě s vysvětlením, možnosti u otázky 2 se počítají z modelu. Zdůvodnění: teorie informační mezery (Loewenstein 1994), efekt testování (Roediger & Karpicke 2006); zařazeno jako A/B hypotéza 4.
- **Osobní výpočet u formuláře** a hodnota v lepicí liště na mobilu.

### 6. Úspornější první obrazovka
Pokyn: méně textu, víc grafiky, nepřetížit. Text v hero se zkrátil zhruba na polovinu (cca 450 znaků). Podtitulek nahradily 3 štítky s ikonami, dlouhé popisky kompaktní řádky fondů (ticker + poplatek + krátký index).

### 7. Kontrola podle zadání a opravy
Agent prošel zadání bod po bodu a vyhodnotil řešení z pohledu recruitera a tech leada. Na základě toho:
- kvíz a graf se po odeslání skrývají (CTA kvízu vedlo na skrytý formulář);
- čísla ve větách se doplňují z dat (`data-fill`), ne natvrdo;
- CTA „Poslat mi srovnání“ → „Zobrazit srovnání“ (e-mailem se nic neposílá, text nesmí slibovat odeslání); odchylka zapsaná v README;
- do repozitáře přibyly `tax_model.py`, `tests/e2e.js`, `tests/dev.js`, `package.json` (`npm test`, `npm run test:e2e`, `npm run dev`);
- README sjednocené s finální stránkou a doplněné o tabulku vědomých odchylek od zadání.

### 8. Reklamy A a B
Kreativy 1080 × 1350 (4:5, mobilní feed) a náhledy příspěvku s texty přesně podle zadání. Vizuál navazuje na první obrazovku (A: měřák 60 400 Kč a „12 z 240“; B: tři páry americký → evropský dvojník). Čísla se počítají z dat, `npm run ads` ověří shodu s modelem, že se vše vejde do formátu a že stránka nemá chyby CSP.

## Jak se výsledek ověřoval
- `npm test`: JS model (`calc.js`) a Python model (`tax_model.py`) proti `tax_model.json` na 1 Kč; API (validace e-mailu, honeypot, metody, bílá listina událostí).
- `npm run test:e2e`: 138 kontrol v Chromiu na 390 a 1280 px, varianty A i B, s hlavičkami CSP z `vercel.json`: částky ve sloupcích a na měřáku proti modelu při 3/5/8 tis. Kč, přepnutí fondu, graf růstu, kvíz, čísla v textu z dat a v řádku, hero bez VOO/VUAA, náhled 3 + 2, lepicí lišta, fokus po CTA, chyba u neplatného e-mailu, přehled po odeslání (10 ETF, ISIN, poznámka u VOO, rozsah 41–81 tis. a 27 tis.), skryté sekce, FAQ na celou šířku, tisk do PDF, události a lead v logu, žádné chyby konzole.
- Kontrola živého webu na Vercelu: obě varianty, hlavičky, API, písmo, částky proti modelu.
- Vizuální kontrola screenshotů po každé změně.

## Kde se AI mýlila a jak se to zachytilo
| Chyba | Jak se zachytila | Řešení |
|---|---|---|
| Automatický návrh skillu byl šablonovitý (glassmorphism, Inter, Caveat) | porovnání se seznamem zákazů | výběr po doménách |
| Inline styly v tabulce by na produkci zablokovala CSP | lokální server se stejnými hlavičkami jako Vercel | šířky nastavuje JS |
| Popisky os grafu na mobilu 9 px a mimo plochu | screenshot | větší, uvnitř grafu |
| Čísla značek 1–3 na ilustraci neodpovídala bodům seznamu | screenshot | posunuté značky |
| SPYL a CSPX měly stejnou barvu | zpětná vazba | barvy podle fondu |
| Kvíz a graf zůstaly po odeslání, CTA vedlo na skrytý formulář | kontrola podle zadání | skryté po odeslání |
| Čísla v „Pro koho“ padala na samostatné řádky | screenshot (e2e kontroloval jen text) | oprava stylu + e2e kontrola rozložení |
| Kreativa B se nevešla do 1080 × 1350, upozornění bylo oříznuté | screenshot | zkrácení + automatická kontrola |
| `LEAD_WEBHOOK_URL` označen jako povinný | kontrola proti zadání (§11: nepovinné) | opraveno v návodu |
| Test dvakrát selhal kvůli pořadí kroků, ne kvůli stránce | samostatné ověření chování | oprava testu |
