import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Bookmark,
  CheckCircle2,
  Clock,
  GraduationCap,
  MessageSquareText,
  Save,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { lessonsQuery, levelLabel } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/prehled")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Overview,
});

type GoalMonth = {
  id: string;
  user_id: string;
  month_start: string;
  target_closes: number;
  actual_closes: number;
  opportunities: number;
  notes: string;
};

type Argumentation = {
  id: string;
  happened_at: string;
  call_stage: string;
  objection: string;
  ai_response: string;
  ai_reasoning: string;
  ai_next_step: string;
  opportunity_fit: number;
};

const db = supabase as any;

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function addMonths(date: Date, count: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

function cleanGoal(value: string, fallback = 0) {
  const n = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.min(100000, n)) : fallback;
}

function analyseObjection(raw: string, stage: string) {
  const text = raw.trim().toLowerCase();
  const stageLabel = stage === "closing" ? "v samotném závěru hovoru" : `ve fázi ${stage}`;

  if (!text) {
    return {
      response: "Nejdřív napiš přesnou námitku nebo větu, na které hovor spadl.",
      reasoning: "Čím přesněji zachytíš formulaci klienta, tím přesnější bude návrh reakce.",
      nextStep: "Vlož jednu konkrétní větu klienta.",
      fit: 0,
    };
  }

  const rules: Array<{ terms: string[]; response: string; reasoning: string; nextStep: string; fit: number }> = [
    {
      terms: ["drah", "cena", "peníze", "rozpočet", "rozpoct", "moc stojí"],
      response: "Rozumím. Když říkáte, že je to drahé, je problém samotná částka, nebo zatím nevidíte hodnotu, která by tu cenu ospravedlnila?",
      reasoning: "Neobhajuj cenu ani hned nenabízej slevu. Nejdřív zjisti, jestli je skutečným problémem rozpočet, nebo vnímaná hodnota.",
      nextStep: "Nech klienta pojmenovat konkrétní rozdíl mezi cenou a očekávaným přínosem a vrať se k jeho hlavnímu cíli.",
      fit: 82,
    },
    {
      terms: ["promysl", "rozmysl", "ozvu", "později", "pozdeji", "ještě si to"],
      response: "Jasně. Co konkrétně si potřebujete ještě promyslet, abyste se mohl rozhodnout?",
      reasoning: "Námitka ‚musím si to promyslet‘ často skrývá nepojmenovaný problém. Potřebuješ zjistit, co přesně brání rozhodnutí.",
      nextStep: "Dostaň z klienta jednu konkrétní nevyřešenou otázku a uzavři ji přímo.",
      fit: 76,
    },
    {
      terms: ["email", "pošlete", "poslete", "pošli", "material", "materiál", "nabídku"],
      response: "Pošlu vám to. Aby vám ale e-mail opravdu pomohl rozhodnout se, co v něm pro vás musí být nejdůležitější?",
      reasoning: "Pouhé ‚pošlete mi nabídku‘ může hovor přenést do pasivního režimu. Cílem je zachovat další konkrétní krok.",
      nextStep: "Domluv přesný termín dalšího kontaktu ještě před ukončením hovoru.",
      fit: 68,
    },
    {
      terms: ["konkur", "jiná firma", "jina firma", "alternativa", "srovn"],
      response: "To dává smysl. Podle čeho budete nabídky porovnávat, aby bylo jasné, která varianta je pro vás skutečně lepší?",
      reasoning: "Nesnižuj konkurenci. Nejdřív zjisti rozhodovací kritéria a podle nich ukaž konkrétní rozdíl.",
      nextStep: "Vyber 1–2 rozhodovací kritéria a ukaž na nich konkrétní hodnotu své nabídky.",
      fit: 79,
    },
    {
      terms: ["čas", "nestíhám", "nestiham", "teď ne", "ted ne", "nemám čas", "nemam cas"],
      response: "Chápu. Je problém, že to teď časově nejde vůbec, nebo by vám dávalo smysl vyřešit to, kdybychom to udělali co nejjednodušší?",
      reasoning: "Rozlišuj skutečný nedostatek času od nízké priority. To jsou dvě úplně jiné situace.",
      nextStep: "Zjisti, co se musí stát, aby se z toho stala priorita, a navrhni jediný jednoduchý další krok.",
      fit: 64,
    },
    {
      terms: ["manžel", "manželka", "partner", "partnerka", "rodiče", "kolega", "musím se zeptat"],
      response: "Rozumím. Co bude podle vás pro druhou stranu nejdůležitější, aby s tím souhlasila?",
      reasoning: "Místo tlaku na rozhodnutí jiné osoby zjisti, podle čeho bude rozhodovat a připrav klienta na tuto část argumentace.",
      nextStep: "Sepište spolu hlavní argument pro druhého rozhodovatele a domluv konkrétní pokračování.",
      fit: 71,
    },
    {
      terms: ["nevěř", "nejsem si jist", "nejsem si jistý", "důvěra", "scam", "podvod"],
      response: "Rozumím. Co přesně ve vás vyvolává největší pochybnost? Je to výsledek, proces, reference, nebo něco jiného?",
      reasoning: "Důvěra se neřeší dalším tlakem. Potřebuješ identifikovat přesný zdroj nejistoty a dodat relevantní důkaz.",
      nextStep: "Vyřeš jednu konkrétní pochybnost a ověř, jestli se tím bariéra odstranila.",
      fit: 59,
    },
  ];

  const match = rules.find((rule) => rule.terms.some((term) => text.includes(term)));
  if (match) return { ...match, reasoning: `${match.reasoning} Hovor spadl ${stageLabel}.` };

  return {
    response: "Rozumím. Když to shrnu, co je teď hlavní důvod, proč se nechcete posunout dál?",
    reasoning: `Námitka není jednoznačně rozpoznaná. Hovor spadl ${stageLabel}, proto je nejlepší nejdřív odhalit skutečnou bariéru místo okamžité argumentace.`,
    nextStep: "Polož otevřenou otázku, zjisti hlavní překážku a potom reaguj pouze na ni.",
    fit: 55,
  };
}

