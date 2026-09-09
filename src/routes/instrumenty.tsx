import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { categoriesQuery, lessonsQuery } from "@/lib/content";

export const Route = createFileRoute("/instrumenty")({
  head: () => ({
    meta: [
      { title: "Investiční instrumenty — akcie, ETF, forex, krypto" },
      {
        name: "description",
        content:
          "Přehled instrumentů, se kterými se na trzích potkáte: akcie, ETF, dluhopisy, forex, komodity i kryptoměny, včetně míry rizika.",
      },
      { property: "og:title", content: "Investiční instrumenty — Trading Academy CZ" },
      { property: "og:description", content: "Co jsou akcie, ETF, forex, komodity a krypto." },
    ],
  }),
  component: () => <CategoryPage kind="instrument" title="Instrumenty" />,
});

export function CategoryPage({ kind, title }: { kind: string; title: string }) {
  const categories = useQuery(categoriesQuery);
  const lessons = useQuery(lessonsQuery);
  const items = (categories.data ?? []).filter((c) => c.kind === kind);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          Každá oblast má vlastní logiku, náklady i míru rizika.
        </p>

        {categories.isLoading ? (
          <p className="mt-10 text-muted-foreground">Načítám…</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => {
              const related = (lessons.data ?? []).filter(
                (l) => l.category_slug === c.slug || l.style_slug === c.slug,
              );
              return (
                <article key={c.id} className="surface flex flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold">{c.name}</h2>
                    <Badge variant="outline">Riziko: {c.risk}</Badge>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
                  {related.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-border/70 pt-3">
                      {related.slice(0, 4).map((l) => (
                        <li key={l.slug}>
                          <Link
                            to="/lekce/$slug"
                            params={{ slug: l.slug }}
                            className="text-sm text-primary hover:underline"
                          >
                            {l.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
