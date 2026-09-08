
INSERT INTO public.categories (slug, name, icon, description, kind, risk, sort_order) VALUES
('akcie','Akcie','building','Podíl na firmě. Vyděláváte růstem ceny a dividendami. Základní stavební kámen dlouhodobého portfolia.','instrument','stredni',1),
('etf','ETF','layers','Burzovně obchodovaný fond, který jedním nákupem koupí desítky až tisíce akcií. Nejlevnější cesta k diverzifikaci.','instrument','nizke',2),
('ipo','IPO','rocket','První vstup firmy na burzu. Velká očekávání, velká volatilita a často málo historických dat.','instrument','vysoke',3),
('cfd','CFD','zap','Derivát na rozdíl ceny s pákou. Umožňuje i short, ale ztráty rostou stejně rychle jako zisky.','instrument','velmi_vysoke',4),
('fondy','Podílové fondy','briefcase','Aktivně řízené fondy s manažerem. Pohodlné, ale s vyššími poplatky než ETF.','instrument','nizke',5),
('opce','Opce a futures','sigma','Termínové kontrakty na budoucí cenu. Nástroj pro zajištění i spekulaci, vyžaduje znalost řeckých písmen.','instrument','velmi_vysoke',6),
('forex','Forex','globe','Trh měnových párů, největší a nejlikvidnější trh světa. Obchoduje se 24/5 s vysokou pákou.','instrument','vysoke',7),
('komodity','Komodity','flame','Ropa, zlato, plyn, obiloviny. Cyklické trhy silně reagující na geopolitiku a počasí.','instrument','vysoke',8),
('dlouhodobe','Dlouhodobé investování','trending-up','Horizont 5 a více let. Cílem je složené úročení, ne trefování dna a vrcholu.','style','nizke',1),
('swing','Swing trading','activity','Pozice na dny až týdny. Chytáte střední výkyvy trendu, obchodujete po zavření trhu.','style','stredni',2),
('day','Day trading','sun','Pozice otevřené a zavřené během jednoho dne. Žádné přenášení rizika přes noc.','style','vysoke',3),
('scalping','Scalping','timer','Desítky obchodů denně na minutových grafech. Rozhoduje rychlost, poplatky a železná disciplína.','style','velmi_vysoke',4);

