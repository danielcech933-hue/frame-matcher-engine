import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "./instrumenty";

export const Route = createFileRoute("/styly")({
  head: () => ({
    meta: [
      { title: "Obchodní styly — scalping, day trading, swing trading, investování" },
      {
        name: "description",
        content:
          "Přehled obchodních stylů od dlouhodobého investování po scalping. Porovnejte čas, tempo, riziko a nároky jednotlivých přístupů.",
      },
      { property: "og:title", content: "Obchodní styly — Trading Academy CZ" },
      { property: "og:description", content: "Který obchodní styl sedí vašemu času, povaze a zkušenostem?" },
    ],
  }),
  component: () => <CategoryPage kind="style" title="Obchodní styly" />,
});
