import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, Bookmark, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/auth";
import { lessonsQuery, levelLabel } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/prehled")({
  ssr: false,
  component: Overview,
});

function Overview() {
  const { user } = Route.useRouteContext() as { user: { id: string } };
  const profile = useProfile(user.id);
  const lessons = useQuery(lessonsQuery);
  const progress = useQuery({
    queryKey: ["all-progress", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });
  const bookmarks = useQuery({
    queryKey: ["bookmarks", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookmarks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const completed = useMemo(() => new Set((progress.data ?? []).filter((p) => p.completed).map((p) => p.lesson_slug)), [progress.data]);
  const percentage = lessons.data?.length ? Math.round((completed.size / lessons.data.length) * 100) : 0;
  const bookmarkedLessons = (bookmarks.data ?? []).map((b) => lessons.data?.find((l) => l.slug === b.lesson_slug)).filter(Boolean);
  const nextLesson = lessons.data?.find((l) => !completed.has(l.slug));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary">Můj účet</Badge>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Váš učební přehled</h1>
            <p className="mt-2 text-muted-foreground">{profile.data?.display_name ?? "Trader"}, tady vidíte svůj postup a uložené lekce.</p>
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
          <div className="flex items-center justify-between gap-4"><h2 className="font-display text-xl font-semibold">Celkový postup</h2><span className="text-sm text-muted-foreground">{completed.size} / {lessons.data?.length ?? 0} lekcí</span></div>
          <Progress className="mt-4 h-3" value={percentage} />
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">Uložené lekce</h2><Link to="/kurzy" className="text-sm text-primary hover:underline">Všechny lekce</Link></div>
          {bookmarkedLessons.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{bookmarkedLessons.map((l) => l && <Link key={l.slug} to="/lekce/$slug" params={{ slug: l.slug }} className="surface card-hover p-5"><div className="flex items-center justify-between gap-3"><Badge variant="secondary">{levelLabel(l.level)}</Badge><Clock className="size-4 text-muted-foreground" /></div><h3 className="mt-3 font-semibold">{l.title}</h3><p className="mt-1 text-sm text-muted-foreground">{l.summary}</p></Link>)}</div> : <div className="surface mt-5 p-6 text-sm text-muted-foreground">Zatím nemáte žádnou uloženou lekci. Uložte si lekce, ke kterým se chcete vrátit.</div>}
        </section>
      </div>
    </SiteLayout>
  );
}
