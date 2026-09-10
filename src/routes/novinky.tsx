import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { AlertTriangle, Archive, ArrowUpRight, Clock3, Newspaper, RefreshCw, Search, Zap } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/novinky")({
  head: () => ({
    meta: [
      { title: "Novinky & trh — Trading Academy CZ" },
      {
        name: "description",
        content: "Automaticky aktualizovaný přehled nejdůležitějších událostí z trhů a dlouhodobý archiv klíčových tržních momentů.",
      },
    ],
  }),
  component: NewsPage,
});

const NEWS_SUPABASE_URL = "https://ntzjirsejfvgvuhmbqvt.supabase.co";
const NEWS_SUPABASE_KEY = "sb_publishable_h6OPGkq8kd5c1wvqLlQ02g_VdQ9Vjw1";
const newsSupabase = createClient(NEWS_SUPABASE_URL, NEWS_SUPABASE_KEY);

const FILTERS = [
  ["vse", "Vše"],
  ["makro", "Makro"],
  ["akcie", "Akcie"],
  ["ropa", "Ropa"],
  ["komodity", "Komodity"],
  ["geopolitika", "Geopolitika"],
  ["forex", "Forex"],
  ["krypto", "Krypto"],
  ["ipo", "IPO"],
] as const;

const importanceLabel: Record<string, string> = {
  normal: "Běžné",
  important: "Důležité",
  critical: "Klíčové",
};

const categoryLabel: Record<string, string> = {
  makro: "Makro",
  akcie: "Akcie",
  ropa: "Ropa",
  komodity: "Komodity",
  geopolitika: "Geopolitika",
  forex: "Forex",
  krypto: "Krypto",
  ipo: "IPO",
  jine: "Jiné",
};

function timeAgo(date: string) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function cleanSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[%,]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  why_it_matters: string;
  category: string;
  importance: string;
  published_at: string;
  source_name: string;
  source_url: string;
  tags: string[];
  image_url: string | null;
};

