import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Jsi editor ekonomického a finančního zpravodajství pro českou vzdělávací platformu Trading Academy CZ. Vytváříš pouze stručný přehled skutečně důležitých událostí z webového vyhledávání.

PRAVIDLA:
- Používej pouze informace, které jsi ověřil ve výsledcích webového vyhledávání. Když něco nelze ověřit, nezařazuj to.
- Hledej především posledních 24 hodin, u velkých událostí maximálně posledních 72 hodin.
- Upřednostni kvalitní primární a důvěryhodné zdroje (centrální banky, vlády, burzy, firmy, Reuters, Bloomberg, AP, FT, WSJ, CNBC a další renomovaná média).
- Zaměř se na události, které mohou mít významný dopad na trhy: akcie a indexy, centrální banky a makrodata, ropa a energie, geopolitika včetně Hormuzského průlivu, zlato a komodity, forex, kryptoměny, významné firemní výsledky a IPO.
- Nevkládej běžné články bez významu pro investora/tradera.
- Každá položka musí mít konkrétní zdrojovou URL. Nevymýšlej URL.
- U každé zprávy vysvětli jednou krátkou větou, proč je důležitá pro trh. Nejde o investiční doporučení.
- Pokud je zpráv málo, vrať méně položek. Nikdy nedoplňuj seznam vymyšlenými zprávami.
- Odpověď vrať jako čistý JSON bez markdownu.`;

const SCHEMA_HINT = `Pošli pole objektů v tomto přesném tvaru:
[{"title":"...","summary":"...","why_it_matters":"...","category":"makro|akcie|komodity|ropa|geopolitika|forex|krypto|ipo|jine","importance":"normal|important|critical","published_at":"ISO-8601 datum nebo null","source_name":"...","source_url":"...","tags":["..."]}]`;

function slugify(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

function parseJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI nevrátil platný JSON.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!supabaseUrl || !serviceRoleKey) return new Response(JSON.stringify({ error: "Supabase environment is not configured." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  if (!perplexityKey) return new Response(JSON.stringify({ error: "Chybí PERPLEXITY_API_KEY v Supabase Secrets." }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: state } = await supabase.from("news_refresh_state").select("last_refreshed_at,last_success_at").eq("id", true).maybeSingle();
  if (state?.last_refreshed_at && Date.now() - new Date(state.last_refreshed_at).getTime() < 30 * 60 * 1000) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "refresh_too_recent" }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  await supabase.from("news_refresh_state").update({ last_refreshed_at: new Date().toISOString(), last_error: null }).eq("id", true);

  try {
    const userPrompt = `${SCHEMA_HINT}\n\nNajdi dnešní nejdůležitější finanční a ekonomické zprávy pro českého tradera. Věnuj zvláštní pozornost ropě a případné eskalaci kolem Hormuzského průlivu, cenám energií, centrálním bankám, inflaci a sazbám, hlavním akciovým indexům, významným firemním výsledkům, kryptu, forexu a novým IPO. Vrať maximálně 12 nejdůležitějších událostí. U každé použij skutečnou URL ke zdroji. ${SCHEMA_HINT}`;

    const response = await fetch("https://api.perplexity.ai/v1/sonar", {
      method: "POST",
      headers: { "Authorization": `Bearer ${perplexityKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        search_mode: "web",
        search_recency_filter: "day",
        language_preference: "cs",
      }),
    });

    if (!response.ok) throw new Error(`Perplexity API ${response.status}: ${(await response.text()).slice(0, 500)}`);
    const payload = await response.json();
    const answer = payload?.choices?.[0]?.message?.content;
    if (typeof answer !== "string") throw new Error("Perplexity nevrátil textovou odpověď.");
    const items = parseJson(answer);
    if (!Array.isArray(items)) throw new Error("Neplatný formát novinek.");

    const citations = Array.isArray(payload?.citations) ? payload.citations : [];
    const now = new Date().toISOString();
    const rows = items.slice(0, 12).map((item: Record<string, unknown>, index: number) => {
      const title = String(item.title ?? "").trim();
      const summary = String(item.summary ?? "").trim();
      const why = String(item.why_it_matters ?? "").trim();
      let sourceUrl = String(item.source_url ?? "").trim();
      if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) sourceUrl = "";
      if (!sourceUrl && citations[index]) sourceUrl = String(citations[index]);
      let publishedAt = now;
      if (item.published_at) {
        const parsed = new Date(String(item.published_at));
        if (!Number.isNaN(parsed.getTime())) publishedAt = parsed.toISOString();
      }
      return {
        title,
        slug: `${slugify(title) || `novinka-${Date.now()}-${index}`}-${Date.now()}-${index}`,
        summary,
        why_it_matters: why,
        category: String(item.category ?? "jine"),
        importance: ["normal", "important", "critical"].includes(String(item.importance)) ? String(item.importance) : "normal",
        published_at: publishedAt,
        source_name: String(item.source_name ?? "Web"),
        source_url: sourceUrl,
        tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 8) : [],
        updated_at: now,
      };
    }).filter((r) => r.title && r.summary && r.source_url);

    if (!rows.length) throw new Error("Nebyla nalezena žádná ověřená novinka se zdrojem.");

    for (const row of rows) {
      const { data: existing } = await supabase.from("news_articles").select("id").eq("source_url", row.source_url).maybeSingle();
      if (existing?.id) {
        const { slug: _slug, ...update } = row;
        await supabase.from("news_articles").update(update).eq("id", existing.id);
      } else {
        await supabase.from("news_articles").insert(row);
      }
    }

    await supabase.from("news_articles").delete().lt("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    await supabase.from("news_refresh_state").update({ last_success_at: now, last_error: null }).eq("id", true);
    return new Response(JSON.stringify({ ok: true, count: rows.length }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase.from("news_refresh_state").update({ last_error: message }).eq("id", true);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
