import { createFileRoute } from "@tanstack/react-router";
import { LockKeyhole, Sparkles, TrendingUp } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/trading-lab")({
  head: () => ({
    meta: [
      { title: "Trading Lab — Trading Academy CZ" },
      {
        name: "description",
        content: "Připravujeme pokročilý interaktivní Trading Lab s live tržními daty, grafy a simulací obchodování.",
      },
    ],
  }),
  component: () => (
    <SiteLayout>
      <section className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-[#0b0f17]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(250,204,21,0.10),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.08),transparent_28%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl items-center justify-center px-6 py-16">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#111722]/90 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 shadow-[0_0_40px_rgba(250,204,21,0.10)]">
              <LockKeyhole className="size-8 text-yellow-300" />
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200">
              <Sparkles className="size-3.5" />
              PŘIPRAVUJEME
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Trading Lab už brzy
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Stavíme vlastní profesionální tradingové prostředí přímo v Trading Academy.
              Čekají tě pokročilé grafy, live tržní data, technické indikátory, Market Watch,
              simulované obchody, SL/TP a realistické prostředí pro bezpečný trénink bez rizika skutečných peněz.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
              {[
                { title: "Live trhy", text: "Aktuální pohyby vybraných instrumentů" },
                { title: "Analýza", text: "Indikátory, grafy a nástroje pro výuku" },
                { title: "Simulace", text: "Trénink obchodování bez reálných peněz" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <TrendingUp className="mb-3 size-4 text-yellow-300" />
                  <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{item.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-9 text-sm text-slate-500">
              Trading Lab je momentálně uzamčen pro všechny uživatele. Jakmile bude připravený,
              zpřístupníme ho přímo zde.
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  ),
});
