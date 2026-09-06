import PlayerRoomClient from "@/components/PlayerRoomClient";

type WaitingPageProps = {
  params: Promise<{ pin: string }>;
  searchParams: Promise<{
    nickname?: string;
    playerId?: string;
    sessionId?: string;
    avatarSeed?: string;
  }>;
};

export default async function WaitingPage({
  params,
  searchParams,
}: WaitingPageProps) {
  const { pin } = await params;
  const { nickname, playerId, sessionId, avatarSeed } = await searchParams;
  const playerName = nickname ? decodeURIComponent(nickname) : "Jugador";
  const playerAvatarSeed = avatarSeed ? decodeURIComponent(avatarSeed) : undefined;

  return (
    <main className="flex flex-1 flex-col">
      <PlayerRoomClient
        pin={pin}
        nickname={playerName}
        playerId={playerId ?? ""}
        sessionId={sessionId ?? ""}
        avatarSeed={playerAvatarSeed}
        initialStatus="lobby"
      />
    </main>
  );
}
