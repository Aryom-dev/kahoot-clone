import { create } from "zustand";

export type QuestionOption = {
  id: string;
  text: string;
};

export type ContextSlide = {
  title: string;
  text: string;
  imageUrl?: string;
};

export type GameQuestion = {
  id: string;
  text: string;
  timeLimit: number;
  questionType?: "multiple_choice" | "reorder";
  imageUrl?: string;
  contextSlide?: ContextSlide;
  options: [QuestionOption, QuestionOption, QuestionOption, QuestionOption];
  correctIndex: number;
  correctOrder?: [number, number, number, number];
};

export type PlayerScore = {
  id: string;
  nickname: string;
  score: number;
  streak: number;
};

interface GameState {
  // Common
  pin: string;
  sessionId: string;
  quizTitle: string;
  questions: GameQuestion[];
  currentQuestionIndex: number;
  gameStatus: "lobby" | "active" | "question" | "results" | "leaderboard" | "ended";

  // Player state
  playerId: string | null;
  nickname: string | null;
  selectedOptionIndex: number | null;
  hasAnswered: boolean;
  score: number;
  streak: number;
  lastPointsEarned: number;
  isLastCorrect: boolean | null;

  // Host state
  players: PlayerScore[];
  answerCounts: [number, number, number, number];

  // Actions
  setGameSession: (session: {
    pin: string;
    sessionId: string;
    quizTitle: string;
    questions: GameQuestion[];
  }) => void;
  setGameStatus: (status: GameState["gameStatus"]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setPlayerInfo: (info: { playerId: string; nickname: string }) => void;
  selectOption: (index: number, isCorrect: boolean, points: number) => void;
  setPlayers: (players: PlayerScore[]) => void;
  updateAnswerCounts: (counts: [number, number, number, number]) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  pin: "",
  sessionId: "",
  quizTitle: "",
  questions: [],
  currentQuestionIndex: 0,
  gameStatus: "lobby",

  playerId: null,
  nickname: null,
  selectedOptionIndex: null,
  hasAnswered: false,
  score: 0,
  streak: 0,
  lastPointsEarned: 0,
  isLastCorrect: null,

  players: [],
  answerCounts: [0, 0, 0, 0],

  setGameSession: ({ pin, sessionId, quizTitle, questions }) =>
    set({ pin, sessionId, quizTitle, questions }),

  setGameStatus: (gameStatus) => set({ gameStatus }),

  setCurrentQuestionIndex: (currentQuestionIndex) =>
    set({
      currentQuestionIndex,
      selectedOptionIndex: null,
      hasAnswered: false,
      isLastCorrect: null,
      answerCounts: [0, 0, 0, 0],
    }),

  setPlayerInfo: ({ playerId, nickname }) => set({ playerId, nickname }),

  selectOption: (index, isCorrect, points) =>
    set((state) => ({
      selectedOptionIndex: index,
      hasAnswered: true,
      isLastCorrect: isCorrect,
      lastPointsEarned: points,
      score: state.score + points,
      streak: isCorrect ? state.streak + 1 : 0,
    })),

  setPlayers: (players) => set({ players }),

  updateAnswerCounts: (answerCounts) => set({ answerCounts }),

  resetGame: () =>
    set({
      pin: "",
      sessionId: "",
      quizTitle: "",
      questions: [],
      currentQuestionIndex: 0,
      gameStatus: "lobby",
      playerId: null,
      nickname: null,
      selectedOptionIndex: null,
      hasAnswered: false,
      score: 0,
      streak: 0,
      lastPointsEarned: 0,
      isLastCorrect: null,
      players: [],
      answerCounts: [0, 0, 0, 0],
    }),
}));
