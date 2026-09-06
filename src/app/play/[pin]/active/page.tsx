import PlayerRoomClient from "@/components/PlayerRoomClient";

type ActivePageProps = {
  params: Promise<{ pin: string }>;
  searchParams: Promise<{ nickname?: string; playerId?: string; sessionId?: string }>;
};

export default async function ActiveGamePage({
  params,
  searchParams,
}: ActivePageProps) {
  const { pin } = await params;
  const { nickname, playerId, sessionId } = await searchParams;

  const playerName = nickname ? decodeURIComponent(nickname) : "Jugador";

  return (
    <main className="flex flex-1 flex-col">
      <PlayerRoomClient
        pin={pin}
        nickname={playerName}
        playerId={playerId ?? ""}
        sessionId={sessionId ?? ""}
        initialStatus="active"
      />
    </main>
  );
}
