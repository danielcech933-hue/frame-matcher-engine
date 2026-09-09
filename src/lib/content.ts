import { supabase } from "@/integrations/supabase/client";

export const LEVELS = [
  { value: "zacatecnik", label: "Začátečník" },
  { value: "stredne_pokrocily", label: "Středně pokročilý" },
  { value: "pokrocily", label: "Pokročilý" },
  { value: "profesional", label: "Profesionál" },
] as const;

export type LevelValue = (typeof LEVELS)[number]["value"];

export function levelLabel(value: string) {
  return LEVELS.find((l) => l.value === value)?.label ?? value;
}

export const lessonsQuery = {
  queryKey: ["lessons"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("slug,title,summary,level,category_slug,style_slug,duration_min,sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data;
  },
};

export const categoriesQuery = {
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data;
  },
};

export const glossaryQuery = {
  queryKey: ["glossary"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("glossary")
      .select("*")
      .order("term", { ascending: true });
    if (error) throw error;
    return data;
  },
};

export function lessonQuery(slug: string) {
  return {
    queryKey: ["lesson", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}

export function quizQuery(slug: string) {
  return {
    queryKey: ["quiz", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("lesson_slug", slug)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  };
}
