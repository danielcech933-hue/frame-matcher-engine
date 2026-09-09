import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { AlertTriangle, ArrowUpRight, Clock3, Newspaper, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/novinky")({
  head: () => ({
    meta: [
      { title: "Novinky & trh — Trading Academy CZ" },
      { name: "description", content: "Automaticky aktualizovaný přehled nejdůležitějších událostí z trhů, makra, ropy, geopolitiky, krypta a IPO." },
    ],
  }),
  component: NewsPage,
});

const NEWS_SUPABASE_URL = "https://ntzjirsejfvgvuhmbqvt.supabase.co";
// Publishable key belonging to the same Supabase project as NEWS_SUPABASE_URL.
const NEWS_SUPABASE_KEY = "sb_publishable_h6OPGkq8kd5c1wvqLlQ02g_VdQ9Vjw1";
const newsSupabase = createClient(NEWS_SUPABASE_URL, NEWS_SUPABASE_KEY);

const FILTERS = [
  ["vse", "Vše"], ["makro", "Makro"], ["akcie", "Akcie"], ["ropa", "Ropa"], ["komodity", "Komodity"],
  ["geopolitika", "Geopolitika"], ["forex", "Forex"], ["krypto", "Krypto"], ["ipo", "IPO"],
] as const;

const importanceLabel: Record<string, string> = { normal: "Běžné", important: "Důležité", critical: "Klíčové" };

function timeAgo(date: string) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

function NewsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("vse");
  const [refreshing, setRefreshing] = useState(false);

  const news = useQuery({
    queryKey: ["news-articles-live"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await newsSupabase
        .from("news_articles")
        .select("id,title,summary,why_it_matters,category,importance,published_at,source_name,source_url,tags,image_url")
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Array<{
        id: string; title: string; summary: string; why_it_matters: string; category: string; importance: string;
        published_at: string; source_name: string; source_url: string; tags: string[]; image_url: string | null;
      }>;
    },
  });

  const state = useQuery({
    queryKey: ["news-refresh-state-live"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await newsSupabase
        .from("news_refresh_state")
        .select("last_success_at,last_error")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return data as { last_success_at: string | null; last_error: string | null } | null;
    },
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (news.data ?? []).filter((item) => {
      const categoryOk = category === "vse" || item.category === category;
      const text = `${item.title} ${item.summary} ${item.why_it_matters} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      return categoryOk && (!query || text.includes(query));
    });
  }, [news.data, q, category]);

  async function refreshNow() {
    setRefreshing(true);
    try {
      const response = await fetch(`${NEWS_SUPABASE_URL}/functions/v1/refresh-news`, {
        method: "POST",
        headers: { apikey: NEWS_SUPABASE_KEY, Authorization: `Bearer ${NEWS_SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) throw new Error(data?.error || `Aktualizace selhala (${response.status})`);
      await Promise.all([news.refetch(), state.refetch()]);
      toast.success(data?.skipped ? "Novinky jsou už aktuální." : `Aktualizováno: ${data?.count ?? 0} zpráv.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aktualizace se nepodařila.");
      await Promise.all([news.refetch(), state.refetch()]);
    } finally { setRefreshing(false); }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary">Live market brief</Badge>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Novinky & trh</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Důležité tržní události z posledních hodin, česky shrnuté s vysvětlením dopadu na trh.</p>
          </div>
          <Button variant="secondary" onClick={refreshNow} disabled={refreshing}>
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            {refreshing ? "Aktualizuji…" : "Aktualizovat"}
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hledat novinky…" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => <Button key={value} size="sm" variant={category === value ? "default" : "secondary"} onClick={() => setCategory(value)}>{label}</Button>)}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Clock3 className="size-3.5" />{state.data?.last_success_at ? `Aktualizováno před ${timeAgo(state.data.last_success_at)}` : "První AI aktualizace probíhá…"}</span>
          {state.data?.last_error && <span className="text-destructive">Poslední chyba: {state.data.last_error}</span>}
        </div>

        {news.isLoading ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">{[1,2,3,4].map((i) => <div key={i} className="surface h-56 animate-pulse rounded-xl" />)}</div>
        ) : news.isError ? (
          <div className="surface mt-10 p-8 text-center">
            <AlertTriangle className="mx-auto size-7 text-primary" />
            <h2 className="mt-4 font-display text-xl font-semibold">Nepodařilo se načíst live feed</h2>
            <p className="mt-2 text-sm text-muted-foreground">Zkontroluj připojení databáze a zkus aktualizaci znovu.</p>
            <Button className="mt-5" onClick={() => news.refetch()}>Zkusit znovu</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface mt-10 p-8 text-center">
            <Newspaper className="mx-auto size-7 text-primary" />
            <h2 className="mt-4 font-display text-xl font-semibold">Žádné zprávy pro tento filtr</h2>
            <p className="mt-2 text-sm text-muted-foreground">Zkus Vše nebo spusť ruční aktualizaci.</p>
            <Button className="mt-5" onClick={refreshNow} disabled={refreshing}>Načíst aktuální zprávy</Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {filtered.map((item) => (
              <article key={item.id} className={`surface card-hover overflow-hidden ${item.importance === "critical" ? "ring-1 ring-primary/50" : ""}`}>
                {item.image_url && <img src={item.image_url} alt="" className="h-44 w-full object-cover" loading="lazy" />}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.importance === "critical" ? "default" : "secondary"}>{importanceLabel[item.importance] ?? "Zpráva"}</Badge>
                    <Badge variant="outline">{item.category}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">{timeAgo(item.published_at)}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold leading-snug">{item.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Proč je to důležité</p>
                    <p className="mt-1 text-sm leading-relaxed">{item.why_it_matters}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-1.5">{(item.tags ?? []).slice(0, 5).map((tag) => <span key={tag} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">#{tag}</span>)}</div>
                    <a href={item.source_url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">{item.source_name || "Zdroj"} <ArrowUpRight className="size-3.5" /></a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 flex gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>Novinky jsou automaticky vyhledávané a shrnuté pro vzdělávací účely. Nejde o investiční doporučení. Před obchodním rozhodnutím vždy otevři původní zdroj.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
