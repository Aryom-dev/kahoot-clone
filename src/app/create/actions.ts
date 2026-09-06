"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function saveQuiz(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quizId = (formData.get("quizId") as string | null)?.trim();
  const title = ((formData.get("title") as string | null) ?? "").trim();
  const questionsRaw = formData.get("questions") as string | null;

  if (!title) {
    redirect("/create?error=" + encodeURIComponent("El título es requerido"));
  }

  let questions: unknown = [];
  try {
    questions = questionsRaw ? JSON.parse(questionsRaw) : [];
  } catch (e) {
    console.log("Error parsing questions JSON:", e);
    redirect("/create?error=" + encodeURIComponent("Formato de preguntas inválido"));
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    redirect("/create?error=" + encodeURIComponent("Añade al menos una pregunta"));
  }

  const userId = user?.id ?? null;

  const payload: Record<string, unknown> = {
    title,
    questions,
  };

  if (quizId && isValidUuid(quizId)) {
    payload["id"] = quizId;
  }
  if (userId) {
    payload["user_id"] = userId;
  }

  // Intento de guardado/upsert en Supabase
  const { error } = await supabase.from("quizzes").upsert(payload);

  if (error) {
    console.log("Error saving quiz in Supabase:", error);
    // Reintento omitiendo user_id si hay restricciones RLS
    delete payload["user_id"];
    const { error: retryError } = await supabase.from("quizzes").upsert(payload);

    if (retryError) {
      console.log("Retry upsert error:", retryError);
      redirect("/create?error=" + encodeURIComponent(retryError.message));
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) {
    console.log("Error deleting quiz:", error);
  }
  revalidatePath("/dashboard");
}
