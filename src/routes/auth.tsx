import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Přihlášení a registrace — Trading Academy CZ" },
      {
        name: "description",
        content: "Přihlaste se nebo si vytvořte účet a ukládejte si pokrok, poznámky a lekce.",
      },
      { property: "og:title", content: "Přihlášení — Trading Academy CZ" },
      { property: "og:description", content: "Vytvořte si účet a sledujte svůj pokrok v lekcích." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/prehled", replace: true });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Účet vytvořen. Potvrďte prosím e-mail v doručené poště.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/prehled", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Něco se nepovedlo");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Přihlášení přes Google selhalo");
    }
  }

  async function forgot() {
    if (!email) return toast.error("Nejdřív vyplňte e-mail.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Poslali jsme vám odkaz pro obnovu hesla.");
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold">
          {mode === "login" ? "Přihlášení" : "Registrace"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ukládejte si pokrok, poznámky a oblíbené lekce.
        </p>

        <form onSubmit={submit} className="surface mt-8 space-y-4 p-6">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Jméno</Label>
              <Input
                id="name"
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jak vám máme říkat"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "login" ? "Přihlásit se" : "Vytvořit účet"}
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={google}>
            Pokračovat přes Google
          </Button>
          <div className="flex items-center justify-between pt-2 text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Nemám účet" : "Už mám účet"}
            </button>
            {mode === "login" && (
              <button type="button" className="text-primary hover:underline" onClick={forgot}>
                Zapomenuté heslo
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/kurzy" className="hover:text-foreground">
            Pokračovat bez přihlášení
          </Link>
        </p>
      </div>
    </SiteLayout>
  );
}
