import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { lessonQuery, quizQuery, levelLabel } from "@/lib/content";

export const Route = createFileRoute("/lekce/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Lekce ${params.slug} — Trading Academy CZ` },
      { name: "description", content: "Lekce o investování a obchodování s kvízem a poznámkami." },
      { property: "og:title", content: "Lekce — Trading Academy CZ" },
      { property: "og:description", content: "Vzdělávací lekce s kvízem a sledováním pokroku." },
    ],
  }),
  component: LessonPage,
});

function Content({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="mt-8 space-y-4">
      {blocks.map((block, i) => {
        const t = block.trim();
        if (!t) return null;
        if (t.startsWith("## "))
          return (
            <h2 key={i} className="pt-4 font-display text-xl font-semibold">
              {t.slice(3)}
            </h2>
          );
        if (t.startsWith("# "))
          return (
            <h2 key={i} className="pt-4 font-display text-2xl font-semibold">
              {t.slice(2)}
            </h2>
          );
        if (t.startsWith("```"))
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-4 font-mono text-xs"
            >
              {t.replace(/```[a-z]*\n?/g, "")}
            </pre>
          );
        if (/^[-*] /m.test(t) && t.split("\n").every((l) => /^[-*] /.test(l.trim())))
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-muted-foreground">
              {t.split("\n").map((l, j) => (
                <li key={j}>{l.replace(/^[-*] /, "")}</li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="leading-relaxed text-muted-foreground">
            {t}
          </p>
        );
      })}
    </div>
  );
}

function LessonPage() {
  const { slug } = Route.useParams();
  const { user } = useSession();
  const qc = useQueryClient();
  const lesson = useQuery(lessonQuery(slug));
  const quiz = useQuery(quizQuery(slug));

  const progress = useQuery({
    queryKey: ["progress", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("lesson_slug", slug)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const bookmark = useQuery({
    queryKey: ["bookmark", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("lesson_slug", slug)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (progress.data) setNotes(progress.data.notes ?? "");
  }, [progress.data]);

  const saveProgress = useMutation({
    mutationFn: async (patch: { completed?: boolean; score?: number; notes?: string }) => {
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: user!.id,
          lesson_slug: slug,
          completed: patch.completed ?? progress.data?.completed ?? false,
          score: patch.score ?? progress.data?.score ?? null,
          notes: patch.notes ?? notes,
        },
        { onConflict: "user_id,lesson_slug" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["all-progress"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (bookmark.data) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", bookmark.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user!.id, lesson_slug: slug });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmark"] });
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const questions = quiz.data ?? [];
  const correct = questions.filter((q) => answers[q.id] === q.correct_index).length;

  if (lesson.isLoading) {
    return (
      <SiteLayout>
        <p className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Načítám lekci…</p>
      </SiteLayout>
    );
  }

  if (!lesson.data) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-display text-2xl font-semibold">Lekce nenalezena</h1>
          <Button asChild className="mt-6">
            <Link to="/kurzy">Zpět na lekce</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const l = lesson.data;

  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link
          to="/kurzy"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Všechny lekce
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{levelLabel(l.level)}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> {l.duration_min} min
          </span>
          {progress.data?.completed && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
              <CheckCircle2 className="size-3.5" /> Dokončeno
            </span>
          )}
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">{l.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{l.summary}</p>

        {user && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant={progress.data?.completed ? "secondary" : "default"}
              onClick={() => saveProgress.mutate({ completed: !progress.data?.completed })}
            >
              <CheckCircle2 className="size-4" />
              {progress.data?.completed ? "Označit jako nedokončené" : "Označit jako dokončené"}
            </Button>
            <Button variant="secondary" onClick={() => toggleBookmark.mutate()}>
              {bookmark.data ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {bookmark.data ? "Uloženo" : "Uložit"}
            </Button>
          </div>
        )}

        <Content text={l.content} />

        {questions.length > 0 && (
          <section className="surface mt-12 p-6">
            <h2 className="font-display text-xl font-semibold">Kvíz</h2>
            <div className="mt-6 space-y-6">
              {questions.map((q) => {
                const opts = (q.options as unknown as string[]) ?? [];
                return (
                  <div key={q.id}>
                    <p className="font-medium">{q.question}</p>
                    <div className="mt-3 space-y-2">
                      {opts.map((opt, i) => {
                        const selected = answers[q.id] === i;
                        const isCorrect = i === q.correct_index;
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={submitted}
                            onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                            className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                              submitted && isCorrect
                                ? "border-[var(--color-success)] bg-[var(--color-success)]/10"
                                : submitted && selected
                                  ? "border-destructive bg-destructive/10"
                                  : selected
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && q.explanation && (
                      <p className="mt-2 text-sm text-muted-foreground">{q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {submitted ? (
              <p className="mt-6 font-display text-lg">
                Výsledek:{" "}
                <span className="text-primary">
                  {correct} / {questions.length}
                </span>
              </p>
            ) : (
              <Button
                className="mt-6"
                disabled={Object.keys(answers).length < questions.length}
                onClick={() => {
                  setSubmitted(true);
                  const score = Math.round(
                    (questions.filter((q) => answers[q.id] === q.correct_index).length /
                      questions.length) *
                      100,
                  );
                  if (user) saveProgress.mutate({ score, completed: score >= 60 });
                }}
              >
                Vyhodnotit
              </Button>
            )}
          </section>
        )}

        <section className="surface mt-8 p-6">
          <h2 className="font-display text-xl font-semibold">Moje poznámky</h2>
          {user ? (
            <>
              <Textarea
                className="mt-4 min-h-32"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Co si z lekce odnášíte?"
              />
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() =>
                  saveProgress.mutate(
                    { notes },
                    { onSuccess: () => toast.success("Poznámka uložena") },
                  )
                }
              >
                Uložit poznámku
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">
                Přihlaste se
              </Link>{" "}
              a můžete si psát poznámky, ukládat lekce a sledovat pokrok.
            </p>
          )}
        </section>
      </article>
    </SiteLayout>
  );
}
