import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { glossaryQuery } from "@/lib/content";

export const Route = createFileRoute("/slovnik")({
  head: () => ({
    meta: [
      { title: "Slovníček obchodních pojmů — Trading Academy CZ" },
      {
        name: "description",
        content:
          "Přes sto pojmů z investování a tradingu srozumitelně vysvětlených česky, s rychlým vyhledáváním.",
      },
      { property: "og:title", content: "Slovníček pojmů — Trading Academy CZ" },
      { property: "og:description", content: "Rychlé vysvětlení burzovních a tradingových pojmů." },
    ],
  }),
  component: Slovnik,
});

function Slovnik() {
  const { data, isLoading } = useQuery(glossaryQuery);
  const [q, setQ] = useState("");

  const filtered = (data ?? []).filter((t) =>
    `${t.term} ${t.definition}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Slovníček pojmů</h1>
        <p className="mt-2 text-muted-foreground">Nevíte, co znamená spread nebo drawdown? Hledejte tady.</p>

        <div className="relative mt-8">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat pojem…"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Načítám…</p>
        ) : (
          <>
            <p className="mt-4 text-xs text-muted-foreground">{filtered.length} pojmů</p>
            <dl className="mt-4 divide-y divide-border/70">
              {filtered.map((t) => (
                <div key={t.id} className="py-4">
                  <dt className="font-semibold text-primary">{t.term}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{t.definition}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
