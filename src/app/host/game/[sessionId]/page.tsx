import HostGameClient from "@/components/HostGameClient";
import { getServerSession, extractPinFromId } from "@/lib/gameServerStore";

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ quizId?: string; pin?: string }>;
};

export default async function HostGamePage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { quizId, pin: searchPin } = await searchParams;

  const session = getServerSession(sessionId);
  const derivedPin = searchPin || session?.pin || extractPinFromId(sessionId) || "";

  return (
    <main className="flex flex-1 flex-col">
      <HostGameClient
        sessionId={sessionId}
        quizId={quizId ?? session?.quizId ?? ""}
        pin={derivedPin}
      />
    </main>
  );
}
