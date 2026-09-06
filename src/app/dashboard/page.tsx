export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";
import type { QuizCardProps } from "@/components/QuizCard";

function formatCreatedAt(value: string | null | undefined): string {
  if (!value) return "Reciente";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Reciente";
  const formatted = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  return formatted.replace(".", "");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });

  if (user) {
    query = query.or(`user_id.eq.${user.id},owner_id.eq.${user.id}`);
  }

  let { data: quizzesRaw, error: queryError } = await query;

  if (queryError) {
    const retry = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });
    quizzesRaw = retry.data;
    queryError = retry.error;
  }

  const quizzes: QuizCardProps[] = (quizzesRaw ?? []).map(
    (q: Record<string, unknown>) => {
      const rawTitle =
        (q["title"] as string | null) ??
        (q["name"] as string | null) ??
        "Sin título";
      const rawDate =
        (q["created_at"] as string | null) ??
        (q["createdAt"] as string | null) ??
        (q["inserted_at"] as string | null) ??
        null;

      let questionsCount = 0;
      const questionsField = q["questions"];
      const questionsCountField = q["questions_count"];

      if (typeof questionsField === "number") questionsCount = questionsField;
      else if (Array.isArray(questionsField))
        questionsCount = questionsField.length;
      else if (typeof questionsCountField === "number")
        questionsCount = questionsCountField;

      return {
        id: String(q["id"]),
        title: String(rawTitle),
        createdAt: formatCreatedAt(rawDate),
        questions: questionsCount,
      };
    }
  );

  return (
    <DashboardClient
      initialQuizzes={quizzes}
      userEmail={user?.email}
    />
  );
}
