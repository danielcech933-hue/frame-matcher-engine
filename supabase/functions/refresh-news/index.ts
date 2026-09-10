import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Feed = { cat: string; weight: number; q: string };
type Candidate = {
  cat: string;
  score: number;
  date: Date;
  key: string;
  source: string;
  title: string;
  summary: string;
  url: string;
};

const SOURCE_DOMAINS = [
  "ft.com",
  "bloomberg.com",
  "patria.cz",
  "fxstreet.com",
  "cnc.cz",
  "reuters.com",
  "investing.com",
  "wsj.com",
  "cnbc.com",
  "marketwatch.com",
  "finance.yahoo.com",
  "nasdaq.com",
  "apnews.com",
  "coindesk.com",
  "sec.gov",
];

const SOURCE_WEIGHT: Record<string, number> = {
  "ft.com": 70,
  "bloomberg.com": 70,
  "patria.cz": 68,
  "fxstreet.com": 66,
  "cnc.cz": 62,
  "reuters.com": 65,
  "investing.com": 62,
  "wsj.com": 61,
  "cnbc.com": 58,
  "marketwatch.com": 54,
  "finance.yahoo.com": 50,
  "nasdaq.com": 49,
  "apnews.com": 47,
  "coindesk.com": 50,
  "sec.gov": 68,
};

const SOURCE_NAME: Record<string, string> = {
  "ft.com": "Financial Times",
  "bloomberg.com": "Bloomberg",
  "patria.cz": "Patria",
  "fxstreet.com": "FXStreet",
  "cnc.cz": "CNC",
  "reuters.com": "Reuters",
  "investing.com": "Investing.com",
  "wsj.com": "The Wall Street Journal",
  "cnbc.com": "CNBC",
  "marketwatch.com": "MarketWatch",
  "finance.yahoo.com": "Yahoo Finance",
  "nasdaq.com": "Nasdaq",
  "apnews.com": "Associated Press",
  "coindesk.com": "CoinDesk",
  "sec.gov": "SEC",
};

const FEEDS: Feed[] = [
  { cat: "ipo", weight: 14, q: '(IPO OR "initial public offering" OR "IPO filing" OR "go public" OR "stock listing" OR "public debut" OR prospectus) (stocks OR shares OR markets)' },
  { cat: "makro", weight: 12, q: '(Fed OR "Federal Reserve" OR ECB OR "Bank of England" OR BOE OR BOJ OR inflation OR CPI OR PCE OR payrolls OR "jobs report" OR "interest rates" OR "rate cut" OR "rate hike") (markets OR economy OR bonds)' },
  { cat: "ropa", weight: 9, q: '(Brent OR WTI OR "crude oil" OR OPEC OR LNG OR "natural gas") (price OR prices OR supply OR production OR market)' },
  { cat: "geopolitika", weight: 9, q: '(Hormuz OR Iran OR Israel OR "Middle East" OR sanctions OR war OR attack OR shipping) (oil OR markets OR stocks OR energy)' },
  { cat: "akcie", weight: 9, q: '(Nvidia OR Apple OR Microsoft OR Amazon OR Meta OR Tesla OR Alphabet OR AMD OR earnings OR guidance OR revenue OR profit OR merger OR acquisition) (stocks OR shares)' },
  { cat: "komodity", weight: 8, q: '(gold OR silver OR copper OR platinum OR palladium OR commodities) (price OR prices OR market)' },
  { cat: "forex", weight: 9, q: '(dollar OR euro OR yen OR sterling OR USD OR EUR OR JPY OR GBP OR forex OR FX OR "exchange rate" OR currency) (markets OR central bank OR rates)' },
  { cat: "krypto", weight: 7, q: '(bitcoin OR ethereum OR crypto OR cryptocurrency OR stablecoin OR "spot ETF") (market OR markets OR regulation OR flows)' },
];