INSERT INTO public.lessons (slug, title, summary, content, level, category_slug, style_slug, duration_min, sort_order) VALUES
('co-je-burza','Co je burza a jak funguje','Kdo je na burze, proč vzniká cena a co se stane po kliknutí na tlačítko Koupit.','Burza je organizované tržiště, kde se potkává nabídka a poptávka po cenných papírech. Nekupujete od burzy, ale od jiného účastníka trhu — burza jen zajišťuje pravidla, párování pokynů a vypořádání.

Cena vzniká v takzvané knize objednávek. Na jedné straně stojí kupující s nabídkami (bid), na druhé prodávající s poptávkami (ask). Rozdíl mezi nejlepší nabídkou a poptávkou se jmenuje spread a je vaším skrytým nákladem u každého obchodu.

Když zadáte tržní pokyn, systém jej okamžitě spáruje s nejlepší dostupnou protistranou. Limitní pokyn naopak čeká v knize, dokud se cena nedostane tam, kam chcete. Začátečníci téměř vždy vydělají na tom, že si zvyknou používat limitní pokyny.','zacatecnik','akcie','dlouhodobe',12,1),
('co-jsou-akcie','Co jsou akcie a jak vydělávají','Podíl na firmě, dividendy, kapitálový výnos a co znamená být menšinovým vlastníkem.','Akcie je podíl na vlastnictví společnosti. Když držíte jednu akcii firmy, která jich vydala milion, vlastníte miliontinu jejího majetku, zisků i budoucnosti.

Vydělávat lze dvěma způsoby. Prvním je růst ceny — trh začne firmu oceňovat výše, protože roste její zisk. Druhým jsou dividendy, tedy podíl na zisku vyplácený akcionářům, typicky čtvrtletně nebo ročně.

Akcionář nese riziko jako poslední v řadě. Při krachu firmy se nejdřív vyplácejí věřitelé a až potom akcionáři, na které často nezbyde nic. Proto se akciím říká riziková, ale dlouhodobě nejvýnosnější třída aktiv.','zacatecnik','akcie','dlouhodobe',10,2),
('jak-otevrit-ucet','Jak si otevřít obchodní účet','Výběr brokera, regulace, poplatky, ověření totožnosti a první vklad.','Broker je prostředník, který za vás posílá pokyny na burzu. Vybírejte ho podle tří věcí: regulace, poplatkové struktury a nabídky trhů.

Regulace je nejdůležitější. Broker regulovaný v EU spadá pod pravidla MiFID II a účastní se garančního systému, který chrání zákaznický majetek do stanoveného limitu. Neregulovaný broker s velkou pákou v exotické jurisdikci je červená vlajka.

Poplatky mají tři vrstvy: komise za obchod, měnovou konverzi a poplatky za nečinnost či vedení účtu. U dlouhodobého investora rozhoduje hlavně konverze a komise, u aktivního tradera spread.

Otevření účtu probíhá online: ověření totožnosti podle pravidel AML, dotazník o zkušenostech a první vklad z účtu vedeného na vaše jméno.','zacatecnik','akcie','dlouhodobe',14,3),
('riziko-a-vynos','Riziko a výnos: základní rovnice','Proč nikdy neexistuje vysoký výnos bez rizika a jak riziko vlastně měřit.','Výnos je odměna za podstoupené riziko. Jakmile vám někdo slibuje vysoký výnos bez rizika, buď riziko nevidí, nebo ho před vámi schovává.

Riziko se v praxi měří volatilitou (jak moc cena kolísá) a maximálním poklesem, tedy drawdownem. Portfolio, které spadne o 50 %, potřebuje k návratu růst o 100 %. Právě proto je ochrana kapitálu důležitější než honba za výnosem.

Časový horizont riziko výrazně mění. Držení široce diverzifikovaného akciového indexu na jeden rok bylo historicky často ztrátové, na patnáct let prakticky vždy ziskové.','zacatecnik','etf','dlouhodobe',11,4),
('slozene-uroceni','Složené úročení a čas','Nejsilnější síla v investování a proč záleží na tom, kdy začnete.','Složené úročení znamená, že výnosy začnou samy vydělávat další výnosy. Zpočátku je efekt nenápadný, po dvaceti letech dominuje celému výsledku.

Příklad: 5 000 Kč měsíčně při průměrném výnosu 7 % ročně dá po 10 letech zhruba 860 tisíc, po 30 letech ale přes 5,8 milionu. Vložili jste jen 1,8 milionu — zbytek udělal čas.

Praktický důsledek je jednoduchý: pravidelnost a nízké poplatky porazí chytré načasování. Jedno procento poplatků ročně vás za třicet let může stát čtvrtinu koncového majetku.','zacatecnik','etf','dlouhodobe',9,5),
('typy-pokynu','Typy pokynů: market, limit, stop','Rozdíl mezi pokyny a proč špatně zadaný pokyn stojí peníze.','Tržní pokyn (market) se vyplní okamžitě za nejlepší dostupnou cenu. Je jistý v provedení, ale nejistý v ceně — u málo likvidních titulů může proklouznout výrazně jinam.

Limitní pokyn říká „nekoupím dráž než X". Cena je jistá, provedení nikoli. Pro investory je to výchozí volba.

Stop-loss je pokyn, který se aktivuje až při dosažení určité ceny a slouží k omezení ztráty. Stop-limit kombinuje obojí a hrozí u něj, že při rychlém propadu zůstane nevyplněný.','zacatecnik','akcie','swing',10,6),
('dane-a-poplatky','Daně a poplatky v ČR','Časový test, limit osvobození a co si musíte hlídat v daňovém přiznání.','Zisk z prodeje cenných papírů je v Česku zdanitelný příjem. Existují ale dvě běžné cesty k osvobození: časový test tříletého držení a limit ročního objemu prodejů.

Od roku 2025 platí u osvobození podle časového testu strop na celkový příjem z prodeje, který přesahuje 40 milionů korun ročně. Pro naprostou většinu drobných investorů se tedy nic nemění.

Dividendy ze zahraničí se daní zvlášť a započítává se u nich sražená daň v zemi zdroje podle smlouvy o zamezení dvojího zdanění. Vždy si stahujte roční výpis od brokera — bez něj přiznání nespočítáte.','zacatecnik','akcie','dlouhodobe',13,7),
('co-je-etf','ETF: nejjednodušší diverzifikace','Jak fungují indexové fondy, co je TER a jak poznat kvalitní ETF.','ETF je fond obchodovaný na burze, který obvykle kopíruje index. Jedním nákupem tak koupíte stovky firem najednou a rozložíte riziko jednotlivé akcie.

Klíčové parametry jsou TER (roční nákladovost), velikost fondu, způsob replikace (fyzická nebo syntetická) a nakládání s dividendou — akumulační ETF ji reinvestuje, distribuční vyplácí.

Chyba začátečníků je nakupovat pět ETF, které drží ty samé firmy. Diverzifikace není počet fondů, ale počet skutečně odlišných expozic.','stredne_pokrocily','etf','dlouhodobe',12,1),
('fundamentalni-analyza','Fundamentální analýza firmy','Výkaz zisku, rozvaha, cash flow a poměrové ukazatele v praxi.','Fundamentální analýza hledá vnitřní hodnotu firmy. Vychází ze tří výkazů: výsledovky (kolik firma vydělá), rozvahy (co vlastní a dluží) a cash flow (kolik peněz skutečně proteče).

Nejpoužívanější ukazatele jsou P/E (cena k zisku), P/B (cena k účetní hodnotě), ROE (návratnost vlastního kapitálu) a čistý dluh k EBITDA. Žádné číslo nedává smysl samo o sobě — porovnávejte je s odvětvím a s historií firmy.

Pozor na účetní kosmetiku. Rostoucí zisk při klesajícím provozním cash flow je klasický varovný signál.','stredne_pokrocily','akcie','dlouhodobe',18,2),
('ocenovani-firem','Oceňování: DCF a násobky','Jak spočítat, kolik firma opravdu stojí, a proč je vstupní předpoklad důležitější než model.','Diskontované cash flow (DCF) odhaduje budoucí volné peněžní toky a přepočítává je na dnešní hodnotu diskontní sazbou. Model je jen tak dobrý jako jeho předpoklady o růstu a marži.

Rychlejší cestou jsou násobky: firma se ocení podle toho, za kolik se obchodují srovnatelné podniky. Metoda je jednoduchá, ale zdědí i případnou nadhodnocenost celého sektoru.

Praktický přístup je počítat tři scénáře — pesimistický, základní a optimistický — a kupovat jen tehdy, když i pesimistický scénář dává rozumnou cenu. Tomu se říká bezpečnostní polštář.','stredne_pokrocily','akcie','dlouhodobe',20,3),
('ipo-jak-funguje','IPO: vstup firmy na burzu','Proces úpisu, role bank, lockup a proč IPO často zklamou.','IPO je první veřejná nabídka akcií. Firma s pomocí investičních bank stanoví cenové rozpětí, osloví institucionální investory a vydá nové akcie.

Retailový investor se k úpisové ceně dostane jen zřídka. Většina lidí nakupuje až první obchodní den, často po prudkém otevíracím skoku, tedy zbytečně draze.

Sledujte lockup — období, po které nesmí zakladatelé a fondy prodávat. Jeho konec, obvykle po 90 až 180 dnech, bývá spojen s tlakem na cenu. Prospekt čtěte hlavně kvůli sekci rizik a struktuře hlasovacích práv.','stredne_pokrocily','ipo','swing',15,4),
('podilove-fondy','Podílové fondy versus ETF','Aktivní správa, poplatky, vstupní přirážky a kdy fondy dávají smysl.','Podílový fond spravuje portfolio manažer, který se snaží překonat trh. Za to si účtuje správcovský poplatek, často 1,5 až 2,5 % ročně, někdy i vstupní přirážku.

Dlouhodobě většina aktivních fondů svůj benchmark po poplatcích nepřekoná. To neznamená, že jsou k ničemu: dávají smysl v neefektivních trzích, u nemovitostních nebo dluhopisových strategií a pro investory, kteří chtějí pohodlí a poradenský servis.

Vždy porovnávejte čistý výnos po všech poplatcích proti levnému indexovému ETF na stejný trh.','stredne_pokrocily','fondy','dlouhodobe',12,5),
('diverzifikace-portfolia','Stavba a diverzifikace portfolia','Alokace aktiv, korelace, rebalancování a rizikový profil.','Nejdůležitější rozhodnutí není výběr akcie, ale alokace: jaký podíl mají akcie, dluhopisy, hotovost a alternativy. Ta vysvětluje většinu kolísání i výnosu portfolia.

Diverzifikace funguje jen mezi aktivy, která se nechovají stejně. Deset technologických akcií není diverzifikace, protože jejich korelace je v krizi blízká jedné.

Rebalancování znamená návrat k původním váhám, typicky jednou ročně nebo při odchylce o 5 procentních bodů. Nutí vás prodávat drahé a kupovat levné, což je přesně opak toho, co dělá dav.','stredne_pokrocily','etf','dlouhodobe',16,6),
('makro-ukazatele','Makro ukazatele, které hýbou trhem','Sazby, inflace, HDP, nezaměstnanost a jak číst ekonomický kalendář.','Trhy neobchodují data, ale odchylku dat od očekávání. Proto je v ekonomickém kalendáři vždy uveden konsenzus — teprve překvapení hýbe cenou.

Nejsilnější vliv mají rozhodnutí centrálních bank o úrokových sazbách, inflační data (CPI, PPI), americká zaměstnanost (NFP) a data o HDP. Vyšší sazby obvykle tlačí dolů oceňování růstových akcií a podporují měnu.

Pro dlouhodobého investora je makro spíš kontext než signál k obchodu. Pro tradera je to seznam časů, kdy je rozumné mít menší pozici.','stredne_pokrocily','forex','swing',14,7),
('technicka-analyza-zaklady','Technická analýza: cena, objem, struktura','Supporty, rezistence, trendové linie a co grafy skutečně říkají.','Technická analýza pracuje s předpokladem, že cena obsahuje všechny dostupné informace a že chování účastníků trhu se opakuje.

Základem je struktura trhu: rostoucí maxima a minima znamenají uptrend, klesající downtrend. Supporty a rezistence jsou pásma, kde se v minulosti opakovaně objevila poptávka nebo nabídka — nejsou to čáry na milimetr přesně.

Objem potvrzuje pohyb. Průraz rezistence na slabém objemu je podezřelý, průraz s výrazným nárůstem objemu má vyšší pravděpodobnost pokračování.','pokrocily','akcie','swing',16,1),
('svickove-formace','Svíčkové formace a price action','Jak číst jednotlivé svíčky a kombinovat je s kontextem.','Každá svíčka nese čtyři informace: otevření, maximum, minimum a zavření. Dlouhý knot dolů znamená, že prodejci cenu srazili, ale kupci ji vrátili zpět.

Klasické formace jako pin bar, engulfing nebo inside bar mají smysl pouze v kontextu. Bullish engulfing na supportu v uptrendu je signál, ta samá svíčka uprostřed rozsahu je šum.

Nesnažte se naučit padesát formací. Stačí tři, kterým opravdu rozumíte, a jasné pravidlo, kde je vstup, kde stop a kde cíl.','pokrocily','akcie','swing',15,2),
('indikatory','Indikátory: klouzavé průměry, RSI, MACD','K čemu indikátory slouží, kdy lžou a jak se vyhnout přeoptimalizaci.','Indikátory jsou odvozeniny ceny. Neříkají budoucnost, jen zpřehledňují to, co se už stalo.

Klouzavé průměry (EMA 20, EMA 50, SMA 200) ukazují trend a fungují jako dynamický support. RSI měří překoupenost a hlavně divergence — cena dělá nové maximum, RSI už ne. MACD sleduje sbíhání a rozbíhání dvou průměrů.

Největší chyba je skládat pět indikátorů, které měří to samé, a pak ladit periody, dokud výsledky na historii nevypadají skvěle. To je overfitting, ne strategie.','pokrocily','akcie','swing',15,3),
('risk-management','Risk management a position sizing','Pravidlo 1 %, poměr rizika k zisku a matematika drawdownu.','Risk management je jediná část tradingu, kterou máte plně pod kontrolou. Trh nerozhodne, kolik riskujete — to rozhodnete vy.

Pravidlo 1 % říká, že na jeden obchod riskujete maximálně 1 % kapitálu. Velikost pozice pak spočítáte jako riziko v korunách děleno vzdáleností stop-lossu. Ne naopak.

Poměr rizika k zisku (RRR) určuje, jakou úspěšnost potřebujete. Při RRR 1:2 stačí 40% úspěšnost, abyste byli ziskoví. Při RRR 1:1 potřebujete přes 50 % plus poplatky.

Deset ztrát v řadě není nemožné, je to statistická jistota při dostatečném počtu obchodů. Systém musí přežít i takovou sérii.','pokrocily','cfd','swing',18,4),
('cfd-a-paka','CFD a páka: jak nepřijít o účet','Marže, margin call, financování přes noc a nejčastější pasti.','CFD je smlouva na vyrovnání rozdílu ceny. Nekupujete podkladové aktivum, jen spekulujete na jeho pohyb — a to i směrem dolů.

Páka znamená, že s 1 000 Kč marže ovládáte pozici za 30 000 Kč. Zisk i ztráta se počítají z celé pozice. Pohyb o 3 % proti vám tak smaže celou marži.

Přes noc se u CFD platí financování (swap), které dlouhodobé držení prodražuje. CFD je nástroj pro krátkodobé pozice, ne pro investování.

Statistiky brokerů podle regulace ESMA říkají, že 70 až 80 % retailových účtů na CFD ztrácí peníze. Než začnete, znejte přesně svůj maximální denní limit ztráty.','pokrocily','cfd','day',17,5),
('opce-zaklady','Opce: call, put a řecká písmena','Prémie, strike, expirace, delta a theta srozumitelně.','Opce dává právo, ne povinnost, koupit (call) nebo prodat (put) aktivum za předem danou cenu (strike) do data expirace. Za to platíte prémii.

Hodnotu opce určuje vnitřní hodnota a časová hodnota. Delta říká, o kolik se změní cena opce při pohybu podkladu o jednotku. Theta měří, kolik opce denně ztrácí pouhým plynutím času. Vega ukazuje citlivost na implikovanou volatilitu.

Nejčastější použití u investorů není spekulace, ale zajištění: nákup put opce funguje jako pojistka portfolia, krytý call generuje příjem z držených akcií.','pokrocily','opce','swing',20,6),
('psychologie-obchodovani','Psychologie obchodování','Strach, chamtivost, averze ke ztrátě a jak si postavit rutinu.','Většina ztrát nevzniká špatnou analýzou, ale porušením vlastních pravidel. Mozek je nastavený tak, že ztráta bolí zhruba dvakrát víc, než potěší stejně velký zisk.

Typické vzorce: posouvání stop-lossu, protože „se to určitě vrátí", předčasné vybírání zisků, revenge trading po ztrátě a navyšování pozice po sérii výher.

Obrana je procesní, ne emoční. Napsaný obchodní plán, checklist před vstupem, deník obchodů a pevný denní limit ztráty, po jehož dosažení vypínáte platformu.','pokrocily','akcie','day',14,7),
('intradenni-trading','Intradenní trading v praxi','Denní režim, výběr trhu, session a vstupní scénáře.','Intradenní trader nepřenáší pozice přes noc, čímž se zbavuje gapového rizika, ale platí za to poplatky a nutností být u obrazovky.

Rozhoduje výběr instrumentu s dostatečnou likviditou a volatilitou, typicky indexové futures, hlavní měnové páry nebo akcie s vysokým objemem. Nejvíc příležitostí přinášejí první dvě hodiny po otevření trhu.

Den má mít strukturu: příprava a plán před otevřením, obchodní okno, tvrdý denní limit ztráty a večerní vyhodnocení deníku. Bez struktury se z tradingu rychle stane hazard.','profesional','cfd','day',18,1),
('order-flow','Order flow a hloubka trhu','Kniha objednávek, tape reading, absorpce a imbalance.','Order flow sleduje skutečné obchody a příkazy, ne odvozené indikátory. Nástroji jsou hloubka trhu (DOM), pásková čtení, footprint grafy a kumulativní delta.

Absorpce nastává, když agresivní kupující trvale útočí na cenu, ale ta se nehýbe — v knize stojí velký pasivní prodejce. Vyčerpání takového tlaku často předchází obratu.

Pozor na spoofing a icebergy: zobrazená likvidita nemusí být skutečná. Order flow je kontextový nástroj pro potvrzení scénáře, ne samostatný signál.','profesional','opce','scalping',22,2),
('market-structure','Market structure a likvidita','Swingy, BOS, likviditní zóny a institucionální logika pohybu.','Cena se pohybuje mezi oblastmi likvidity — tam, kde leží velké množství stop-lossů a čekajících příkazů. Nad výraznými maximy a pod minimy proto často dochází k prudkému nájezdu a rychlému návratu.

Break of structure (BOS) potvrzuje pokračování trendu, change of character (CHoCH) naznačuje jeho vyčerpání. Klíčové je vždy určit, na jakém časovém rámci strukturu čtete.

Praktický postup: vyšší časový rámec určí směr a zóny, nižší rámec dá přesný vstup s malým stopem. Nikdy naopak.','profesional','cfd','day',20,3),
('backtesting','Backtesting a statistika strategie','Vzorek dat, look-ahead bias, expectancy a walk-forward test.','Backtest ověřuje strategii na historických datech. Aby měl hodnotu, potřebuje dostatečný vzorek — pod sto obchody jsou výsledky převážně náhoda.

Nejčastější chyby: look-ahead bias (použití informace, kterou jste v daný okamžik neměli), survivorship bias (testování jen na dnes existujících firmách) a ignorování poplatků a skluzu.

Sledujte expectancy: průměrný zisk na obchod = (úspěšnost × průměrný zisk) − (neúspěšnost × průměrná ztráta). Kladná expectancy po nákladech je jediné, na čem záleží. Ověřte ji ještě na datech, která model neviděl (walk-forward).','profesional','cfd','swing',22,4),
('automatizace-python','Automatizace a Python pro tradera','Datové zdroje, jednoduchý backtest v Pythonu a limity automatizace.','Python je pro tradera nejrychlejší cesta od nápadu k číslům. Základní stack: pandas na data, numpy na výpočty, matplotlib na vizualizaci a knihovna typu backtesting.py na simulaci.

Minimální kostra backtestu vypadá takto:

import pandas as pd
data = pd.read_csv("ohlc.csv", parse_dates=["date"], index_col="date")
data["ema20"] = data["close"].ewm(span=20).mean()
data["signal"] = (data["close"] > data["ema20"]).astype(int).shift(1)
data["ret"] = data["close"].pct_change() * data["signal"]
print((1 + data["ret"].fillna(0)).cumprod().iloc[-1])

Všimněte si posunu signálu o jeden řádek. Bez něj obchodujete se znalostí budoucnosti a výsledek je bezcenný.','profesional','cfd','swing',25,5),
('hedging','Hedging a zajištění portfolia','Put opce, inverzní ETF, měnové zajištění a cena pojistky.','Hedging neznamená zisk, ale snížení kolísání. Za každou pojistku se platí — buď prémií, nebo ušlým výnosem.

Nejběžnější nástroje jsou nákup put opcí na index, prodej futures proti dlouhému portfoliu, inverzní ETF na krátké období a měnové zajištění u zahraničních aktiv.

Zajišťovat má smysl při konkrétním riziku a na omezenou dobu: před výsledky, referendem nebo při nutnosti čerpat peníze v blízkém termínu. Trvalý hedge je většinou jen drahý způsob, jak mít menší portfolio.','profesional','opce','dlouhodobe',18,6),
('obchodni-plan','Obchodní plán a deník','Písemný systém, metriky výkonu a pravidelná revize.','Obchodní plán je dokument, který odpovídá na otázky: co obchoduji, kdy vstupuji, kde mám stop, kde beru zisk, kolik riskuji a kdy končím pro daný den.

Deník zaznamenává u každého obchodu screenshot, důvod vstupu, emoce a dodržení pravidel. Klíčová metrika není zisk, ale procento obchodů podle plánu.

Revizi dělejte měsíčně nad daty, ne nad pocity: expectancy, maximální drawdown, nejlepší denní doba, nejhorší instrument. Systém se upravuje mezi obchody, nikdy uprostřed nich.','profesional','akcie','day',16,7);

INSERT INTO public.quiz_questions (lesson_slug, question, options, correct_index, explanation, sort_order) VALUES
('co-je-burza','Co je spread?', '["Poplatek brokera za vedení účtu","Rozdíl mezi nejlepší nákupní a prodejní cenou","Daň z kapitálového výnosu","Rozdíl mezi otevírací a zavírací cenou"]', 1, 'Spread je rozdíl mezi bid a ask a je skrytým nákladem každého obchodu.',1),
('co-je-burza','Který pokyn zaručuje maximální cenu, za kterou nakoupíte?', '["Tržní (market)","Limitní","Stop-loss","Trailing stop"]', 1, 'Limitní pokyn garantuje cenu, ale ne provedení.',2),
('co-je-burza','Od koho akcii na burze kupujete?', '["Od burzy","Od emitenta","Od jiného účastníka trhu","Od centrální banky"]', 2, 'Burza pouze páruje pokyny mezi účastníky.',3),
('co-jsou-akcie','Kdo je při krachu firmy vyplacen jako poslední?', '["Zaměstnanci","Věřitelé","Stát","Akcionáři"]', 3, 'Akcionář nese zbytkové riziko a je v pořadí poslední.',1),
('co-jsou-akcie','Co je dividenda?', '["Poplatek za držení akcie","Podíl na zisku vyplácený akcionářům","Úrok z dluhopisu","Sleva při nákupu akcií"]', 1, 'Dividenda je část zisku rozdělená akcionářům.',2),
('slozene-uroceni','Proč je u dlouhodobého investování tak důležitá výše poplatků?', '["Poplatky se odečítají jen jednou","Snižují základ, ze kterého se dále složeně úročí","Zvyšují daň z příjmu","Neovlivňují nic podstatného"]', 1, 'Každé procento poplatku ročně ukrajuje z efektu složeného úročení.',1),
('riziko-a-vynos','O kolik musí portfolio vyrůst, aby se vrátilo po ztrátě 50 %?', '["50 %","75 %","100 %","150 %"]', 2, 'Z poloviny na původní hodnotu je potřeba stoprocentní růst.',1),
('co-je-etf','Co znamená akumulační ETF?', '["Neplatí žádné poplatky","Dividendy automaticky reinvestuje","Nakupuje jen americké akcie","Používá páku"]', 1, 'Akumulační třída dividendu reinvestuje zpět do fondu.',1),
('co-je-etf','Co vyjadřuje TER?', '["Roční nákladovost fondu","Výnos fondu za rok","Počet držených akcií","Velikost fondu"]', 0, 'TER je celková roční nákladovost fondu v procentech.',2),
('fundamentalni-analyza','Co je varovný signál v účetnictví firmy?', '["Rostoucí tržby i cash flow","Rostoucí zisk při klesajícím provozním cash flow","Nízký dluh","Stabilní marže"]', 1, 'Zisk bez odpovídajícího cash flow bývá účetní kosmetika.',1),
('risk-management','Jakou úspěšnost potřebujete při poměru rizika k zisku 1:2, abyste byli na nule?', '["Přibližně 33 %","Přibližně 50 %","Přibližně 66 %","Přibližně 75 %"]', 0, 'Při RRR 1:2 stačí zhruba třetina úspěšných obchodů na vyrovnání.',1),
('risk-management','Jak se počítá velikost pozice?', '["Podle zůstatku na účtu","Riziko v korunách děleno vzdáleností stop-lossu","Podle ceny instrumentu","Vždy 10 % kapitálu"]', 1, 'Nejdřív riziko a stop, teprve potom velikost pozice.',2),
('cfd-a-paka','Co je swap u CFD?', '["Poplatek za otevření pozice","Financování pozice držené přes noc","Daň z derivátů","Poplatek za výběr peněz"]', 1, 'Swap je náklad financování páky přes noc.',1),
('opce-zaklady','Co měří theta?', '["Citlivost na volatilitu","Ztrátu hodnoty opce plynutím času","Změnu ceny opce vůči podkladu","Úrokové riziko"]', 1, 'Theta je časový rozpad hodnoty opce.',1),
('backtesting','Co je look-ahead bias?', '["Testování na příliš krátkém období","Použití informace, která v daný okamžik nebyla dostupná","Ignorování poplatků","Testování jen na rostoucím trhu"]', 1, 'Model se dívá do budoucnosti a výsledky jsou nepoužitelné.',1),
('order-flow','Co znamená absorpce v order flow?', '["Zvýšení spreadu","Velký pasivní příkaz pohlcuje agresivní objednávky","Výpadek likvidity","Zrušení všech příkazů"]', 1, 'Cena se nehýbe navzdory agresivním obchodům, protože ji drží pasivní příkaz.',1),
('psychologie-obchodovani','Co je revenge trading?', '["Obchodování proti trendu","Snaha okamžitě vydělat zpět ztrátu","Kopírování obchodů jiných","Obchodování jen o víkendu"]', 1, 'Emoční reakce na ztrátu, která obvykle vede k dalším ztrátám.',1);

INSERT INTO public.glossary (term, definition, category) VALUES
('Akcie','Cenný papír představující podíl na vlastnictví společnosti.','instrumenty'),
('ETF','Burzovně obchodovaný fond, obvykle kopírující index.','instrumenty'),
('IPO','První veřejná nabídka akcií při vstupu firmy na burzu.','instrumenty'),
('CFD','Derivát na rozdíl ceny obchodovaný s pákou.','instrumenty'),
('Futures','Standardizovaný termínový kontrakt na budoucí dodání aktiva.','instrumenty'),
('Opce','Právo koupit nebo prodat aktivum za předem danou cenu do expirace.','instrumenty'),
('Call opce','Opce dávající právo nakoupit podklad za strike cenu.','opce'),
('Put opce','Opce dávající právo prodat podklad za strike cenu.','opce'),
('Strike','Realizační cena, za kterou lze opci uplatnit.','opce'),
('Prémie','Cena zaplacená za nákup opce.','opce'),
('Delta','Citlivost ceny opce na pohyb podkladu.','opce'),
('Gamma','Rychlost změny delty.','opce'),
('Theta','Denní úbytek hodnoty opce vlivem času.','opce'),
('Vega','Citlivost opce na změnu implikované volatility.','opce'),
('Implikovaná volatilita','Očekávané budoucí kolísání ceny odvozené z ceny opcí.','opce'),
('Dluhopis','Cenný papír představující půjčku emitentovi s nárokem na úrok.','instrumenty'),
('Podílový fond','Aktivně řízený fond, kde portfolio spravuje manažer.','instrumenty'),
('REIT','Fond investující do nemovitostí, obchodovaný na burze.','instrumenty'),
('Forex','Trh měnových párů.','instrumenty'),
('Komodita','Surovina obchodovaná na burze, například ropa nebo zlato.','instrumenty'),
('Bid','Nejvyšší cena, kterou je kupující ochoten zaplatit.','trhy'),
('Ask','Nejnižší cena, za kterou je prodávající ochoten prodat.','trhy'),
('Spread','Rozdíl mezi bid a ask cenou.','trhy'),
('Likvidita','Schopnost obchodovat velký objem bez výrazného posunu ceny.','trhy'),
('Volatilita','Míra kolísání ceny v čase.','trhy'),
('Objem','Množství zobchodovaných kusů za dané období.','trhy'),
('Kniha objednávek','Seznam všech čekajících nákupních a prodejních příkazů.','trhy'),
('Slippage','Rozdíl mezi očekávanou a skutečnou realizační cenou.','trhy'),
('Gap','Cenová mezera mezi zavřením a otevřením trhu.','trhy'),
('Market maker','Účastník, který průběžně kotuje nákup i prodej a dodává likviditu.','trhy'),
('Tržní pokyn','Pokyn k okamžité realizaci za nejlepší dostupnou cenu.','pokyny'),
('Limitní pokyn','Pokyn s maximální nákupní nebo minimální prodejní cenou.','pokyny'),
('Stop-loss','Pokyn omezující ztrátu automatickým uzavřením pozice.','pokyny'),
('Take profit','Pokyn uzavírající pozici při dosažení cílového zisku.','pokyny'),
('Trailing stop','Stop-loss, který se posouvá za cenou ve váš prospěch.','pokyny'),
('Stop-limit','Kombinace stop pokynu a limitní ceny.','pokyny'),
('GTC pokyn','Pokyn platný, dokud není zrušen.','pokyny'),
('Long pozice','Spekulace na růst ceny.','pozice'),
('Short pozice','Spekulace na pokles ceny.','pozice'),
('Páka','Násobek, kterým obchodujete větší objem, než je váš kapitál.','pozice'),
('Marže','Záloha blokovaná na účtu pro otevření pákové pozice.','pozice'),
('Margin call','Výzva k doplnění marže při ztrátové pozici.','pozice'),
('Likvidace pozice','Nucené uzavření pozice brokerem při nedostatku marže.','pozice'),
('Swap','Poplatek za držení pákové pozice přes noc.','pozice'),
('Position sizing','Určení velikosti pozice podle rizika.','risk'),
('Pravidlo 1 %','Zásada neriskovat na jeden obchod více než procento kapitálu.','risk'),
('Drawdown','Pokles kapitálu od posledního maxima.','risk'),
('RRR','Poměr podstoupeného rizika k očekávanému zisku.','risk'),
('Expectancy','Průměrný očekávaný zisk na jeden obchod.','risk'),
('Diverzifikace','Rozložení kapitálu mezi nekorelovaná aktiva.','risk'),
('Korelace','Míra, jak se dvě aktiva pohybují společně.','risk'),
('Hedging','Zajištění portfolia proti nepříznivému pohybu.','risk'),
('Rebalancování','Návrat portfolia k cílovým vahám aktiv.','risk'),
('Alokace aktiv','Rozdělení portfolia mezi třídy aktiv.','risk'),
('Value at Risk','Statistický odhad maximální ztráty na dané hladině pravděpodobnosti.','risk'),
('Trend','Převažující směr pohybu ceny.','analyza'),
('Support','Cenové pásmo, kde se objevuje poptávka.','analyza'),
('Rezistence','Cenové pásmo, kde se objevuje nabídka.','analyza'),
('Konsolidace','Období pohybu ceny v úzkém pásmu.','analyza'),
('Breakout','Průraz významné cenové úrovně.','analyza'),
('Falešný průraz','Průraz, po kterém se cena rychle vrátí zpět.','analyza'),
('Klouzavý průměr','Průměr ceny za zvolený počet období.','analyza'),
('EMA','Exponenciální klouzavý průměr s vyšší váhou nových dat.','analyza'),
('RSI','Oscilátor měřící sílu pohybu a překoupenost trhu.','analyza'),
('MACD','Indikátor sbíhání a rozbíhání klouzavých průměrů.','analyza'),
('Bollingerova pásma','Pásma volatility kolem klouzavého průměru.','analyza'),
('Fibonacci retracement','Úrovně možné korekce odvozené z Fibonacciho poměrů.','analyza'),
('Divergence','Nesoulad mezi pohybem ceny a indikátoru.','analyza'),
('Svíčkový graf','Graf zobrazující otevření, maximum, minimum a zavření.','analyza'),
('Pin bar','Svíčka s dlouhým knotem signalizující odmítnutí ceny.','analyza'),
('Engulfing','Svíčka pohlcující tělo předchozí svíčky.','analyza'),
('Doji','Svíčka s minimálním tělem značící nerozhodnost.','analyza'),
('VWAP','Průměrná cena vážená objemem během dne.','analyza'),
('Order flow','Analýza skutečných příkazů a obchodů v knize.','pokrocile'),
('DOM','Hloubka trhu zobrazující čekající příkazy na jednotlivých cenách.','pokrocile'),
('Footprint graf','Graf ukazující objemy na nákupní a prodejní straně v každé svíčce.','pokrocile'),
('Kumulativní delta','Součet rozdílu agresivních nákupů a prodejů.','pokrocile'),
('Absorpce','Pohlcení agresivních příkazů velkým pasivním příkazem.','pokrocile'),
('Iceberg příkaz','Velký příkaz zobrazující jen malou část svého objemu.','pokrocile'),
('Spoofing','Nelegální zadávání příkazů bez úmyslu je realizovat.','pokrocile'),
('BOS','Break of structure, potvrzení pokračování trendu.','pokrocile'),
('CHoCH','Change of character, první signál možného obratu trendu.','pokrocile'),
('Likviditní zóna','Oblast s nahromaděnými stop-lossy a čekajícími příkazy.','pokrocile'),
('Scalping','Styl s desítkami krátkých obchodů denně.','styly'),
('Day trading','Obchodování s uzavřením všech pozic do konce dne.','styly'),
('Swing trading','Držení pozic dny až týdny.','styly'),
('Position trading','Držení pozic měsíce až roky.','styly'),
('DCA','Pravidelné investování stejné částky bez ohledu na cenu.','styly'),
('Buy and hold','Nákup a dlouhodobé držení bez aktivního obchodování.','styly'),
('P/E','Poměr ceny akcie k zisku na akcii.','fundament'),
('P/B','Poměr ceny akcie k účetní hodnotě.','fundament'),
('ROE','Návratnost vlastního kapitálu.','fundament'),
('EBITDA','Zisk před úroky, zdaněním a odpisy.','fundament'),
('Free cash flow','Volné peněžní toky po investicích.','fundament'),
('DCF','Ocenění diskontováním budoucích peněžních toků.','fundament'),
('Dividendový výnos','Roční dividenda vydělená cenou akcie.','fundament'),
('Market cap','Tržní kapitalizace, cena akcie krát počet akcií.','fundament'),
('Blue chip','Akcie velké stabilní společnosti.','fundament'),
('Býčí trh','Období dlouhodobého růstu cen.','trhy'),
('Medvědí trh','Období poklesu cen o více než 20 %.','trhy'),
('Korekce','Pokles trhu zhruba o 10 %.','trhy'),
('Inflace','Růst cenové hladiny snižující kupní sílu peněz.','makro'),
('Úroková sazba','Cena peněz stanovená centrální bankou.','makro'),
('HDP','Hrubý domácí produkt, celková hodnota vyprodukovaných statků.','makro'),
('NFP','Americká data o zaměstnanosti mimo zemědělství.','makro'),
('Kvantitativní uvolňování','Nákup aktiv centrální bankou pro dodání likvidity.','makro'),
('Časový test','Podmínka držení pro osvobození zisku od daně.','dane'),
('Backtest','Test strategie na historických datech.','pokrocile'),
('Overfitting','Přizpůsobení strategie historii na úkor budoucí funkčnosti.','pokrocile'),
('Obchodní deník','Záznam obchodů, důvodů a emocí pro pozdější vyhodnocení.','psychologie'),
('FOMO','Strach z promeškání příležitosti vedoucí k unáhleným vstupům.','psychologie'),
('Revenge trading','Snaha okamžitě vydělat zpět předchozí ztrátu.','psychologie');
