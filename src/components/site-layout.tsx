import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LineChart, LogOut, LayoutDashboard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/kurzy", label: "Učební cesty" },
  { to: "/instrumenty", label: "Instrumenty" },
  { to: "/styly", label: "Obchodní styly" },
  { to: "/slovnik", label: "Slovníček" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LineChart className="size-5" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Trading <span className="gold-text">Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="secondary" size="sm">
                <Link to="/prehled">
                  <LayoutDashboard className="size-4" /> Můj přehled
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Odhlásit se">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Přihlásit se</Link>
            </Button>
          )}
        </div>

        <button
          className="inline-flex size-10 items-center justify-center rounded-md border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div className={cn("border-t border-border/70 md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/prehled"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Můj přehled
              </Link>
              <button
                onClick={signOut}
                className="rounded-md px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Odhlásit se
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Přihlásit se
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 py-10">
      <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-foreground">Trading Academy CZ</p>
          <nav className="flex flex-wrap gap-4">
            {NAV.map((i) => (
              <Link key={i.to} to={i.to} className="hover:text-foreground">
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed">
          Obsah má výhradně vzdělávací charakter a není investičním doporučením. Obchodování s
          finančními nástroji je rizikové a můžete přijít o vložené prostředky.
        </p>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
