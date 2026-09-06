// Servicio para la generación de quizzes basados en Wikipedia (MediaWiki REST API)

export type WikipediaSearchResult = {
  title: string;
  description?: string;
  snippet?: string;
};

export type WikipediaQuizGenerated = {
  title: string;
  imageUrl?: string;
  summaryText: string;
  questions: Array<{
    id: string;
    text: string;
    timeLimit: 10 | 20 | 30;
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
  }>;
};

// 1. Buscar artículos en Wikipedia en español
export async function searchWikipediaArticles(
  query: string
): Promise<WikipediaSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const url = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      query.trim()
    )}&limit=6&namespace=0&format=json&origin=*`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as [string, string[], string[], string[]];
    const titles = data[1] || [];
    const descriptions = data[2] || [];

    return titles.map((title, i) => ({
      title,
      description: descriptions[i] || "Artículo de Wikipedia",
    }));
  } catch (e) {
    console.log("Error al buscar en Wikipedia:", e);
    return [];
  }
}

// 2. Generar quiz completo desde un artículo de Wikipedia
export async function generateQuizFromWikipedia(
  articleTitle: string
): Promise<WikipediaQuizGenerated | null> {
  try {
    const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      articleTitle.trim()
    )}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      title: string;
      extract: string;
      description?: string;
      thumbnail?: { source: string };
      originalimage?: { source: string };
    };

    const title = data.title || articleTitle;
    const extract = data.extract || "";
    const imageUrl = data.originalimage?.source || data.thumbnail?.source || "";

    // Dividir extracto en oraciones relevantes
    const sentences = extract
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 250);

    const questions: WikipediaQuizGenerated["questions"] = [];

    // Generar pregunta 1: ¿De qué trata / Definición principal?
    if (sentences.length > 0) {
      const q1Text = `¿Qué caracteriza o define principalmente a "${title}"?`;
      const correctText = sentences[0];

      questions.push({
        id: `wiki-q1-${Date.now()}`,
        text: q1Text,
        timeLimit: 20,
        imageUrl: imageUrl || undefined,
        contextSlide: {
          title: `Introducción a ${title}`,
          text: extract.slice(0, 300) + (extract.length > 300 ? "..." : ""),
          imageUrl: imageUrl || undefined,
        },
        options: [
          { id: `opt-0`, text: correctText.slice(0, 90) },
          { id: `opt-1`, text: `Es un fenómeno exclusivamente meteorológico del siglo XVIII.` },
          { id: `opt-2`, text: `Es un tratado firmado únicamente entre países de Oceanía.` },
          { id: `opt-3`, text: `Es una teoría descartada por la ciencia moderna.` },
        ],
        correctIndex: 0,
      });
    }

    // Generar pregunta 2: Hechos clave del segundo párrafo/oración
    if (sentences.length > 1) {
      questions.push({
        id: `wiki-q2-${Date.now()}`,
        text: `¿Cuál de los siguientes enunciados sobre ${title} es CORRECTO?`,
        timeLimit: 20,
        imageUrl: imageUrl || undefined,
        contextSlide: {
          title: `Datos clave sobre ${title}`,
          text: sentences.slice(1, 3).join(" "),
          imageUrl: imageUrl || undefined,
        },
        options: [
          { id: `opt-0`, text: `Fue descubierto originalmente en la Antártida en 1999.` },
          { id: `opt-1`, text: sentences[1].slice(0, 90) },
          { id: `opt-2`, text: `No tiene ninguna relación con el ámbito de ${title}.` },
          { id: `opt-3`, text: `Fue prohibido internacionalmente en el año 1850.` },
        ],
        correctIndex: 1,
      });
    }

    // Generar pregunta 3: Pregunta general temática
    questions.push({
      id: `wiki-q3-${Date.now()}`,
      text: `¿En qué categoría o ámbito se clasifica ${title}?`,
      timeLimit: 20,
      imageUrl: imageUrl || undefined,
      options: [
        { id: `opt-0`, text: `Gastronomía tradicional europea.` },
        { id: `opt-1`, text: `Deporte de combate de origen asiático.` },
        { id: `opt-2`, text: data.description || `Tema de estudio y conocimiento relevante.` },
        { id: `opt-3`, text: `Lengua muerta hablada en la antigua Mesopotamia.` },
      ],
      correctIndex: 2,
    });

    return {
      title: `Trivia sobre ${title}`,
      imageUrl: imageUrl || undefined,
      summaryText: extract,
      questions,
    };
  } catch (e) {
    console.log("Error al generar quiz desde Wikipedia:", e);
    return null;
  }
}
