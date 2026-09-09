import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS, lessonsQuery, levelLabel } from "@/lib/content";

export const Route = createFileRoute("/kurzy")({
  head: () => ({
    meta: [
      { title: "Učební cesty a lekce — Trading Academy CZ" },
      {
        name: "description",
        content:
          "Všechny lekce o investování a tradingu rozdělené do čtyř úrovní. Filtrujte podle obtížnosti a hledejte v obsahu.",
      },
      { property: "og:title", content: "Učební cesty — Trading Academy CZ" },
      { property: "og:description", content: "Lekce od základů po profesionální obchodování." },
    ],
  }),
  component: Kurzy,
});

function Kurzy() {
  const { data, isLoading } = useQuery(lessonsQuery);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("vse");

  const filtered = (data ?? []).filter((l) => {
    const okLevel = level === "vse" || l.level === level;
    const text = `${l.title} ${l.summary}`.toLowerCase();
    return okLevel && text.includes(q.trim().toLowerCase());
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Učební cesty</h1>
        <p className="mt-2 text-muted-foreground">
          Vyberte si úroveň a projděte lekce postupně od základů.
        </p>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hledat lekci…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={level === "vse" ? "default" : "secondary"}
              onClick={() => setLevel("vse")}
            >
              Vše
            </Button>
            {LEVELS.map((l) => (
              <Button
                key={l.value}
                size="sm"
                variant={level === l.value ? "default" : "secondary"}
                onClick={() => setLevel(l.value)}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Načítám lekce…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-muted-foreground">Žádná lekce neodpovídá hledání.</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => (
              <Link
                key={l.slug}
                to="/lekce/$slug"
                params={{ slug: l.slug }}
                className="surface card-hover flex flex-col p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{levelLabel(l.level)}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {l.duration_min} min
                  </span>
                </div>
                <h2 className="mt-3 text-base font-semibold">{l.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{l.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
