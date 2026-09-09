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

const ANALOGIES: Record<string, string> = {
  spread:
    "Je to jako rozdíl mezi cenou, za kterou je někdo ochotný něco koupit, a cenou, za kterou to jiný ochotný prodat. Ten malý rozdíl platíte už při vstupu do obchodu.",
  leverage:
    "Je to jako obchodování s větší částkou, než kolik máte vlastních peněz na stole. Zvětší ziskový potenciál, ale úplně stejně zvětší i ztrátu.",
  pákový_efekt:
    "Je to jako delší páka v mechanice: malou vlastní silou dokážete pohnout větší věcí. Bohužel se tím zvětší i následky špatného pohybu.",
  drawdown:
    "Představte si vrchol kopce a pak cestu dolů, než znovu vystoupáte nahoru. Drawdown měří právě tu největší cestu dolů od předchozího vrcholu.",
  volatilita:
    "Je to jako rozbouřené moře. Klidná hladina znamená malé pohyby ceny, velké vlny znamenají vysokou volatilitu.",
  likvidita:
    "Je to jako rušný obchod plný nakupujících a prodávajících. Když je lidí hodně, snadno něco koupíte nebo prodáte; když je obchod prázdný, cena může při nákupu poskočit.",
  market_order:
    "Je to jako říct prodavači: ‚Vezmu to hned za aktuální cenu.‘ Neřešíte přesnou cenu, hlavní je rychlost provedení.",
  limit_order:
    "Je to jako říct: ‚Koupím to nejvýše za 100 Kč.‘ Když cenu 100 Kč nikdo nenabídne, obchod se neuskuteční.",
  stop_loss:
    "Je to jako nouzová brzda. Když se cena vydá příliš proti vám, předem určené pravidlo obchod ukončí a zabrání ještě větší ztrátě.",
  take_profit:
    "Je to jako automatický výběr výhry. Řeknete si předem, při jaké ceně už jste spokojený, a pozici necháte zavřít.",
  divergence:
    "Je to jako když auto zrychluje, ale otáčkoměr začíná ukazovat něco jiného. Cena a indikátor se rozcházejí a může to být varovný signál.",
  support:
    "Představte si podlahu v místnosti. Když cena klesá, support je oblast, kde se často objeví kupující a pád se může zpomalit nebo odrazit.",
  resistance:
    "Je to jako strop. Cena se k němu může několikrát vrátit, ale právě v této oblasti se často objeví více prodejců.",
  trend:
    "Je to jako jízda po silnici, která dlouhodobě stoupá nebo klesá. Jednotlivé zatáčky mohou být opačně, ale hlavní směr zůstává stejný.",
  rsi:
    "Představte si teploměr sentimentu. Neukazuje budoucnost, ale napovídá, jestli byl pohyb v poslední době mimořádně silný na jednu stranu.",
  macd:
    "Je to jako porovnávat dvě rychlosti jízdy. Sleduje rozdíl mezi rychlejším a pomalejším tempem ceny a pomáhá zachytit změnu momenta.",
  etf:
    "Je to jako koupit celý košík místo jedné věci. Jedním nákupem získáte malý podíl ve velkém množství aktiv.",
  diverzifikace:
    "Je to jako nerozdávat všechny peníze do jedné kapsy. Když jedna věc selže, nemusí s ní padnout celé portfolio.",
  short:
    "Je to jako nejdřív si půjčit zboží, prodat ho a doufat, že ho později koupíte levněji a vrátíte. Vyděláváte na poklesu, ale riziko může být velmi vysoké.",
  long:
    "Je to jednoduše sázka na růst. Koupíte aktivum a doufáte, že ho později prodáte za vyšší cenu.",
  "risk_reward":
    "Je to jako rozhodování, jestli se vám vyplatí nastoupit do závodu kvůli možné výhře. Porovnáváte, co můžete získat, s tím, co jste ochotni ztratit.",
  "stop_limit":
    "Je to jako nouzová brzda s podmínkou: nejdřív se musí spustit a potom ještě potřebujete, aby se obchod vešel do vašeho cenového limitu.",
  "compound_interest":
    "Je to jako sněhová koule, která se při cestě z kopce nabaluje. Výnosy začnou vytvářet další výnosy a efekt se časem zrychluje.",
  "backtesting":
    "Je to jako projet si závodní trať nanečisto na starých záznamech. Zjišťujete, jak by vaše strategie fungovala v minulosti, než ji pustíte na skutečný trh.",
  "order_flow":
    "Je to jako sledovat dav lidí u pokladny místo jen cenovky. Nevidíte jen cenu, ale i to, kdo právě tlačí na nákup a kdo na prodej.",
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

function analogyFor(term: string, category?: string | null) {
  const key = normalizeTerm(term);
  if (ANALOGIES[key]) return ANALOGIES[key];

  if (category === "technicka_analyza") {
    return `Ber ${term} jako jednu pomůcku na palubní desce auta. Sama o sobě ti neřekne, kam dojedeš, ale pomůže ti lépe číst, co se právě na trhu děje.`;
  }
  if (category === "risk_management") {
    return `Přemýšlej o pojmu ${term} jako o bezpečnostním pásu. Nezajistí, že se nic nestane, ale může výrazně omezit následky špatného scénáře.`;
  }
  if (category === "fundamentalni_analyza") {
    return `Představ si ${term} jako kontrolu motoru firmy. Nesleduješ jen cenu na tachometru, ale hlavně to, jak zdravě celý podnik skutečně funguje.`;
  }
  if (category === "obchodovani") {
    return `Představ si ${term} jako jedno pravidlo v obchodním plánu. Pomáhá ti rozhodovat se systematicky místo toho, abys reagoval jen podle emocí.`;
  }
  if (category === "psychologie") {
    return `Je to podobné jako sportovní výkon. Když tě ovládnou emoce, můžeš udělat horší rozhodnutí, i když technicky víš, co máš dělat.`;
  }

  return `Představ si ${term} jako jednu součástku v tradingovém stroji. Sama o sobě není celý systém, ale pomáhá ti pochopit, co se na trhu právě děje.`;
}

function Slovnik() {
  const { data, isLoading } = useQuery(glossaryQuery);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = (data ?? []).filter((t) =>
    `${t.term} ${t.definition}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Slovníček pojmů</h1>
          <p className="mt-2 text-muted-foreground">
            Klikni na pojem a zobrazí se ti stručné vysvětlení, jednoduché přirovnání a praktický
            kontext.
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
                                {analogyFor(t.term, t.category)}
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
