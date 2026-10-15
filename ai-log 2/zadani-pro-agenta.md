# Zadání pro agenta Claude Code: landing page „Poplatkoměr“

> **Překlad.** Originál zadání byl napsán rusky (soubor `PROMPT_poplatkomer.md`, v konverzaci vložen jako první soubor). Toto je jeho věrný překlad do češtiny bez úprav obsahu. Zadání shrnuje rozhodnutí, ověřená data a pravidla z předchozích fází práce a slouží jako jediný zdroj pravdy pro dokončení.

Pracuješ jako senior marketér, analytik a front-end vývojář. Níže je úplný kontext: zadání, všechna přijatá rozhodnutí, ověřená data, pravidla designu a právní omezení. Neptej se znovu na to, co je zde už rozhodnuto. Komunikuj se mnou rusky, veškerý text na stránce a v reklamě piš česky.

---

## 0. Jak pracovat

- Nejdřív jednou větou řekni, co děláš, pak pracuj. Krátké závěrečné zprávy, bez převyprávění kroků.
- Nevymýšlej data. Každé číslo má zdroj (URL) a datum. Co není ověřeno, označuj „neověřeno“ / „částečně ověřeno“.
- Vše, co není hotové nebo co je předpoklad, přímo pojmenuj v README a v odpovědi mně.
- Výsledek kontroluj sám: testy, vykreslení v prohlížeči (390 a 1280 px, obě varianty A a B, odeslání formuláře, lepicí tlačítko), porovnání každého čísla s `etf_data.json`.
- Skutečná omezení prostředí (zohledni je, ať neztrácíš čas): z cloudového kontejneru jsou dostupné npm, pip a GitHub proxy; nedostupné jsou API Vercelu a většina webů (včetně fotobank). Chromium: `/opt/pw-browsers/chromium` (Playwright, `--no-sandbox`). HTTP server pro kontrolu spouštěj ve stejném příkazu jako screenshoty (proces na pozadí volání nepřežije). Písma a ikony ber přes npm (`@fontsource-variable/...`) a ukládej lokálně.
- Na Vercel nemůžeš nasadit bez přístupu k mému účtu (token do chatu nežádáme). Dej návod: `npx vercel --prod` ve složce projektu nebo import repozitáře GitHub do Vercelu.

---

## 1. Původní zadání (přeloženo ze slovenštiny)

Testovací úlohu je třeba vypracovat pomocí AI nástrojů (Claude Code apod.). Zde jde jen o konverzní landing page.

**Konverzní landing page:** srovnání ETF obchodovaných na NYSE pro českého drobného investora, který přišel z mobilní reklamy. Funguje jako lead magnet. Požadavky:
- určit publikum, co návštěvník dostane za kontakt a kdy ho o kontakt žádáme;
- dvě verze reklamy; první obrazovka navazuje na slib reklamy;
- interaktivní prvky, které vedou ke kontaktu; minimum polí formuláře; zážitek po odeslání;
- reálná data se zdroji; měření celé cesty od příchodu po odeslání formuláře;
- README: zdůvodnění pořadí sekcí, očekávaná konverze, tři A/B hypotézy seřazené podle očekávaného dopadu;
- nasazení na bezplatný hosting (např. Vercel);
- stránka nesmí vypadat jako výchozí výstup Clauda; kritérium: „could we run ads on it tomorrow“.

**Obecné požadavky:** při nedostatku času upřednostnit hlavní věci a napsat, co chybí. V README popsat použití AI (jaké pokyny dostali agenti, jak se výsledek ověřoval, kde se AI mýlila). Nejasnosti řešit samostatně a zdůvodnit.

---

## 2. Cílové publikum (finální verze)

- Češi 25–40 let, hrubý příjem cca 50–75 tis. Kč/měs. (ČSÚ: průměrná hrubá mzda Q2 2026 — 51 966 Kč; Praha — 66 459 Kč). V README používat hrubé částky a označovat je „hrubý“.
- Míra úspor cca 19 %. Pravidelné vklady 3 000 / 5 000 / 8 000 Kč jsou **předpoklad**, označovat jako předpoklad, ne jako fakt.
- Hlavní zařízení: mobil. Začátečník v ETF, nezná tickery ani zkratky.
- Úhel „inflace žere úspory“ je slabý (spořicí účty ~2,5 % vs. CPI ~2,0 %), proto hlavní úhel: **poplatky**. Vedlejší úhel (varianta B): **dostupnost** amerických ETF pro drobného investora v EU.
- Stránka se ptá na výši měsíčního vkladu, ne na příjem.

