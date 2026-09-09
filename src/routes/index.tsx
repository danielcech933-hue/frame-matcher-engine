import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ShieldCheck, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { LEVELS, lessonsQuery, categoriesQuery } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trading Academy CZ — od základů k profesionálnímu obchodování" },
      {
        name: "description",
        content:
          "Česká vzdělávací platforma o investování a tradingu: 28 lekcí ve čtyřech úrovních, kvízy, sledování pokroku a slovníček pojmů.",
      },
      { property: "og:title", content: "Trading Academy CZ" },
      {
        property: "og:description",
        content: "Naučte se investovat a obchodovat krok za krokem — česky, prakticky a zdarma.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: BookOpen, title: "Strukturované lekce", text: "28 lekcí od burzovních základů po order flow a backtesting." },
  { icon: Trophy, title: "Kvízy a pokrok", text: "Po každé lekci si ověříte znalosti a vidíte svůj postup." },
  { icon: ShieldCheck, title: "Důraz na risk", text: "Money management a psychologie jsou součástí každé úrovně." },
  { icon: Sparkles, title: "Slovníček pojmů", text: "Přes 100 termínů s vysvětlením a rychlým vyhledáváním." },
];

function Home() {
  const lessons = useQuery(lessonsQuery);
  const categories = useQuery(categoriesQuery);

  return (
    <SiteLayout>
      <section className="grid-backdrop border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Česky · Prakticky · Zdarma
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight font-bold md:text-6xl">
            Od prvního obchodu k <span className="gold-text">profesionální</span> disciplíně
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Trading Academy CZ vás provede investováním a obchodováním krok za krokem — akcie, ETF,
            forex, komodity i krypto. S kvízy, poznámkami a sledováním pokroku.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/kurzy">
                Začít se učit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/slovnik">Prohlédnout slovníček</Link>
            </Button>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Lekcí", lessons.data?.length ?? 28],
              ["Úrovní", 4],
              ["Instrumentů a stylů", categories.data?.length ?? 12],
              ["Pojmů ve slovníku", "115+"],
            ].map(([label, value]) => (
              <div key={String(label)} className="surface p-4">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-display text-2xl font-semibold text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Proč Trading Academy</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="surface card-hover p-5">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Učební cesty</h2>
        <p className="mt-2 text-muted-foreground">Postupujte úroveň po úrovni, ve svém tempu.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {LEVELS.map((level, i) => {
            const count = lessons.data?.filter((l) => l.level === level.value).length ?? 0;
            return (
              <Link
                key={level.value}
                to="/kurzy"
                className="surface card-hover flex items-start gap-4 p-6"
              >
                <span className="font-display text-3xl font-bold text-primary/40">0{i + 1}</span>
                <span>
                  <span className="block text-lg font-semibold">{level.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {count > 0 ? `${count} lekcí` : "Lekce připraveny"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