function Overview() {
  const { user } = useSession();
  const userId = user?.id;
  const profile = useProfile(userId);
  const lessons = useQuery(lessonsQuery);
  const queryClient = useQueryClient();

  const progress = useQuery({
    queryKey: ["all-progress", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });

  const bookmarks = useQuery({
    queryKey: ["bookmarks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const goals = useQuery({
    queryKey: ["sales-goal", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db.from("sales_goals").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data as { id: string; monthly_target: number } | null;
    },
  });

  const goalMonths = useQuery({
    queryKey: ["sales-goal-months", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("sales_goal_months")
        .select("*")
        .eq("user_id", userId!)
        .order("month_start", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GoalMonth[];
    },
  });

  const argumentations = useQuery({
    queryKey: ["call-argumentations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("call_argumentations")
        .select("id,happened_at,call_stage,objection,ai_response,ai_reasoning,ai_next_step,opportunity_fit")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as Argumentation[];
    },
  });

  const completed = useMemo(
    () => new Set((progress.data ?? []).filter((p) => p.completed).map((p) => p.lesson_slug)),
    [progress.data],
  );
  const percentage = lessons.data?.length ? Math.round((completed.size / lessons.data.length) * 100) : 0;
  const bookmarkedLessons = (bookmarks.data ?? [])
    .map((b) => lessons.data?.find((l) => l.slug === b.lesson_slug))
    .filter(Boolean);
  const nextLesson = lessons.data?.find((l) => !completed.has(l.slug));

  const [target, setTarget] = useState("10");
  const [goalReady, setGoalReady] = useState(false);
  const [objection, setObjection] = useState("");
  const [callStage, setCallStage] = useState("objection");
  const [analysis, setAnalysis] = useState(() => analyseObjection("", "objection"));
  const [savingMonth, setSavingMonth] = useState<string | null>(null);

  useEffect(() => {
    if (goals.data && !goalReady) {
      setTarget(String(goals.data.monthly_target));
      setGoalReady(true);
    }
  }, [goals.data, goalReady]);

  const currentMonth = monthStart(new Date());
  const currentMonthRow = goalMonths.data?.find((m) => m.month_start === currentMonth);
  const currentTarget = currentMonthRow?.target_closes ?? goals.data?.monthly_target ?? cleanGoal(target, 10);
  const currentActual = currentMonthRow?.actual_closes ?? 0;
  const currentOpportunities = currentMonthRow?.opportunities ?? 0;
  const currentCloseRate = currentOpportunities > 0 ? Math.round((currentActual / currentOpportunities) * 100) : 0;
  const currentProgress = currentTarget > 0 ? Math.min(100, Math.round((currentActual / currentTarget) * 100)) : 0;

  const saveGoal = useMutation({
    mutationFn: async () => {
      const monthlyTarget = cleanGoal(target, 10);
      if (!userId) throw new Error("Uživatel není přihlášen.");
      const { error } = await db.from("sales_goals").upsert(
        { user_id: userId, monthly_target: monthlyTarget },
        { onConflict: "user_id" },
      );
      if (error) throw error;

      const now = new Date();
      const months = Array.from({ length: 12 }, (_, i) => ({
        user_id: userId,
        month_start: monthStart(addMonths(now, i)),
        target_closes: monthlyTarget,
      }));
      const { error: monthsError } = await db
        .from("sales_goal_months")
        .upsert(months, { onConflict: "user_id,month_start", ignoreDuplicates: false });
      if (monthsError) throw monthsError;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-goal", userId] }),
        queryClient.invalidateQueries({ queryKey: ["sales-goal-months", userId] }),
      ]);
    },
  });

  const saveMonth = useMutation({
    mutationFn: async ({ month, actual, opportunities }: { month: GoalMonth; actual: number; opportunities: number }) => {
      if (!userId) throw new Error("Uživatel není přihlášen.");
      setSavingMonth(month.month_start);
      const { error } = await db
        .from("sales_goal_months")
        .update({
          actual_closes: Math.max(0, Math.min(100000, actual)),
          opportunities: Math.max(0, Math.min(1000000, opportunities)),
        })
        .eq("id", month.id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sales-goal-months", userId] });
    },
    onSettled: () => setSavingMonth(null),
  });

  const runAnalysis = () => setAnalysis(analyseObjection(objection, callStage));

  const saveArgumentation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Uživatel není přihlášen.");
      const result = analyseObjection(objection, callStage);
      const { error } = await db.from("call_argumentations").insert({
        user_id: userId,
        call_stage: callStage,
        objection: objection.trim(),
        ai_response: result.response,
        ai_reasoning: result.reasoning,
        ai_next_step: result.nextStep,
        opportunity_fit: result.fit,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setAnalysis(analyseObjection(objection, callStage));
      await queryClient.invalidateQueries({ queryKey: ["call-argumentations", userId] });
    },
  });

  const monthRows = goalMonths.data?.slice(0, 12) ?? [];
  const summaryTarget = monthRows.reduce((sum, m) => sum + m.target_closes, 0);
  const summaryActual = monthRows.reduce((sum, m) => sum + m.actual_closes, 0);
  const summaryOpportunities = monthRows.reduce((sum, m) => sum + m.opportunities, 0);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary">Můj účet</Badge>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{profile.data?.display_name ?? "Trader"}, váš pracovní dashboard</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">Sledujte měsíční Close, počet příležitostí a používejte AI Helper pro rozbory momentů, kde vám spadl hovor.</p>
          </div>
          {nextLesson && <Link to="/lekce/$slug" params={{ slug: nextLesson.slug }} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Pokračovat ve studiu <ArrowRight className="size-4" /></Link>}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="surface p-5"><GraduationCap className="size-5 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Pokrok</p><p className="font-display text-3xl font-bold">{percentage}%</p></div>
          <div className="surface p-5"><CheckCircle2 className="size-5 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Dokončeno</p><p className="font-display text-3xl font-bold">{completed.size}</p></div>
          <div className="surface p-5"><Bookmark className="size-5 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Záložky</p><p className="font-display text-3xl font-bold">{bookmarks.data?.length ?? 0}</p></div>
          <div className="surface p-5"><Award className="size-5 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Úroveň</p><p className="font-display text-xl font-bold">{profile.data ? levelLabel(profile.data.level) : "—"}</p></div>
        </div>

        <section className="surface mt-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="flex items-center gap-2"><Target className="size-5 text-primary" /><h2 className="font-display text-xl font-semibold">Měsíční cíl Close</h2></div><p className="mt-1 text-sm text-muted-foreground">Nastav si, kolik Close chceš měsíčně. Tabulka se automaticky připraví na 12 měsíců.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div><Label htmlFor="monthly-target">Cíl Close / měsíc</Label><Input id="monthly-target" className="mt-2 w-full sm:w-40" type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
              <Button onClick={() => saveGoal.mutate()} disabled={saveGoal.isPending}><Save className="size-4" /> {saveGoal.isPending ? "Ukládám…" : "Uložit cíl"}</Button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4"><p className="text-xs text-muted-foreground">Cíl tento měsíc</p><p className="mt-1 font-display text-3xl font-bold">{currentTarget}</p><p className="text-xs text-muted-foreground">Close</p></div>
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4"><p className="text-xs text-muted-foreground">Skutečně</p><p className="mt-1 font-display text-3xl font-bold">{currentActual}</p><p className="text-xs text-muted-foreground">{currentProgress}% cíle</p></div>
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4"><p className="text-xs text-muted-foreground">Close rate</p><p className="mt-1 font-display text-3xl font-bold">{currentCloseRate}%</p><p className="text-xs text-muted-foreground">{currentOpportunities} příležitostí</p></div>
          </div>
          <Progress className="mt-5 h-3" value={currentProgress} />
          {saveGoal.isError && <p className="mt-3 text-sm text-destructive">Cíl se nepodařilo uložit. Zkus to znovu.</p>}
        </section>

        <section className="surface mt-6 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div><div className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /><h2 className="font-display text-xl font-semibold">Automatická tabulka výkonu</h2></div><p className="mt-1 text-sm text-muted-foreground">Pro každý měsíc doplň příležitosti a skutečné Close. Výkon se přepočítá okamžitě.</p></div>
            <Badge variant="outline">12 měsíců</Badge>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-secondary/40 text-left"><tr><th className="px-4 py-3 font-medium">Měsíc</th><th className="px-4 py-3 font-medium">Cíl</th><th className="px-4 py-3 font-medium">Příležitosti</th><th className="px-4 py-3 font-medium">Close</th><th className="px-4 py-3 font-medium">Close rate</th><th className="px-4 py-3 font-medium">Plnění</th><th className="px-4 py-3 font-medium">Akce</th></tr></thead>
              <tbody>{monthRows.map((month) => {
                const rate = month.opportunities > 0 ? Math.round((month.actual_closes / month.opportunities) * 100) : 0;
                const fill = month.target_closes > 0 ? Math.min(100, Math.round((month.actual_closes / month.target_closes) * 100)) : 0;
                return <tr key={month.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-medium">{monthLabel(month.month_start)}</td>
                  <td className="px-4 py-3">{month.target_closes}</td>
                  <td className="px-4 py-3"><Input type="number" min="0" defaultValue={month.opportunities} id={`opp-${month.id}`} className="w-28" /></td>
                  <td className="px-4 py-3"><Input type="number" min="0" defaultValue={month.actual_closes} id={`close-${month.id}`} className="w-24" /></td>
                  <td className="px-4 py-3 font-medium">{rate}%</td>
                  <td className="px-4 py-3"><div className="w-28"><div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>{fill}%</span><span>{month.target_closes}</span></div><Progress value={fill} /></div></td>
                  <td className="px-4 py-3"><Button size="sm" variant="secondary" disabled={savingMonth === month.month_start} onClick={() => {
                    const actual = cleanGoal((document.getElementById(`close-${month.id}`) as HTMLInputElement)?.value ?? String(month.actual_closes), month.actual_closes);
                    const opportunities = cleanGoal((document.getElementById(`opp-${month.id}`) as HTMLInputElement)?.value ?? String(month.opportunities), month.opportunities);
                    saveMonth.mutate({ month, actual, opportunities });
                  }}>{savingMonth === month.month_start ? "…" : "Uložit"}</Button></td>
                </tr>;
              })}</tbody>
              <tfoot className="border-t border-border/70 bg-secondary/30"><tr><td className="px-4 py-3 font-semibold">Součet</td><td className="px-4 py-3 font-semibold">{summaryTarget}</td><td className="px-4 py-3 font-semibold">{summaryOpportunities}</td><td className="px-4 py-3 font-semibold">{summaryActual}</td><td className="px-4 py-3 font-semibold">{summaryOpportunities ? Math.round((summaryActual / summaryOpportunities) * 100) : 0}%</td><td className="px-4 py-3 font-semibold">{summaryTarget ? Math.round((summaryActual / summaryTarget) * 100) : 0}%</td><td /></tr></tfoot>
            </table>
          </div>
        </section>

        <section className="surface mt-6 p-6">
          <div className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /><h2 className="font-display text-xl font-semibold">AI Helper — Argumentace hovoru</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Napiš, kde hovor spadl a co klient řekl. Helper vrátí konkrétní reakci, důvod a další krok.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div><Label htmlFor="call-stage">Kde hovor spadl</Label><select id="call-stage" value={callStage} onChange={(e) => setCallStage(e.target.value)} className="mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="discovery">Discovery</option><option value="qualification">Kvalifikace</option><option value="objection">Námitka</option><option value="offer">Nabídka</option><option value="closing">Closing</option></select></div>
              <div><Label htmlFor="objection">Argument / námitka klienta</Label><Textarea id="objection" value={objection} onChange={(e) => setObjection(e.target.value)} placeholder="Např. Je to moc drahé, musím si to promyslet…" className="mt-2 min-h-36" /></div>
              <div className="flex flex-wrap gap-2"><Button onClick={runAnalysis}><Sparkles className="size-4" /> Vyhodnotit</Button><Button variant="secondary" disabled={!objection.trim() || saveArgumentation.isPending} onClick={() => saveArgumentation.mutate()}><Save className="size-4" /> Uložit do historie</Button></div>
              {saveArgumentation.isError && <p className="text-sm text-destructive">Argumentaci se nepodařilo uložit.</p>}
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-primary"><MessageSquareText className="size-5" /><span className="font-semibold">Doporučená reakce</span></div><Badge variant="outline">Příležitost {analysis.fit}%</Badge></div>
              <p className="mt-4 text-base leading-relaxed">{analysis.response}</p>
              <div className="mt-5 border-t border-primary/10 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Proč</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{analysis.reasoning}</p></div>
              <div className="mt-4 border-t border-primary/10 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Další krok</p><p className="mt-1 text-sm leading-relaxed">{analysis.nextStep}</p></div>
            </div>
          </div>
        </section>

        <section className="surface mt-6 p-6">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><TrendingUp className="size-5 text-primary" /><h2 className="font-display text-xl font-semibold">Příležitosti × AI Helper</h2></div><Badge variant="secondary">Historie</Badge></div>
          <p className="mt-1 text-sm text-muted-foreground">Tady uvidíš, na jakých námitkách nejčastěji ztrácíš příležitosti a jaké reakce ti systém doporučil.</p>
          {argumentations.data?.length ? <div className="mt-5 space-y-3">{argumentations.data.map((item) => <article key={item.id} className="rounded-xl border border-border/70 bg-secondary/20 p-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.call_stage}</Badge><span className="text-xs text-muted-foreground"><Clock className="mr-1 inline size-3.5" />{new Intl.DateTimeFormat("cs-CZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(item.happened_at))}</span></div><Badge variant="secondary">Příležitost {item.opportunity_fit}%</Badge></div><p className="mt-3 text-sm font-medium">„{item.objection}“</p><p className="mt-2 text-sm text-muted-foreground">{item.ai_response}</p></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">Zatím nemáš žádnou uloženou argumentaci. První rozbor se uloží do historie.</div>}
        </section>

        <section className="surface mt-6 p-6"><div className="flex items-center justify-between gap-4"><h2 className="font-display text-xl font-semibold">Celkový postup</h2><span className="text-sm text-muted-foreground">{completed.size} / {lessons.data?.length ?? 0} lekcí</span></div><Progress className="mt-4 h-3" value={percentage} /></section>

        <section className="mt-10"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">Uložené lekce</h2><Link to="/kurzy" className="text-sm text-primary hover:underline">Všechny lekce</Link></div>{bookmarkedLessons.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{bookmarkedLessons.map((l) => l && <Link key={l.slug} to="/lekce/$slug" params={{ slug: l.slug }} className="surface card-hover p-5"><div className="flex items-center justify-between gap-3"><Badge variant="secondary">{levelLabel(l.level)}</Badge><Clock className="size-4 text-muted-foreground" /></div><h3 className="mt-3 font-semibold">{l.title}</h3><p className="mt-1 text-sm text-muted-foreground">{l.summary}</p></Link>)}</div> : <div className="surface mt-5 p-6 text-sm text-muted-foreground">Zatím nemáte žádnou uloženou lekci. Uložte si lekce, ke kterým se chcete vrátit.</div>}</section>

        <div className="mt-10 flex gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" /><p>AI Helper slouží jako tréninková pomůcka pro obchodní hovory. Doporučení je potřeba přizpůsobit konkrétní situaci a klientovi.</p></div>
      </div>
    </SiteLayout>
  );
}
