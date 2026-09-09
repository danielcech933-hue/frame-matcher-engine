import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "./instrumenty";

export const Route = createFileRoute("/styly")({
  head: () => ({
    meta: [
      { title: "Obchodní styly — scalping, intraday, swing, investování" },
      {
        name: "description",
        content:
          "Porovnání obchodních stylů podle časového horizontu a nároků: scalping, intradenní obchodování, swing trading a dlouhodobé investování.",
      },
      { property: "og:title", content: "Obchodní styly — Trading Academy CZ" },
      { property: "og:description", content: "Který styl obchodování sedí vaší povaze a času." },
    ],
  }),
  component: () => <CategoryPage kind="styl" title="Obchodní styly" />,
});
