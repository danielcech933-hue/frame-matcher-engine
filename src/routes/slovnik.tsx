import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Lightbulb, Search } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { glossaryQuery } from "@/lib/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/slovnik")({
  head: () => ({
    meta: [
      { title: "Slovníček obchodních pojmů — Trading Academy CZ" },
      {
        name: "description",
        content:
          "Přes sto pojmů z investování a tradingu srozumitelně vysvětlených česky, s rychlým vyhledáváním a praktickými přirovnáními.",
      },
      { property: "og:title", content: "Slovníček pojmů — Trading Academy CZ" },
      {
        property: "og:description",
        content: "Rychlé vysvětlení burzovních a tradingových pojmů i jednoduchá přirovnání.",
      },
    ],
  }),
  component: Slovnik,
});

const FALLBACK_ANALOGIES: Record<string, string> = {
  spread: "Je to malá mezera mezi cenou, za kterou můžeš hned prodat, a cenou, za kterou můžeš hned koupit.",
  leverage: "Je to jako použít dlouhou páku: s menším vlastním obnosem ovládáš větší hodnotu. Stejně tak ale můžeš rychleji přijít o své peníze.",
  pákový_efekt: "Je to jako mechanická páka. Malou vlastní silou můžeš působit na větší věc, ale stejný princip zvětšuje i následky chyby.",
  drawdown: "Představ si účet jako kopec. Drawdown je vzdálenost od předchozího vrcholu k nejnižšímu místu, kam účet po něm spadl.",
  volatilita: "Je to jako rozbouřené moře. Klidná hladina znamená malé pohyby ceny, velké vlny znamenají vysokou volatilitu.",
  likvidita: "Je to jako rušný obchod. Když je v něm hodně kupujících a prodávajících, snadno něco koupíš nebo prodáš bez velkého pohybu ceny.",
  market_order: "Je to jako říct prodavači: Vezmu to hned za aktuální cenu. Důležitější je rychlost než přesná cena.",
  limit_order: "Je to jako říct: Koupím to nejvýše za 100 Kč. Když za tuto cenu nikdo neprodá, obchod se neuskuteční.",
  stop_loss: "Je to jako nouzová brzda. Když se cena vydá příliš proti tobě, předem nastavené pravidlo obchod ukončí.",
  take_profit: "Je to jako automatické vyzvednutí výhry. Předem řekneš, při jaké ceně chceš obchod ukončit se ziskem.",
  divergence: "Je to jako když auto zrychluje, ale otáčkoměr začne ukazovat jiný příběh. Cena a indikátor se rozcházejí.",
  support: "Je to jako podlaha. Když cena klesá k této oblasti, často se objeví více kupujících a pokles se může zastavit.",
  resistance: "Je to jako strop. Cena k němu může opakovaně dojít, ale v této oblasti se často objeví více prodejců.",
  trend: "Je to jako silnice, která dlouhodobě stoupá. Může mít zatáčky a krátké sjezdy, ale hlavní směr je pořád nahoru.",
  rsi: "Představ si ukazatel, který říká, jak silně se cena v poslední době pohybovala jedním směrem. Neříká s jistotou, co bude dál.",
  macd: "Je to jako porovnávat rychlost auta s jeho delším průměrným tempem. Pomáhá zachytit, jestli pohyb zrychluje nebo zpomaluje.",
  etf: "Je to jako koupit celý košík věcí místo jedné položky. Jedním nákupem získáš podíl ve více aktivech najednou.",
  diverzifikace: "Je to jako nerozdávat všechny peníze do jedné kapsy. Když jedna investice dopadne špatně, nemusí s ní padnout celé portfolio.",
  short: "Je to jako půjčit si věc, prodat ji a doufat, že ji později koupíš levněji a vrátíš. Vyděláváš na poklesu ceny.",
  long: "Je to sázka na růst ceny. Koupíš aktivum s očekáváním, že ho později prodáš dráž.",
  risk_reward: "Je to jako zvážit, jestli se ti vyplatí riskovat 100 Kč kvůli možné výhře 200 Kč. Porovnáváš riziko s potenciálním ziskem.",
  stop_limit: "Je to jako nouzová brzda se dvěma podmínkami: nejdřív se musí aktivovat a potom se obchod musí vejít do tvého cenového limitu.",
  compound_interest: "Je to jako sněhová koule, která při jízdě z kopce nabírá další sníh. Výnosy začnou vytvářet další výnosy.",
  backtesting: "Je to jako projet si závodní trať nanečisto na starých záznamech. Zjišťuješ, jak by strategie fungovala v minulosti.",
  order_flow: "Je to jako sledovat, kdo právě tlačí na dveře. Nevidíš jen cenu, ale i sílu skutečných nákupů a prodejů.",
};

