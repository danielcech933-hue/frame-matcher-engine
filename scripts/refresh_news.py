import html
import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

SUPABASE_URL = "https://ntzjirsejfvgvuhmbqvt.supabase.co"
SUPABASE_KEY = "sb_publishable_h6OPGkq8kd5c1wvqLlQ02g_VdQ9Vjw1"
SOURCES = {
    "ft.com": "Financial Times",
    "bloomberg.com": "Bloomberg",
    "patria.cz": "Patria",
    "fxstreet.com": "FXStreet",
    "cnc.cz": "CNC",
    "reuters.com": "Reuters",
    "investing.com": "Investing.com",
    "cnbc.com": "CNBC",
    "finance.yahoo.com": "Yahoo Finance",
    "coindesk.com": "CoinDesk",
}
PRIMARY = {"ft.com", "bloomberg.com", "patria.cz", "fxstreet.com", "cnc.cz"}
QUERIES = [
    ("makro", "Fed ECB inflation CPI PCE jobs rates economy markets"),
    ("akcie", "stocks shares earnings revenue profit guidance companies"),
    ("ropa", "oil Brent WTI OPEC crude energy prices"),
    ("komodity", "gold silver copper commodities prices"),
    ("forex", "forex dollar euro yen currency exchange rates"),
    ("geopolitika", "Iran Israel Hormuz sanctions war markets energy"),
    ("krypto", "bitcoin ethereum crypto stablecoin ETF markets"),
    ("ipo", "IPO initial public offering listing shares prospectus"),
]
BAD = re.compile(r"\b(technical analysis|chart analysis|price prediction|price target|opinion|podcast|stock picks|best stocks to buy|top stocks to buy|live blog|weekly outlook|daily forecast|what to buy|horoscope|sponsored)\b", re.I)


