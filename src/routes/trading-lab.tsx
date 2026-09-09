import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { TradingTerminal } from "@/components/trading-terminal";

export const Route = createFileRoute("/trading-lab")({
  head: () => ({ meta: [
    { title: "Trading Lab — Trading Academy CZ" },
    { name: "description", content: "Funkční demo terminál inspirovaný MetaTrader 5 pro výuku tradingu." },
  ] }),
  component: () => <SiteLayout><TradingTerminal /></SiteLayout>,
});