const WHY: Record<string, string> = {
  ipo: "IPO mění očekávání valuace a kapitálových toků. Cena emise, poptávka investorů a první obchodování mohou ovlivnit i konkurenční firmy v sektoru.",
  makro: "Makrodata nebo centrální banka mění očekávání sazeb → výnosy dluhopisů → diskontní sazby → valuace akcií, kurz měn a cenu zlata.",
  ropa: "Ropa mění náklady dopravy a výroby → inflaci → očekávání sazeb. Vyšší cena obvykle pomáhá producentům, ale tlačí na spotřebitele a část firem.",
  geopolitika: "Geopolitický šok může zvýšit rizikovou prémii a narušit dodávky → energie a doprava → inflace → sazby → akcie a měny.",
  akcie: "Výsledky, výhled nebo velká firemní zpráva mění očekávané zisky → EPS a valuaci → konkrétní akcii, sektor i indexy.",
  komodity: "Komodity reagují na dolar, sazby, globální růst a nabídku s poptávkou → jejich pohyb může změnit inflaci, marže firem a sentiment trhu.",
  forex: "Forex reaguje na rozdíl sazeb a očekávání centrálních bank → výnosy dluhopisů → kurz měny → dovozní inflace a kapitálové toky.",
  krypto: "Krypto je citlivé na likviditu, ETF toky, regulaci a chuť riskovat → zpráva může rychle změnit příliv kapitálu a volatilitu.",
};

const BAD = /\b(technical analysis|chart analysis|price prediction|price target|opinion|podcast|stock picks|best stocks to buy|top stocks to buy|live blog|weekly outlook|daily forecast|what to buy|horoscope|sponsored|press release)\b/i;
const ENTITIES: Record<string, string> = { "&amp;": "&", "&apos;": "'", "&#39;": "'", "&quot;": '"', "&#34;": '"', "&lt;": "<", "&gt;": ">", "&nbsp;": " " };