---

## 3. Dostupnost a klíčový fakt

- Americké ETF nemají PRIIPs KID, proto jsou pro drobné klienty v EU obvykle nedostupné. Alternativa pro drobné investory: irský UCITS ETF na stejný index („evropský dvojník“). Profesionální status klienta pro cílovou skupinu nepřichází v úvahu.
- QQQ vyřazen: obchoduje se na Nasdaqu, ne na NYSE. Všech pět vybraných amerických ETF se obchoduje na NYSE Arca.
- Klíčové zjištění modelu: **typ fondu (akumulační/distribuční) a formulář W-8BEN ovlivní 20letý výsledek víc než rozdíl v TER.** Rozdíl akum./dist. při stejném poplatku: ~41–81 tis. Kč (při 5 000 Kč/měs.). Maximální rozdíl v poplatcích mezi americkým a evropským fondem: ~27 tis. Kč. Nejlevnější S&P 500 UCITS: SPYL (0,03 %).
- Nemodeluje se: riziko americké dědické daně (US-situs estate tax nad 60 tis. USD pro nerezidenty držící americké ETF), kurzové poplatky brokera, daň z prodeje, pohyby kurzu.

---

## 4. Ověřená data (`data/etf_data.json`, staženo 2026-10-13)

Formát: `meta`, `pairs[]` (každý pár má `us` a `ucits`), `source_errors_found`. TER v procentech (0.03 = 0,03 %). Každý záznam má `source`, `as_of`, `verification` (`issuer` nebo `partial`).

| Index | USA (NYSE Arca) | TER | AUM, datum | Zdroj | Evropa (UCITS) | TER | AUM | Zdroj |
|---|---|---|---|---|---|---|---|---|
| S&P 500 | VOO | 0,03 | null (zdroje se rozcházejí, nezveřejňujeme) | Vanguard factsheet F0968 (data k 31. 12. 2024), burza NYSE Arca podle sekundárního zdroje; **partial** | VUAA, IE00BFMXXD54, Acc | 0,07 (OCF) | null; **partial** (factsheet vydání 30. 11. 2025) | fund-docs.vanguard.com |
| S&P 500 | SPY, US78462F1030 | 0,0945 (gross) | 821 678 530 000 USD, 9. 10. 2026; od 22. 1. 1993 | ssga.com (SPY) | SPYL, IE000XZSV718, Acc | 0,03 | 42 371 320 000 USD **k 15. 7. 2026 (zastaralé)** | ssga.com (SPYL) |
| S&P 500 | IVV | 0,03 | 896 439 871 787 USD, 9. 10. 2026; od 15. 5. 2000 | ishares.com | CSPX, IE00B5BMR087, Acc, registrován v ČR | 0,07 | 158 244 488 930 (třída) | ishares.com |
| MSCI World | URTH | 0,24 | 8 288 680 572 USD, 12. 10. 2026; od 10. 1. 2012 | ishares.com | IWDA/SWDA, IE00B4L5Y983, Acc, ČR | 0,20 | 149 261 172 452 (třída) | ishares.com |
| MSCI EM IMI | IEMG | 0,09 | 158 789 111 706 USD, 8. 10. 2026; od 18. 10. 2012 | ishares.com | EIMI, IE00BKM4GZ66, Acc, ČR | 0,18 | 45 307 549 977 (třída) | ishares.com |

Známé chyby zdrojů (zapsané v `source_errors_found`, tato data nepoužívat): agregátor Wealthyhood uváděl TER SPYL 3,00 % a VUAA 7,00 % (desetinné chyby, správci: 0,03 % a 0,07 %); odhady AUM VOO se liší od ~1,04 bil. USD do ~1,7 bil. USD; stránka Vanguardu vrátila jen metadata (JS), proto jsou VOO/VUAA ověřené částečně. Před spuštěním obnovit VOO/VUAA/SPYL.

---

## 5. Daňový model (český rezident)

**Předpoklady** (`data/tax_model.json`, Python `tax_model.py`, JS `calc.js` s testem shody na 1 Kč): vklad 5 000 Kč/měs., 20 let, 7 % hrubý výnos, dividendový výnos indexu: S&P 500 1,06 %, MSCI World 1,38 %, MSCI EM IMI 2,19 %. Daň z prodeje se nezapočítává (předpoklad: osvobození po 3letém testu), kurz měn se nezapočítává.