function NewsCard({ item, archive = false }: { item: NewsItem; archive?: boolean }) {
  return (
    <article
      className={`surface card-hover overflow-hidden ${
        item.importance === "critical" ? "ring-1 ring-primary/50" : ""
      }`}
    >
      {item.image_url && (
        <img src={item.image_url} alt="" className="h-44 w-full object-cover" loading="lazy" />
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.importance === "critical" ? "default" : "secondary"}>
            {importanceLabel[item.importance] ?? "Zpráva"}
          </Badge>
          <Badge variant="outline">{categoryLabel[item.category] ?? item.category}</Badge>
          {archive && <Badge variant="outline">Archiv</Badge>}
          <span className="ml-auto text-xs text-muted-foreground" title={formatDate(item.published_at)}>
            {timeAgo(item.published_at)}
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold leading-snug">{item.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Proč to hýbe trhem</p>
          <p className="mt-1 text-sm leading-relaxed">{item.why_it_matters}</p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(item.tags ?? []).slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {item.source_name || "Zdroj"} <ArrowUpRight className="size-3.5" />
          </a>
        </div>
        {archive && (
          <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            Událost: {formatDate(item.published_at)}
          </p>
        )}
      </div>
    </article>
  );
}

function NewsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("vse");
  const [view, setView] = useState<"current" | "archive">("current");
  const [refreshing, setRefreshing] = useState(false);

  const fetchColumns =
    "id,title,summary,why_it_matters,category,importance,published_at,source_name,source_url,tags,image_url";

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(cleanSearchTerm(searchInput)), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const news = useQuery({
    queryKey: ["news-keyword-search", "current", search, category],
    staleTime: 30_000,
    refetchInterval: 600_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      let query = newsSupabase
        .from("news_articles")
        .select(fetchColumns)
        .order("published_at", { ascending: false });

      if (category !== "vse") query = query.eq("category", category);

      if (search) {
        const pattern = `%${search}%`;
        query = query.or(
          `title.ilike.${pattern},summary.ilike.${pattern},why_it_matters.ilike.${pattern},source_name.ilike.${pattern}`,
        );
        query = query.limit(100);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NewsItem[];
    },
  });

  const archive = useQuery({
    queryKey: ["news-keyword-search", "archive", search, category],
    staleTime: 60_000,
    refetchInterval: 600_000,
    refetchIntervalInBackground: true,
    enabled: view === "archive",
    queryFn: async () => {
      let query = newsSupabase
        .from("news_articles")
        .select(fetchColumns)
        .in("importance", ["important", "critical"])
        .order("published_at", { ascending: false });

      if (category !== "vse") query = query.eq("category", category);

      if (search) {
        const pattern = `%${search}%`;
        query = query.or(
          `title.ilike.${pattern},summary.ilike.${pattern},why_it_matters.ilike.${pattern},source_name.ilike.${pattern}`,
        );
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data as NewsItem[];
    },
  });

  const state = useQuery({
    queryKey: ["news-refresh-state-live"],
    staleTime: 30_000,
    refetchInterval: 600_000,
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

  const items = view === "current" ? news.data ?? [] : archive.data ?? [];
  const loading = view === "current" ? news.isLoading : archive.isLoading;
  const error = view === "current" ? news.isError : archive.isError;

  async function refreshNow() {
    setRefreshing(true);
    try {
      // The scheduled worker is the source of truth. The button only refreshes the
      // database view so an unavailable upstream provider can never crash the UI.
      await Promise.all([news.refetch(), archive.refetch(), state.refetch()]);
      toast.success("Feed obnoven. Automatická synchronizace běží každých 10 minut.");
    } catch {
      toast.info("Feed se nepodařilo právě teď obnovit. Poslední dostupné zprávy zůstávají zachované.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="size-3.5" /> Tržní radar
            </Badge>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Novinky & trh</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Čerstvé zprávy pro tradera a oddělený archiv událostí, které měly nebo mohou mít výrazný dopad na trhy.
            </p>
          </div>
          <Button variant="secondary" onClick={refreshNow} disabled={refreshing}>
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            {refreshing ? "Obnovuji…" : "Obnovit feed"}
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="sm" variant={view === "current" ? "default" : "secondary"} onClick={() => setView("current")} className="justify-center sm:flex-1">
            <Newspaper className="size-4" /> Aktuální zprávy
          </Button>
          <Button size="sm" variant={view === "archive" ? "default" : "secondary"} onClick={() => setView("archive")} className="justify-center sm:flex-1">
            <Archive className="size-4" /> Archiv klíčových událostí
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Hledat např. Anthropic, Fed, Nvidia, IPO…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => (
              <Button key={value} size="sm" variant={category === value ? "default" : "secondary"} onClick={() => setCategory(value)}>
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-3 min-h-5 text-xs text-muted-foreground">
          {searchInput.trim() !== search && <span>Hledám…</span>}
          {search && searchInput.trim() === search && (
            <span>Výsledky pro: <strong className="text-foreground">{search}</strong></span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="size-3.5" />
            {state.data?.last_success_at ? `Feed aktualizován před ${timeAgo(state.data.last_success_at)}` : "První aktualizace probíhá…"}
          </span>
          <span className="inline-flex items-center gap-2 text-primary">
            <RefreshCw className="size-3.5" /> Automatická aktualizace každých 10 minut
          </span>
          {view === "archive" && (
            <span className="inline-flex items-center gap-2 text-primary">
              <Archive className="size-3.5" /> Archivuje se pouze vysoký tržní dopad
            </span>
          )}
          {state.data?.last_error && <span className="text-destructive">Poslední chyba: {state.data.last_error}</span>}
        </div>

        {view === "archive" && (
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
            <p className="font-semibold text-primary">Co patří do archivu?</p>
            <p className="mt-1 text-muted-foreground">
              Jen důležité a klíčové události, které stojí za návratem i za několik měsíců — sazby, inflace, zásadní geopolitika, energetické šoky, velké výsledky, systémová rizika a významná IPO.
            </p>
          </div>
        )}

        {loading ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="surface h-56 animate-pulse rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="surface mt-10 p-8 text-center">
            <AlertTriangle className="mx-auto size-7 text-primary" />
            <h2 className="mt-4 font-display text-xl font-semibold">Nepodařilo se načíst {view === "archive" ? "archiv" : "live feed"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Zkontroluj připojení databáze a zkus obnovit feed.</p>
            <Button className="mt-5" onClick={() => (view === "archive" ? archive.refetch() : news.refetch())}>Zkusit znovu</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="surface mt-10 p-8 text-center">
            {view === "archive" ? <Archive className="mx-auto size-7 text-primary" /> : <Newspaper className="mx-auto size-7 text-primary" />}
            <h2 className="mt-4 font-display text-xl font-semibold">
              {search ? `Žádné výsledky pro „${search}"` : view === "archive" ? "Archiv zatím nemá záznam pro tento filtr" : "Žádné zprávy pro tento filtr"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {search ? "Zkus jiný název společnosti, ticker nebo klíčové slovo." : view === "archive" ? "Jakmile se objeví další událost s vysokým dopadem, zůstane v archivu." : "Zkus Vše nebo spusť aktualizaci feedu."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {items.map((item) => <NewsCard key={item.id} item={item} archive={view === "archive"} />)}
          </div>
        )}

        <div className="mt-10 flex gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Novinky jsou automaticky vyhledávané a zpracovávané pro vzdělávací účely. Nejde o investiční doporučení. Archiv slouží jako studijní kronika významných tržních událostí.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}