function clean(v: string) {
  let s = String(v || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  for (let i = 0; i < 2; i++) s = s.replace(/&(?:amp|apos|#39|quot|#34|lt|gt|nbsp);/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
  return s.replace(/[\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim();
}

function title(v: string) {
  return clean(v).replace(/\s+([,:;.!?])/g, "$1").replace(/([,:;.!?])(?=[A-Za-zÀ-ž])/g, "$1 ").trim();
}

function host(url: string) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

function normalize(t: string) {
  return title(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|a|an|and|or|to|for|of|in|on|as|at|after|before|with|from|says|said|markets|market|stocks|stock|shares|share|live|update|news)\b/g, " ").replace(/\s+/g, " ").trim().slice(0, 190);
}

function latin(t: string) {
  let a = 0, n = 0;
  for (const ch of t) { if (/[A-Za-zÀ-ž]/.test(ch)) a++; if (/\S/.test(ch)) n++; }
  return n === 0 || a / n > 0.72;
}

function dateOf(v?: string) {
  const s = String(v || "");
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  const d = m ? new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`) : new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function api(q: string) {
  const sourceFilter = `(domain:${SOURCE_DOMAINS.join(" OR domain:")})`;
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`(${q}) ${sourceFilter} -sourcelang:chinese -sourcelang:russian -sourcelang:arabic`)}&mode=artlist&maxrecords=120&timespan=24h&sort=datedesc&format=json`;
}

async function get(q: string) {
  try {
    const r = await fetch(api(q), { headers: { "User-Agent": "TradingAcademyCZ/25.0" } });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.articles) ? j.articles : [];
  } catch { return []; }
}

function classify(t: string) {
  const x = title(t).toLowerCase();
  if (/\b(ipo|initial public offering|ipo filing|go public|stock listing|public debut|shares offered|prospectus)\b/.test(x)) return "ipo";
  if (/\b(fed|federal reserve|ecb|bank of england|boe|bank of japan|boj|inflation|cpi|pce|payrolls|jobs report|interest rates?|rate hike|rate cut|treasury yields?|bond yields?)\b/.test(x)) return "makro";
  if (/\b(hormuz|iran|israel|middle east|sanctions|war|missile|attack|shipping blockade|ceasefire)\b/.test(x)) return "geopolitika";
  if (/\b(brent|wti|crude oil|oil prices?|opec|lng|natural gas|gasoline|diesel)\b/.test(x)) return "ropa";
  if (/\b(gold|silver|copper|platinum|palladium|commodit(?:y|ies))\b/.test(x)) return "komodity";
  if (/\b(bitcoin|ethereum|crypto|cryptocurrency|stablecoin|spot etf)\b/.test(x)) return "krypto";
  if (/\b(usd|eur|jpy|gbp|dollar|euro|yen|sterling|forex|fx|exchange rate|currency intervention)\b/.test(x)) return "forex";
  if (/\b(nvidia|apple|microsoft|amazon|meta|tesla|alphabet|amd|arm|earnings|guidance|revenue|profit|merger|acquisition|shares? (surge|fall|rise|drop))\b/.test(x)) return "akcie";
  return "jine";
}

function score(t: string, cat: string, weight: number, source: string, d: Date) {
  const x = t.toLowerCase();
  const age = Math.max(0, (Date.now() - d.getTime()) / 3600000);
  let n = weight * 10 + Math.max(0, 36 - age * 2.4) + (SOURCE_WEIGHT[source] ?? 0);
  const rules: [RegExp, number][] = [
    [/\b(ipo|initial public offering|public debut|stock listing|prospectus)\b/, 45],
    [/\b(fed|ecb|rate hike|rate cut|cpi|inflation|payrolls|jobs report)\b/, 40],
    [/\b(hormuz|iran|war|missile|sanctions|conflict)\b/, 36],
    [/\b(brent|wti|crude oil|opec|oil)\b/, 30],
    [/\b(gold|silver|copper)\b/, 28],
    [/\b(usd|eur|jpy|gbp|forex|fx|exchange rate)\b/, 27],
    [/\b(bitcoin|ethereum|crypto|stablecoin|spot etf)\b/, 25],
    [/\b(earnings|guidance|revenue|profit|merger|acquisition)\b/, 24],
  ];
  for (const [r, v] of rules) if (r.test(x)) n += v;
  if (BAD.test(x)) n -= 80;
  return n;
}

function imp(cat: string, sc: number, t: string) {
  const x = t.toLowerCase();
  if (sc >= 118) return "critical";
  if (/\b(fed|ecb|rate hike|rate cut|cpi|inflation|payrolls|jobs report|hormuz|iran|war|opec|brent|wti|oil.*100|100.*oil)\b/.test(x)) return "critical";
  return cat !== "jine" && sc >= 68 ? "important" : "normal";
}

function impactWhy(cat: string, t: string) {
  const x = t.toLowerCase();
  if (/\b(rate hike|rate cut|fed|ecb)\b/.test(x)) return "Změna očekávání sazeb → výnosy dluhopisů → diskontní sazby → valuace akcií. Současně se může změnit kurz USD a cena zlata.";
  if (/\b(cpi|inflation|pce)\b/.test(x)) return "Inflace mění očekávání sazeb a reálných výnosů → dluhopisy → akcie, USD a zlato.";
  if (/\b(payrolls|jobs report|employment)\b/.test(x)) return "Data o zaměstnanosti mění výhled růstu a sazeb → výnosy dluhopisů → akcie a měny.";
  if (/\b(hormuz|iran|sanctions|shipping|war|missile)\b/.test(x)) return "Geopolitika může zvýšit rizikovou prémii a náklady energie a dopravy → ropa → inflace → sazby → akcie a FX.";
  if (cat === "ropa") return "Ropa se promítá do nákladů a inflace → očekávání sazeb → marže firem. Producentům a dovozcům může změnit ziskovost.";
  if (cat === "ipo") return "Nová emise mění nabídku kapitálu a valuace → ovlivňuje sentiment sektoru a srovnatelné veřejně obchodované firmy.";
  if (/\b(earnings|guidance|revenue|profit|merger|acquisition)\b/.test(x)) return "Firemní výsledky nebo výhled mění očekávání zisků → EPS a valuace → akcie, sektor i indexy.";
  if (cat === "krypto") return "Regulace, ETF toky nebo likvidita mění očekávaný příliv kapitálu a chuť riskovat → volatilita kryptotrhu.";
  if (cat === "forex") return "Rozdíl sazeb a očekávání centrálních bank → výnosy dluhopisů → kurz měny → dovozní inflace a kapitálové toky.";
  return WHY[cat] || "Událost může změnit očekávání investorů a přelít se do cen aktiv, volatility a rizikové prémie.";
}

async function translate(text: string) {
  const c = title(text);
  if (!c) return "";
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=cs&hl=cs&dt=t&dj=1&q=${encodeURIComponent(c.slice(0, 1400))}`, { headers: { "User-Agent": "TradingAcademyCZ/25.0", "Accept": "application/json" } });
    if (!r.ok) return c;
    const j = await r.json();
    const out = title((j?.sentences ?? []).map((x: any) => x.trans || "").join(""));
    return out || c;
  } catch { return c; }
}

async function translateBatched(rows: any[]) {
  const out: any[] = [];
  for (let i = 0; i < rows.length; i += 4) {
    out.push(...await Promise.all(rows.slice(i, i + 4).map(async (r) => ({
      ...r,
      title: await translate(r.title),
      summary: await translate(r.summary),
    }))));
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  const url = Deno.env.get("SUPABASE_URL");
  let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!key) {
    try {
      const m = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      key = m.default || Object.values(m)[0] || "";
    } catch {}
  }
  if (!url || !key) return new Response(JSON.stringify({ error: "Supabase server credentials missing" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });

  const db = createClient(url, key);
  const now = new Date().toISOString();

  try {
    const sets = await Promise.all(FEEDS.map((f) => get(f.q)));
    const byUrl = new Map<string, Candidate>();

    sets.forEach((arr, i) => arr.forEach((a: any) => {
      const rawTitle = title(String(a?.title || ""));
      const sourceUrl = String(a?.url || "").trim();
      const domain = host(sourceUrl || String(a?.domain || ""));
      if (!rawTitle || !sourceUrl || !SOURCE_DOMAINS.includes(domain) || BAD.test(rawTitle) || !latin(rawTitle)) return;
      const feed = FEEDS[i];
      const cat = classify(rawTitle);
      const d = dateOf(a?.seendate);
      const snippet = clean(String(a?.snippet || a?.description || ""));
      const summary = snippet && snippet.length > 35 ? snippet.slice(0, 650) : rawTitle;
      const c: Candidate = {
        cat,
        score: score(rawTitle, cat, feed.weight, domain, d),
        date: d,
        key: normalize(rawTitle),
        source: domain,
        title: rawTitle,
        summary,
        url: sourceUrl,
      };
      const old = byUrl.get(sourceUrl);
      if (!old || c.score > old.score) byUrl.set(sourceUrl, c);
    }));

    const byEvent = new Map<string, Candidate>();
    for (const c of byUrl.values()) {
      const old = byEvent.get(c.key);
      if (!old || c.score > old.score) byEvent.set(c.key, c);
    }

    const all = [...byEvent.values()].sort((a, b) => b.score - a.score || b.date.getTime() - a.date.getTime());
    const quota: Record<string, number> = { makro: 4, akcie: 4, ropa: 3, komodity: 3, geopolitika: 3, forex: 4, krypto: 2, ipo: 4 };
    const chosen: Candidate[] = [];
    const counts: Record<string, number> = {};

    for (const cat of Object.keys(quota)) {
      const hit = all.find((c) => c.cat === cat);
      if (hit) { chosen.push(hit); counts[cat] = 1; }
    }
    for (const c of all) {
      if (chosen.includes(c)) continue;
      const max = quota[c.cat] ?? 2;
      if ((counts[c.cat] || 0) >= max) continue;
      chosen.push(c);
      counts[c.cat] = (counts[c.cat] || 0) + 1;
      if (chosen.length >= 28) break;
    }

    if (!chosen.length) throw new Error("Nebyly nalezeny relevantní zprávy z požadovaných finančních zdrojů.");

    const rawRows = chosen.slice(0, 28).map((c, i) => ({
      title: c.title,
      summary: c.summary,
      slug: `news-${Date.now()}-${i}`,
      why_it_matters: impactWhy(c.cat, c.title),
      category: c.cat,
      importance: imp(c.cat, c.score, c.title),
      published_at: c.date.toISOString(),
      source_name: SOURCE_NAME[c.source] || c.source,
      source_url: c.url,
      tags: [c.cat, c.source, "trhy"],
      updated_at: now,
    }));

    const rows = await translateBatched(rawRows);

    await db.from("news_articles").delete().eq("importance", "normal");
    for (const r of rows) {
      const { data: existing } = await db.from("news_articles").select("id").eq("source_url", r.source_url).maybeSingle();
      if (existing?.id) {
        await db.from("news_articles").update({
          title: r.title,
          summary: r.summary,
          why_it_matters: r.why_it_matters,
          category: r.category,
          importance: r.importance,
          published_at: r.published_at,
          source_name: r.source_name,
          tags: r.tags,
          updated_at: now,
        }).eq("id", existing.id);
      } else {
        await db.from("news_articles").insert(r);
      }
    }

    await db.from("news_articles").delete().in("importance", ["important", "critical"]).lt("published_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    await db.from("news_refresh_state").upsert({ id: true, last_refreshed_at: now, last_success_at: now, last_error: null, updated_at: now });

    return new Response(JSON.stringify({ ok: true, count: rows.length, provider: "GDELT source-curated + Czech translation", sources: SOURCE_DOMAINS, categories: counts, refreshed_at: now }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.from("news_refresh_state").upsert({ id: true, last_refreshed_at: now, last_error: msg, updated_at: now });
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