**Sazby daně z dividend:** americký ETF s W-8BEN 15 %; bez W-8BEN 30 % (započítá se 15 %); UCITS akumulační 15 % (na úrovni fondu, USA); UCITS distribuční ≈ 27,75 % (1 − 0,85 × 0,85).

**Vzorec (měsíční krok):** `v += monthly; v *= (1+g)^(1/12); v += v*(y/12)*(1-taxDiv); v -= v*(ter/12)`, kde `g = 0,07 − y`, `y` je dividendový výnos, `ter` jako desetinné číslo.

**Cena poplatku za N let** = `fv(ter=0) − fv(ter)` při stejném daňovém zatížení (15 %) u obou. Pro 5 000 Kč/měs. za 20 let: VOO 9 214, VUAA 21 437, SPY 28 888, SPYL 9 214, IVV 9 214, CSPX 21 437, URTH 72 267, IWDA 60 397, IEMG 27 068, EIMI 53 784 Kč.

**Konečné hodnoty portfolia, Kč (vloženo 1 200 000):**
- VOO/VUAA a IVV/CSPX: US s W-8BEN 2 513 391; US bez W-8BEN 2 465 262; UCITS Acc 2 501 168; UCITS Dist 2 460 427.
- SPY/SPYL: 2 493 717; 2 446 042; 2 513 391; 2 472 410.
- URTH/IWDA: 2 440 894; 2 380 633; 2 452 764; 2 401 125.
- IEMG/EIMI: 2 461 049; 2 365 360; 2 434 333; 2 353 777.

**Daňová fakta (ČR):** zahraniční dividendy 15 % (23 % nad hranicí vysokých příjmů), zápočet zahraniční daně do sazby smlouvy (15 % pro USA, nutný W-8BEN, platí do konce 3. roku po podpisu); prodej: osvobození po 3letém testu (v roce 2026 bez limitu), jinak 15 %/23 %; roční osvobození při příjmu z prodejů do 100 tis. Kč. Akumulační UCITS neplatí českou daň z dividend až do prodeje.

---

## 6. Právní a regulatorní pravidla (české/EU právo; zdroje sekundární, **nutná kontrola právníkem**)

- Investiční služby vyžadují licenci ČNB (ZPKT 256/2004). Individuální doporučení mohou být považována za investiční poradenství. Předpokládáme, že provozovatel stránky je neutrální vydavatel, ne broker ani poradce; stránka nedává doporučení a nic neprodává.
- ČNB: veřejné příspěvky mohou být investičními doporučeními podle MAR; první přístup je vzdělávací. Zákon 40/1995 (reklama): zákaz nekalých praktik, dozorový orgán může požadovat doložení faktických tvrzení, srovnávací reklama jen za podmínek, výhrada „dobrých mravů“ se týká zastrašovacích praktik (proto reklama neutrální, tázací, bez strašení).
- ESMA: komunikace férová, jasná, nezavádějící; minulá výkonnost není hlavním obsahem; věta „Minulá výkonnost nezaručuje budoucí výsledky“.
- E-mail: § 7 zákona 480/2004, předchozí souhlas, důkazní břemeno na odesílateli, odhlášení v každém e-mailu, pokuta do 10 mil. Kč; výjimka pro zákazníky se na leady nevztahuje.
- GDPR: souhlas nesmí být podmínkou pro získání bezplatného přehledu. Řešení: formulář obsahuje **jedno pole (e-mail)** bez marketingového checkboxu; e-mail se ukládá jako záznam o žádosti; zprávy jen po samostatném souhlasu (v budoucnu double opt-in přes ESP).
- Stránka musí obsahovat: upozornění na rizika („Investice nesou riziko ztráty…“), prohlášení, že nejde o investiční poradenství/doporučení/nabídku, provozovatele + IČO + kontakty, zásady zpracování údajů (kostru). Analytika bez cookies a bez osobních identifikátorů.
- Nezveřejňovat: falešné recenze, vymyšlené počty stažení, fotografii/životopis neexistujícího autora.
- Otevřené otázky pro právníka: kdo je inzerent, podmínky srovnávací reklamy podle OZ, zda „co je levnější“ není doporučení, aktuální pokuty. EU Retail Investment Strategy: ke konci roku 2025 jen politická dohoda; současný stav neověřen.