function normalizeTerm(term: string) {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/\\s+/g, "_")
    .replace(/[()\-–—/]/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function analogyFor(term: string, category?: string | null, analogy?: string | null) {
  if (analogy?.trim()) return analogy.trim();

  const key = normalizeTerm(term);
  if (FALLBACK_ANALOGIES[key]) return FALLBACK_ANALOGIES[key];

  if (category === "technicka_analyza") {
    return `Představ si pojem ${term} jako jednu pomůcku na palubní desce auta. Sám ti neřekne, kam dojedeš, ale pomůže ti lépe pochopit, co se právě děje.`;
  }
  if (category === "risk_management") {
    return `Ber ${term} jako bezpečnostní pás. Nezabrání nehodě, ale může výrazně omezit její následky.`;
  }
  if (category === "fundament") {
    return `Představ si ${term} jako kontrolu motoru firmy. Neřešíš jen cenu akcie, ale snažíš se zjistit, jak zdravě firma skutečně funguje.`;
  }
  if (category === "trhy") {
    return `Představ si ${term} jako jednu část rušného tržiště. Pomáhá ti pochopit, co právě dělají kupující a prodávající.`;
  }
  if (category === "psychologie") {
    return `Je to podobné jako při sportu: když rozhoduješ pod tlakem a emocemi, můžeš udělat chybu, kterou bys v klidu neudělal.`;
  }
  if (category === "opce") {
    return `Představ si ${term} jako jednu podmínku v rezervaci. Pomáhá určit, co se s opcí stane, když se změní cena, čas nebo očekávané riziko.`;
  }
  if (category === "pozice") {
    return `Představ si ${term} jako jedno pravidlo pro velikost a držení obchodu. Pomáhá ti vědět, kolik prostoru obchodu vůbec dáváš.`;
  }

  return `Představ si ${term} jako jednu součástku v tradingovém stroji. Sama není celý systém, ale pomáhá ti pochopit, jak trh funguje.`;
}

function Slovnik() {
  const { data, isLoading } = useQuery(glossaryQuery);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = (data ?? []).filter((t) =>
    `${t.term} ${t.definition} ${t.analogy ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Slovníček pojmů</h1>
          <p className="mt-2 text-muted-foreground">
            Klikni na pojem a zobrazí se ti stručné vysvětlení, jednoduché přirovnání a praktický kontext.
          </p>
        </div>

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
            <div className="mt-4 divide-y divide-border/70 rounded-xl border border-border/60 bg-card/30">
              {filtered.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">Žádný pojem neodpovídá hledání.</div>
              ) : (
                filtered.map((t) => {
                  const isOpen = openId === t.id;
                  return (
                    <div key={t.id} className="first:rounded-t-xl last:rounded-b-xl">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : t.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-primary">{t.term}</span>
                          {!isOpen && (
                            <span className="mt-1 block truncate text-sm text-muted-foreground">
                              Klikni pro rychlé vysvětlení a přirovnání
                            </span>
                          )}
                        </span>
                        <ChevronDown
                          className={cn(
                            "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180 text-primary",
                          )}
                        />
                      </button>

                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-200",
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
                            <div className="rounded-lg border border-border/70 bg-background/60 p-4">
                              <div className="text-xs font-medium uppercase tracking-wide text-primary">
                                Co to znamená
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {t.definition}
                              </p>
                            </div>
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
                                <Lightbulb className="size-4" /> Přirovnání
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {analogyFor(t.term, t.category, t.analogy ?? null)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
