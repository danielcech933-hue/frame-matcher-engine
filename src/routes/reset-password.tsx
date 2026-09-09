import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nastavení nového hesla — Trading Academy CZ" },
      { name: "description", content: "Zvolte si nové heslo ke svému účtu Trading Academy CZ." },
      { property: "og:title", content: "Nové heslo — Trading Academy CZ" },
      { property: "og:description", content: "Obnova hesla k účtu." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Heslo bylo změněno.");
    navigate({ to: "/prehled", replace: true });
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold">Nové heslo</h1>
        <form onSubmit={submit} className="surface mt-8 space-y-4 p-6">
          <div>
            <Label htmlFor="new-password">Nové heslo</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={6}
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Uložit heslo
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