---

## 7. Lead magnet

**„Přehled ETF“:** 10 ETF (5 amerických z NYSE Arca + 5 evropských dvojníků): poplatek, velikost fondu, akum./dist., ISIN, datum a odkaz na zdroj u každé hodnoty; dopad poplatků a daní za 20 let v Kč (podle zvolené částky); zjištění o typu fondu (rozsah 41–81 tis. Kč proti ≤ 27 tis. Kč rozdílu v poplatcích); kontrolní seznam před koupí (5 bodů: dostupnost/KID, akum./dist., poplatky brokera a kurz, 3letý test, aktuálnost dat); uložení do PDF.

**Kdy žádáme o kontakt:** po ukázání hodnoty (graf poplatků a náhled tabulky, 3 páry vidět, 2 rozmazané, zóna zámku s CTA). **Co po odeslání:** celý přehled se zobrazí hned na stránce (ostatní sekce se skryjí). **Kopie e-mailem se neposílá** (ESP není připojen), proto stránka nic takového neslibuje.

---

## 8. Reklama (česky)

| | Verze A: cena poplatků | Verze B: dostupnost |
|---|---|---|
| Hlavní text | Kolik stojí poplatky ETF za 20 let? … Ilustrace, ne doporučení. | VOO a SPY si drobný investor z Česka obvykle nekoupí. Jaký je jejich evropský dvojník a kolik stojí? Informativní přehled. |
| Titulek | Kolik stojí poplatky ETF za 20 let? | Americké ETF a jejich evropští dvojníci |
| Popis | Data ze stránek správců fondů | Poplatky u 5 párů fondů |
| CTA | Zjistit více | Zobrazit srovnání |
| URL | `/?v=a&utm_source=…&utm_medium=…&utm_campaign=…&utm_content=…` | `/?v=b&…` |

---

## 9. Struktura landing page (určená mnou) a texty

Mobile-first. Obrazovky v pořadí:

1. **Hero (nad ohybem, krátce).** Mini hlavička jen s názvem „Poplatkoměr“ (pracovní, vymyšlený název; bez menu a externích odkazů). H1: varianta A „Zjistěte, kolik vás za 20 let stojí poplatky ETF“; varianta B „Najděte evropského dvojníka amerického ETF“. Podtitulek: „10 ETF na jedné stránce: poplatky, velikost a daně v Kč. Zdarma.“ **V hero není pole e-mail, jen červené tlačítko „Poslat mi srovnání“** (kotva k formuláři dole; klik posune k formuláři a dá fokus do pole). Pod tlačítkem: „Aktualizováno: říjen 2026“. Vizuál: **pruhový graf „kolik zaplatíte za 20 let“** s přepínačem částky (3 000 / 5 000 / 8 000 Kč). Varianta A: 4 evropské fondy, které lze koupit v EU (SPYL, CSPX, IWDA, EIMI), popisky jednoduchými slovy: „500 největších firem USA“, „vyspělé trhy světa“, „rozvojové trhy“; poznámka „Různé indexy mají různé poplatky. Porovnávejte fondy na stejný index.“ Varianta B: tři páry (SPY→SPYL, IVV→CSPX, URTH→IWDA), americký fond šedě („v EU obvykle nedostupný“), evropský tmavě; poznámka „Americké fondy drobní investoři v EU obvykle koupit nemohou.“ V hero **jen data ověřená správcem** (ne VOO/VUAA).
2. **Co dostanete** (3 body: Tabulka 10 ETF; Co s tím udělají poplatky a daně; Kontrolní seznam před koupí) + druhé tlačítko CTA (kotva k formuláři).
3. **Pro koho to je** (4 bolesti jazykem začátečníka: „Nevíte, který ETF vybrat.“ / „Nechcete platit zbytečné poplatky.“ / „Nerozumíte zdanění zisků v ČR.“ / „Narazili jste na „nelze koupit“.“, u každé jeden řádek odpovědi).
4. **Takhle vypadá přehled:** náhled tabulky (3 řádky vidět, 2 rozmazané, tlačítko „Zobrazit zbylé 2 páry a daně“), přepínač částky přepočítává. Pořadí řádků: nejdřív plně ověřené páry, VOO/VUAA naposled; v celém přehledu u VOO/VUAA poznámka „údaje ověřeny částečně (starší factsheet)“. Názvy indexů jednoduchými slovy; na mobilu se tabulka vejde na obrazovku bez vodorovného scrollu.
5. **Jak data zpracováváme** (metodika místo recenzí: zdroje od správců; bez agregátorů; co není ověřeno, je označeno; jednoduchý model) + seznam zdrojů (iShares, State Street, Vanguard, ČSÚ) + výrazná zástupka pro autora `[doplnit: jméno autora, fotografie a 1–2 věty o zkušenostech]`.
6. **Časté otázky** (akordeon, 5): Je to opravdu zdarma? / Co s mým e-mailem uděláte? / Je to investiční doporučení? / Jak ETF z NYSE koupím z ČR? / Jak se zdaňují?
7. **Finální CTA:** „Všech 10 ETF na jedné stránce. Zdarma.“ + **jediný formulář** (jedno pole e-mail, tlačítko „Poslat mi srovnání“, honeypot, mikrotext „Přehled uvidíte hned po zadání e-mailu. Zprávy pošleme jen s vaším souhlasem.“ + odkaz na zásady).
- **Lepicí tlačítko** na mobilu: objeví se po odrolování hero CTA, schová se u finálního formuláře a po odeslání; vede k formuláři.
- **Patička:** upozornění na rizika, „není poradenství“, kostra zásad zpracování údajů (rozbalovací blok), kontakt/provozovatel/IČO jako výrazné zástupky.
- **Po odeslání:** sekce hero/inside/who/preview/final/sticky se skryjí; zobrazí se celý přehled (tabulka 10 ETF s ISIN, velikostmi, odkazy a daty; blok „Co je víc než poplatek: typ fondu“ s vypočteným rozsahem; kontrolní seznam; tlačítko „Uložit jako PDF“; tisková sazba).

