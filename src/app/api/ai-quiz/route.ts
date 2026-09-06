import { NextResponse } from "next/server";

export type AIQuizQuestion = {
  id: string;
  text: string;
  timeLimit: 10 | 20 | 30;
  questionType?: "multiple_choice" | "reorder";
  imageUrl?: string;
  contextSlide?: {
    title: string;
    text: string;
    imageUrl?: string;
  };
  options: [
    { id: string; text: string },
    { id: string; text: string },
    { id: string; text: string },
    { id: string; text: string }
  ];
  correctIndex: number;
  correctOrder?: [number, number, number, number];
};

export type AIQuizResponse = {
  title: string;
  imageUrl?: string;
  summaryText?: string;
  questions: AIQuizQuestion[];
};

type WikiSummary = {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: { source: string };
  originalimage?: { source: string };
};

// Fallback smart generator when AI API key is unavailable or fails
function generateSmartFallbackQuiz(
  topic: string,
  wikiData: WikiSummary | null,
  targetCount: number
): AIQuizResponse {
  const title = wikiData?.title || topic;
  const extract = wikiData?.extract || "";
  const imageUrl = wikiData?.originalimage?.source || wikiData?.thumbnail?.source || undefined;

  const sentences = extract
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 220);

  const questions: AIQuizQuestion[] = [];

  const mainExtract = sentences.length > 0 ? sentences[0] : `${title} es un tema fascinante de estudio cultural y científico.`;
  const detailExtract = sentences.length > 1 ? sentences[1] : `Posee características únicas reconocidas a nivel internacional.`;
  const extraExtract = sentences.length > 2 ? sentences[2] : `Ha impactado diversas disciplinas y campos del saber humano.`;

  const questionTemplates = [
    {
      q: `¿Qué es o qué caracteriza principalmente a "${title}"?`,
      correct: mainExtract.slice(0, 90),
      distractors: [
        "Es un instrumento musical de cuerda del siglo XVI.",
        "Es una corriente filosófica exclusivamente escandinava.",
        "Es un tratado astronómico del antiguo Egipto."
      ],
      slideTitle: `¿Qué es ${title}?`,
      slideText: extract.slice(0, 260) || `Introducción a ${title}.`
    },
    {
      q: `¿Cuál de las siguientes afirmaciones sobre ${title} es CORRECTA?`,
      correct: detailExtract.slice(0, 90),
      distractors: [
        "Fue prohibido por decreto global en el siglo XIX.",
        "No tiene ninguna relevancia en la sociedad actual.",
        "Fue descubierto por piratas en las islas Galápagos."
      ],
      slideTitle: `Aspectos Clave de ${title}`,
      slideText: detailExtract
    },
    {
      q: `¿En qué campo o ámbito destaca principalmente ${title}?`,
      correct: wikiData?.description || "Conocimiento, historia y cultura general.",
      distractors: [
        "Gastronomía marina del hemisferio sur.",
        "Deportes invernales de alta montaña.",
        "Fabricación de relojes mecánicos suizos."
      ],
      slideTitle: `Clasificación de ${title}`,
      slideText: `Ámbito general de ${title}.`
    },
    {
      q: `¿Qué impacto o relevancia tiene ${title}?`,
      correct: extraExtract.slice(0, 90),
      distractors: [
        "Ninguno, se declaró obsoleto hace varios siglos.",
        "Sólo se utiliza en laboratorios submarinos.",
        "Es una leyenda urbana sin ningún sustento."
      ],
      slideTitle: `Importancia de ${title}`,
      slideText: extraExtract
    },
    {
      q: `Si alguien investiga sobre ${title}, ¿qué dato encontrará con frecuencia?`,
      correct: `Que ${title} guarda estrecha relación con su contexto histórico y conceptual.`,
      distractors: [
        "Que fue creado accidentalmente al cocinar arroz.",
        "Que requiere temperaturas de cero absoluto para existir.",
        "Que pertenece a un idioma secreto ya extinto."
      ],
      slideTitle: `Dato Curioso sobre ${title}`,
      slideText: `Información complementaria sobre ${title}.`
    },
    {
      q: `¿Cuál es una característica destacada de ${title}?`,
      correct: `Su estructura y desarrollo a lo largo del tiempo.`,
      distractors: [
        "Que cambia de color según la fase lunar.",
        "Que sólo puede estudiarse los fines de semana.",
        "Que fue diseñado exclusivamente para la aviación."
      ],
      slideTitle: `Propiedades de ${title}`,
      slideText: `Detalles analíticos sobre ${title}.`
    },
    {
      q: `¿Por qué es estudiado o mencionado ${title}?`,
      correct: `Por su valor informativo y trascendencia en su área.`,
      distractors: [
        "Por ser la única palabra sin vocales del idioma.",
        "Por haber sido acuñado en un videojuego retro.",
        "Por ser una norma postal obligatoria."
      ],
      slideTitle: `Trascendencia de ${title}`,
      slideText: `Razones de su importancia.`
    },
    {
      q: `¿Qué elemento NO se asocia falsamente con ${title}?`,
      correct: `Su verdadera definición e historia comprobable.`,
      distractors: [
        "Un motor de combustión nuclear casero.",
        "Una raza de perros gigante extinta.",
        "Un satélite militar de los años 50."
      ],
      slideTitle: `Mitos y Realidades`,
      slideText: `Separando hechos de mitos sobre ${title}.`
    },
    {
      q: `En una trivia escolar sobre ${title}, ¿cuál sería la respuesta adecuada?`,
      correct: `La opción fundamentada en hechos reales sobre ${title}.`,
      distractors: [
        "Cualquier respuesta aleatoria de una palabra.",
        "Una fórmula matemática cuadrática.",
        "El nombre de una fruta tropical."
      ],
      slideTitle: `Repaso Final`,
      slideText: `Resumen de conceptos sobre ${title}.`
    },
    {
      q: `Para concluir el estudio sobre ${title}, ¿qué síntesis es la más precisa?`,
      correct: `${title} representa un tema amplio y valioso de aprendizaje.`,
      distractors: [
        "Es simplemente un error gramatical.",
        "Es un tipo de moneda fuera de circulación.",
        "Es un código secreto de radiotransmisión."
      ],
      slideTitle: `Conclusión`,
      slideText: `Síntesis final sobre ${title}.`
    }
  ];

  for (let i = 0; i < Math.min(targetCount, questionTemplates.length); i++) {
    const tmpl = questionTemplates[i];
    const correctIdx = Math.floor(Math.random() * 4);
    const opts: Array<{ id: string; text: string }> = [];

    let distractorCounter = 0;
    for (let o = 0; o < 4; o++) {
      if (o === correctIdx) {
        opts.push({ id: `opt-${i}-${o}`, text: tmpl.correct });
      } else {
        opts.push({
          id: `opt-${i}-${o}`,
          text: tmpl.distractors[distractorCounter] || `Opción alternativa ${o + 1}`
        });
        distractorCounter++;
      }
    }

    questions.push({
      id: `ai-q-${Date.now()}-${i}`,
      text: tmpl.q,
      timeLimit: 20,
      imageUrl,
      contextSlide: {
        title: tmpl.slideTitle,
        text: tmpl.slideText,
        imageUrl,
      },
      options: opts as AIQuizQuestion["options"],
      correctIndex: correctIdx,
    });
  }

  return {
    title: `Trivia IA: ${title}`,
    imageUrl,
    summaryText: extract,
    questions,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topic?: string;
      questionCount?: number;
      wikiTitle?: string;
    };

    const topic = (body.topic || body.wikiTitle || "").trim();
    const count = body.questionCount && body.questionCount > 0 ? body.questionCount : 5;

    if (!topic) {
      return NextResponse.json(
        { error: "Debes proporcionar un tema o título." },
        { status: 400 }
      );
    }

    // 1. Obtener contexto de Wikipedia
    let wikiData: WikiSummary | null = null;
    try {
      const wikiRes = await fetch(
        `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
        { headers: { "User-Agent": "KahootClone/1.0" } }
      );
      if (wikiRes.ok) {
        wikiData = (await wikiRes.json()) as WikiSummary;
      }
    } catch (e) {
      console.log("Aviso: no se pudo obtener Wikipedia summary:", e);
    }

    // 2. Comprobar si existe API key de Gemini para generación con LLM
    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `Eres un experto educador y diseñador de trivias interactivas en español estilo Kahoot.
Crea una trivia sobre "${topic}".
Contexto adicional factual: "${wikiData?.extract || topic}".

Genera EXACTAMENTE ${count} preguntas en español.
Cada pregunta debe ser entretenida, humana y clara.
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "title": "Trivia sobre ${topic}",
  "questions": [
    {
      "text": "Texto de la pregunta...",
      "timeLimit": 20,
      "contextSlide": {
        "title": "Título del contexto",
        "text": "Breve explicación o dato relevante..."
      },
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      "correctIndex": 0
    }
  ]
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const jsonText =
            geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (jsonText) {
            const parsed = JSON.parse(jsonText) as {
              title?: string;
              questions?: Array<{
                text: string;
                timeLimit?: number;
                contextSlide?: { title: string; text: string };
                options: string[];
                correctIndex: number;
              }>;
            };

            if (parsed.questions && Array.isArray(parsed.questions)) {
              const formattedQuestions: AIQuizQuestion[] = parsed.questions.map(
                (q, idx) => ({
                  id: `gemini-q-${Date.now()}-${idx}`,
                  text: q.text,
                  timeLimit: (q.timeLimit as 10 | 20 | 30) || 20,
                  imageUrl:
                    wikiData?.originalimage?.source ||
                    wikiData?.thumbnail?.source ||
                    undefined,
                  contextSlide: q.contextSlide
                    ? {
                        title: q.contextSlide.title,
                        text: q.contextSlide.text,
                        imageUrl:
                          wikiData?.originalimage?.source ||
                          wikiData?.thumbnail?.source ||
                          undefined,
                      }
                    : undefined,
                  options: (q.options.map((optText, oIdx) => ({
                    id: `opt-${idx}-${oIdx}`,
                    text: optText,
                  })) as unknown) as AIQuizQuestion["options"],
                  correctIndex: q.correctIndex ?? 0,
                })
              );

              return NextResponse.json({
                title: parsed.title || `Trivia sobre ${topic}`,
                imageUrl:
                  wikiData?.originalimage?.source ||
                  wikiData?.thumbnail?.source ||
                  undefined,
                summaryText: wikiData?.extract || "",
                questions: formattedQuestions,
              });
            }
          }
        }
      } catch (geminiErr) {
        console.log("Gemini API falló, usando fallback inteligente:", geminiErr);
      }
    }

    // 3. Fallback inteligente
    const fallbackQuiz = generateSmartFallbackQuiz(topic, wikiData, count);
    return NextResponse.json(fallbackQuiz);
  } catch (error) {
    console.error("Error en POST /api/ai-quiz:", error);
    return NextResponse.json(
      { error: "Error al generar la trivia con IA." },
      { status: 500 }
    );
  }
}
