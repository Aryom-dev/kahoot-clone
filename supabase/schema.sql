-- Script SQL completo para crear la estructura de tablas y políticas en Supabase
-- Copia este bloque entero y ejecútalo en el Editor SQL de Supabase

-- 1. Tabla de Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Sesiones de Juego
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'lobby',
  current_question_index INT NOT NULL DEFAULT 0,
  question_start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla de Jugadores
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  player_name TEXT,
  score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla de Respuestas
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  option_index INT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_pin ON public.game_sessions(pin);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON public.players(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_player ON public.answers(session_id, player_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS Permisivas
DROP POLICY IF EXISTS "Permitir todo en quizzes" ON public.quizzes;
CREATE POLICY "Permitir todo en quizzes" ON public.quizzes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en game_sessions" ON public.game_sessions;
CREATE POLICY "Permitir todo en game_sessions" ON public.game_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en players" ON public.players;
CREATE POLICY "Permitir todo en players" ON public.players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en answers" ON public.answers;
CREATE POLICY "Permitir todo en answers" ON public.answers FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'game_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'players') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'answers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
  END IF;
END $$;