**Formát textů:** česká čísla (`0,07 %`, `5 000 Kč`, nezlomitelné mezery), popisky jednoduchým jazykem, bez žargonu na první obrazovce, slovesa v CTA, bez „→“ v tlačítkách.

---

## 10. Směr designu (finální) a seznam zákazů

**Princip:** stránka nesmí vypadat jako standardní výstup AI. Rozbor zdrojů o „AI slop“ (Adrian Krebs „Scoring 500 Show HN pages for AI design patterns“, 925 Studios „AI Slop Fonts and Gradients“, Impeccable „anti-patterns“) + vlastní analýza finančních landing pages (XTB CZ, eToro CZ, Fondee, Portu, justETF, Freenance, Financialexpertclass: světlý klidný finanční minimalismus, jeden akcent, nástroj na první obrazovce, důvěra pod hero, 3 kroky, FAQ, vrstvená upozornění).

**Znaky slopu, kterým se vyhnout:** Inter všude; fialové/„fintech“ gradienty a barevné záře; vycentrovaný hero s odznakem nad H1; řada stejných karet s ikonou nahoře; jedno zaoblení a měkké stíny na všem; ikona v barevném čtverci; číslované kroky 1-2-3 tam, kde není posloupnost; popisky verzálkami, mono štítky, řetězce přes „·“; fade-up animace u každého bloku; plovoucí odznaky; krémová + patkové písmo + terakota; černá + kyselá zelená; „novinové“ tenké linky s nulovým zaoblením; prázdné nadpisy typu „Build faster“.

**Historie iterací (neopakovat):** v1: krémový papír, patkové písmo, mono číslice, „účtenka“ (zamítnuto: šablonovité); v2: Schibsted Grotesk, grafy s křivkami (nesedělo do struktury); v3: účtenka + Manrope, zelená/limetková, karty, ikony Phosphor, plovoucí odznaky, reveal animace (zamítnuto: typický „fintech slop“).

