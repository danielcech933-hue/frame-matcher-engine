import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/auth";
import { lessonsQuery, LEVELS, type LevelValue } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Admin,
});

type Draft = { slug: string; title: string; summary: string; content: string; level: LevelValue; duration_min: number; published: boolean };
const emptyDraft: Draft = { slug: "", title: "", summary: "", content: "", level: "zacatecnik", duration_min: 10, published: true };

function Admin() {
  const { user } = useSession();
  const admin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const lessons = useQuery(lessonsQuery);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.slug.trim() || !draft.title.trim()) throw new Error("Slug a název jsou povinné.");
      const query = editing
        ? supabase.from("lessons").update(draft).eq("slug", editing)
        : supabase.from("lessons").insert(draft);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); setEditing(null); setDraft(emptyDraft); toast.success("Lekce uložena"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (slug: string) => { const { error } = await supabase.from("lessons").delete().eq("slug", slug); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); toast.success("Lekce smazána"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (admin.isLoading) return <SiteLayout><p className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Ověřuji oprávnění…</p></SiteLayout>;
  if (!admin.data) return <SiteLayout><div className="mx-auto max-w-3xl px-4 py-16"><h1 className="font-display text-2xl font-bold">Přístup odepřen</h1><p className="mt-2 text-muted-foreground">Tato stránka je dostupná pouze administrátorům.</p><Button asChild className="mt-6"><Link to="/">Zpět na úvod</Link></Button></div></SiteLayout>;

  const startEdit = (l: NonNullable<typeof lessons.data>[number]) => {
    setEditing(l.slug);
    setDraft({ slug: l.slug, title: l.title, summary: l.summary, content: l.content, level: l.level, duration_min: l.duration_min, published: l.published });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <SiteLayout><div className="mx-auto max-w-6xl px-4 py-12">
    <Badge variant="secondary">Administrace</Badge><h1 className="mt-3 font-display text-3xl font-bold">Správa lekcí</h1><p className="mt-2 text-muted-foreground">Vytvářejte, upravujte a publikujte obsah akademie.</p>
    <section className="surface mt-8 p-6"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{editing ? "Upravit lekci" : "Nová lekce"}</h2>{editing && <Button variant="ghost" onClick={() => { setEditing(null); setDraft(emptyDraft); }}>Zrušit</Button>}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><Input value={draft.slug} disabled={!!editing} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="slug-lekce" /><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Název lekce" /><Input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Krátké shrnutí" /><Input type="number" value={draft.duration_min} onChange={(e) => setDraft({ ...draft, duration_min: Number(e.target.value) })} placeholder="Délka v minutách" /><select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as LevelValue })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">{LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Publikováno</label></div>
      <Textarea className="mt-4 min-h-64" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="Obsah lekce. Podporováno je jednoduché Markdown formátování." />
      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}><Save className="size-4" />{save.isPending ? "Ukládám…" : "Uložit lekci"}</Button>
    </section>
    <section className="mt-10"><h2 className="font-display text-2xl font-semibold">Existující lekce ({lessons.data?.length ?? 0})</h2><div className="mt-5 space-y-3">{(lessons.data ?? []).map((l) => <div key={l.slug} className="surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><Badge variant="secondary">{l.level}</Badge>{!l.published && <Badge>Skryto</Badge>}</div><h3 className="mt-2 font-semibold">{l.title}</h3><p className="text-sm text-muted-foreground">{l.slug} · {l.duration_min} min</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => startEdit(l)}><Pencil className="size-4" /> Upravit</Button><Button variant="destructive" onClick={() => { if (confirm(`Opravdu smazat „${l.title}“?`)) remove.mutate(l.slug); }}><Trash2 className="size-4" /></Button></div></div>)}</div></section>
  </div></SiteLayout>;
}