def clean(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def classify(title: str) -> str:
    x = title.lower()
    if re.search(r"\b(ipo|initial public offering|prospectus|public debut|stock listing|go public)\b", x): return "ipo"
    if re.search(r"\b(fed|federal reserve|ecb|bank of england|boe|boj|inflation|cpi|pce|payroll|jobs report|interest rates?|rate cut|rate hike|bond yields?|treasury yields?)\b", x): return "makro"
    if re.search(r"\b(hormuz|iran|israel|middle east|sanctions|war|missile|attack|shipping blockade|ceasefire)\b", x): return "geopolitika"
    if re.search(r"\b(brent|wti|crude oil|oil prices?|opec|lng|natural gas|gasoline|diesel)\b", x): return "ropa"
    if re.search(r"\b(gold|silver|copper|platinum|palladium|commodit(?:y|ies))\b", x): return "komodity"
    if re.search(r"\b(bitcoin|ethereum|crypto|cryptocurrency|stablecoin|spot etf)\b", x): return "krypto"
    if re.search(r"\b(usd|eur|jpy|gbp|dollar|euro|yen|sterling|forex|fx|exchange rate|currency)\b", x): return "forex"
    return "akcie"


def why(cat: str, title: str) -> str:
    x = title.lower()
    if re.search(r"\b(fed|ecb|rate hike|rate cut)\b", x): return "Očekávání sazeb → výnosy dluhopisů → diskontní sazby → valuace akcií; zároveň USD a zlato."
    if re.search(r"\b(cpi|inflation|pce)\b", x): return "Inflace → očekávání sazeb a reálných výnosů → dluhopisy → akcie, USD a zlato."
    if re.search(r"\b(payroll|jobs report|employment)\b", x): return "Trh práce → výhled růstu a sazeb → výnosy dluhopisů → akcie a měny."
    if re.search(r"\b(hormuz|iran|sanctions|war|missile|shipping)\b", x): return "Geopolitické riziko → energie a doprava → ropa a inflace → sazby → akcie a FX."
    return {
        "ropa": "Ropa → náklady firem a dopravy → inflace → očekávání sazeb.",
        "komodity": "Dolar, sazby a nabídka/poptávka → ceny komodit → inflace a marže firem.",
        "forex": "Rozdíl sazeb a očekávání centrálních bank → výnosy → kurz měny → kapitálové toky.",
        "krypto": "Likvidita, ETF toky a regulace → příliv kapitálu a rizikový apetit → volatilita krypta.",
        "ipo": "Nová emise → kapitál a valuace → sentiment v sektoru → srovnatelné akcie.",
        "akcie": "Výsledky nebo firemní výhled → očekávané zisky → EPS a valuace → akcie a sektor.",
        "geopolitika": "Riziková prémie a možné narušení dodávek → energie → inflace → akcie a měny.",
        "makro": "Makrodata → očekávání sazeb a růstu → dluhopisy → akcie a měny.",
    }[cat]


def translate(text: str) -> str:
    text = clean(text)
    if not text: return ""
    try:
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=cs&dt=t&dj=1&q=" + urllib.parse.quote(text[:1500])
        req = urllib.request.Request(url, headers={"User-Agent": "TradingAcademyCZ-NewsWorker/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        return clean("".join(x.get("trans", "") for x in data.get("sentences", []))) or text
    except Exception:
        return text


def fetch_google_news(domain: str, query: str):
    q = urllib.parse.quote(f"site:{domain} {query}")
    url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
    req = urllib.request.Request(url, headers={"User-Agent": "TradingAcademyCZ-NewsWorker/1.0"})
    with urllib.request.urlopen(req, timeout=8) as response:
        root = ET.fromstring(response.read())
    rows = []
    for item in root.findall("./channel/item"):
        title = clean(item.findtext("title", ""))
        link = clean(item.findtext("link", ""))
        pub = clean(item.findtext("pubDate", ""))
        source_el = item.find("source")
        source_url = source_el.attrib.get("url", "") if source_el is not None else ""
        source = urllib.parse.urlparse(source_url).netloc.lower().removeprefix("www.") if source_url else domain
        if source not in SOURCES:
            source = domain
        if title and link and source in SOURCES and not BAD.search(title):
            rows.append({"title": title, "url": link, "published_at": pub, "source": source})
    return rows


def publish(rows):
    if not rows:
        return 0
    payload = json.dumps(rows, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/rpc/ingest_news",
        data=payload,
        method="POST",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=12) as response:
        data = json.loads(response.read().decode("utf-8"))
    return int(data.get("count", 0)) if isinstance(data, dict) else 0


def main():
    candidates = {}
    jobs = [(d, "markets finance economy stocks currencies commodities") for d in SOURCES]
    # Add a few targeted passes for events that generic finance queries can miss.
    for cat, q in QUERIES:
        jobs.append(("reuters.com", q))
    for domain, query in jobs:
        try:
            for item in fetch_google_news(domain, query):
                key = re.sub(r"\W+", " ", item["title"].lower()).strip()[:180]
                if key not in candidates or item["published_at"] > candidates[key]["published_at"]:
                    candidates[key] = item
        except Exception as exc:
            print(f"feed failed {domain}: {exc}")
        time.sleep(0.15)

    ordered = []
    quotas = {"makro":5,"akcie":5,"ropa":3,"komodity":3,"forex":3,"geopolitika":4,"krypto":3,"ipo":2}
    counts = {k: 0 for k in quotas}
    for item in sorted(candidates.values(), key=lambda x: x["published_at"], reverse=True):
        cat = classify(item["title"])
        if counts[cat] >= quotas.get(cat, 3):
            continue
        counts[cat] += 1
        ordered.append((item, cat))
        if len(ordered) >= 28:
            break

    rows = []
    for i, (item, cat) in enumerate(ordered):
        title_cs = translate(item["title"])
        impact = why(cat, title_cs)
        importance = "critical" if re.search(r"\b(fed|ecb|cpi|inflation|jobs report|hormuz|iran|war|opec|brent|wti)\b", item["title"], re.I) else "important"
        rows.append({
            "title": title_cs,
            "summary": f"{impact} {title_cs}"[:900],
            "why_it_matters": impact,
            "category": cat,
            "importance": importance,
            "published_at": item["published_at"],
            "source_name": SOURCES[item["source"]],
            "source_url": item["url"],
            "tags": [cat, "live", "trhy", item["source"]],
        })
    print("Publishing", len(rows), "news items", counts)
    print("ingested", publish(rows))


if __name__ == "__main__":
    main()