**Finální rozhodnutí:**
- Písmo: **Archivo** (variabilní, osa šířky 62–125 %, nadpisy v úzkém řezu 75 % váha 850, text 100 %), lokálně z `fonts/` (OFL), bez externích požadavků.
- Paleta (barvy české vlajky): navy `#0F2A5C`, červená `#D7141A` (hover `#AF0F14`), bílá, světlý pás `#EEF1F6`, muted `#4A5878`, linka `#C4CDDF`, dráha `#DCE2EE`, šedá pro „americké“ pruhy `#98A5BE`, zástupky žluté `#FFE28A`. Červená jen u tlačítek/CTA, ostatní modré.
- **Žádné** karty, ikony, stíny, gradienty, zaoblení (kromě 2 px), emoji. Forma: pravé úhly, silné navy linky 3 px jako struktura, zarovnání vlevo, asymetrie, velký úzký H1 (`clamp(48px,15.5vw,84px)` na mobilu, `clamp(64px,7vw,96px)` na desktopu).
- Hlavní grafický prvek jsou **data**: vodorovné pruhy (šířka úměrná součtu poplatků, hodnota vpravo, pevná šířka sloupce hodnot) a mini pruhy v tabulce.
- Volba částky: text s podtržením (ne pilulky).
- Animace: **jedna**: růst pruhů a počítání čísel při načtení a při změně částky; `prefers-reduced-motion` vypne vše. Lepicí panel plynule vyjíždí.
- Přístupnost: viditelný fokus, kontrast ≥ 4,5:1, cíle dotyku ≥ 56 px na mobilu, `lang="cs"`, label u pole (sr-only), `aria-live`/`aria-pressed` kde je potřeba.

---

## 11. Technické zadání (stack a soubory)

Statický web na Vercelu + 2 serverless funkce. Bez build kroku, bez externích požadavků (GDPR, rychlost).

```
landing/
  index.html  styles.css  app.js  calc.js
  data/etf_data.json  data/tax_model.json
  fonts/archivo-latin-wdth-normal.woff2, archivo-latin-ext-wdth-normal.woff2, LICENSE-archivo-OFL.txt
  api/subscribe.js  api/event.js  vercel.json
  test_calc.js  test_api.js  README.md
```

- **calc.js** (UMD): `finalValue(monthly, ter, taxDiv, y, years, rGross)`, `feeCost(monthly, terPct, y, years)`, `paidIn`, `fmtCzk` (zaokrouhlení na stovky při ≥ 10 000; nezlomitelné mezery), `fmtPct`. Test `test_calc.js` porovnává výsledky s `tax_model.json` (US s W-8BEN a UCITS Acc, tolerance < 1 Kč).
- **Varianta A/B** podle `?v=a|b`: malý inline skript v `<head>` nastaví `data-v`; CSS zobrazí správný H1/popisky grafu; JS sestaví sadu řádků grafu pro variantu.
- **Data** se načítají z `data/*.json`; všechna čísla na stránce se počítají z nich (žádné natvrdo zapsané částky). Krátké názvy fondů a jednoduché názvy indexů jsou slovníky v `app.js`.
- **/api/subscribe:** POST; ověří e-mail; honeypot (`website`) → tiše 204; zapíše `LEAD` do logů s maskovaným e-mailem; přepošle záznam na `LEAD_WEBHOOK_URL` (nepovinné); ukládá `marketing_consent` (vždy false), `consent_text_version` (`2026-10-v3`), čas, variantu, částku, `loc`, utm. Při selhání API návštěvník výsledek stejně uvidí; frontend zapíše `submit_api_error`.
- **/api/event:** POST; bílá listina událostí; zapíše `EVENT` do logů; přepošle na `EVENT_WEBHOOK_URL` (nepovinné). Bez cookies; `sid` náhodné jen v paměti stránky; odeslání přes `navigator.sendBeacon` (záloha `fetch keepalive`) + `dataLayer`.
- **Události** (cesta od příchodu po odeslání): `page_view` (varianta, utm), `section_view` (sekce inside/who/preview/trust/faq/final, jednou), `amount_selected`, `cta_click` (hero/inside/lock/sticky), `faq_open`, `form_focus` (hero/final), `submit_attempt`, `submit_invalid`, `submit_api_error`, `submit_success`, `print_pdf`.
- **vercel.json:** hlavičky `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP `default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'` (inline skript je potřeba pro volbu varianty).
- Proměnné prostředí (nepovinné): `LEAD_WEBHOOK_URL`, `EVENT_WEBHOOK_URL` (kam přeposílat leady/události: Make/Zapier/ESP). Pro testovací úlohu nejsou nutné; bez nich se vše zapisuje do logů Vercelu.
- Tisk: `@media print` zobrazí jen blok po odeslání.

---

## 12. README (povinné sekce)

1. Publikum a nabídka (kdo, co dostane za kontakt, kdy žádáme o kontakt).
2. Dvě reklamy + tabulka souladu s první obrazovkou.
3. Proč tento úhel (NYSE vs. drobný investor v EU, hlavní zjištění o typu fondu).
4. Pořadí sekcí a zdůvodnění (podle 7 obrazovek výše).
5. Vizuál a proč není „šablona“ (seznam zákazů, zvolené řešení, historie zamítnutých variant).
6. Data (zdroje, data, známé mezery: VOO/VUAA částečně, AUM SPYL zastaralé).
7. Měření cesty (události, jak číst trychtýř, kde jsou logy).
8. **Očekávaná konverze:** poctivě „předpoklad, ničím nepodložený“: studený mobilní provoz, odeslání e-mailu **3–8 %** (formulář jen dole; s polem v hero výš); při CTR 1 % a CPC 5–10 Kč cena leadu ~60–300 Kč. Nahradit po prvních 300–500 návštěvách; najít externí benchmark, pokud bude čas.
9. **3 A/B hypotézy seřazené podle dopadu:** (1) pole e-mail přímo v hero vs. tlačítko s kotvou (a vysouvací panel jako třetí varianta); (2) úhel H1/grafu: A „cena poplatků“ vs. B „dostupnost“ vs. C „typ fondu je důležitější než poplatek“ (nejsilnější zjištění modelu); (3) slib za e-mail: „všech 10 ETF + daně“ vs. „kontrolní seznam před koupí“.
10. **Použití AI:** jaké pokyny agenti dostali (po krocích: publikum, ověření příjmů, dostupnost, lead magnet, daně, právní kontrola, analýza designu, sestavení, tři přepracování vizuálu podle zpětné vazby, rozbor „AI slop“); jak se ověřovalo (ČSÚ, správci s datem, test JS vs. Python, vykreslení v prohlížeči na 390/1280, obě verze, odeslání formuláře, testy API); **kde se AI mýlila:** příliš široký příjem (40–80 tis., hrubý/čistý nejasné) → opraveno; slabý úhel „inflace“ → nahrazen poplatky; agregátor s desetinnými chybami (3,00 % místo 0,03 %) → nepoužit; rozporná data VOO → nezveřejňujeme; první hero ukazoval nedostupné fondy s holými tickery → přepracováno; slib e-mailu bez ESP → odstraněn; plovoucí odznaky/tabulka přetékaly na mobilu → opraveno po vizuální kontrole; vizuál dvakrát vyšel „šablonovitě“ → nahrazen.
11. Právní stav (nutná kontrola právníkem) a otevřené otázky.
12. **Co chybí:** nasazení na Vercel; ESP/doručení PDF/double opt-in/samostatný marketingový souhlas; obnovení dat VOO/VUAA/SPYL; benchmark konverze; právní kontrola; zástupky (provozovatel, IČO, kontakt, doba uchování údajů, autor); živé ověření analytiky.

---

## 13. Kontrolní seznam převzetí (ověřit před zprávou)

- `node test_calc.js` a `node test_api.js` projdou; JS model odpovídá `tax_model.json`.
- Vykreslení: žádný vodorovný scroll na 390 px; náhled tabulky se vejde; graf v hero ukazuje správné hodnoty při 3 000/5 000/8 000 Kč; varianta B ukazuje tři páry; tlačítko v hero dá fokus do pole e-mail dole; lepicí panel se objeví a zmizí; odeslání s platným e-mailem ukáže přehled a skryje zbytek; neplatný e-mail ukáže chybu.
- V hero není VOO/VUAA; v přehledu má VOO/VUAA poznámku o částečném ověření; žádné číslo neodporuje `etf_data.json`.
- Žádné zmínky o rozesílce/kopii e-mailem jako faktu; žádné vymyšlené recenze, autoři, počítadla.
- Žluté zástupky jsou vidět a jsou uvedené v README i v odpovědi.
- Archiv `landing.zip` obsahuje všechny soubory (bez tokenů a tajných údajů); pošli mi ho jako soubor, plus screenshoty (mobil A, desktop A, mobil B).

---

## 14. Co mi odpovědět na konci

Krátce: co je hotové, co je ověřené, co není hotové a co je potřeba ode mě (nasazení na Vercel, zástupky, data, právník, ESP). Pokud požádám o změny, proveď je, znovu ověř na 390 a 1280 px, aktualizuj README a `landing.zip`.
