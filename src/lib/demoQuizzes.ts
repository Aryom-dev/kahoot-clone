export type GameOption = {
  id: string;
  text: string;
};

export type ContextSlide = {
  title: string;
  text: string;
  imageUrl?: string;
};

export type Question = {
  id: string;
  text: string;
  timeLimit: 10 | 20 | 30;
  questionType?: "multiple_choice" | "reorder";
  imageUrl?: string;
  contextSlide?: ContextSlide;
  options: [GameOption, GameOption, GameOption, GameOption];
  correctIndex: number;
  correctOrder?: [number, number, number, number];
};

export type DemoQuiz = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  questions: Question[];
};

export const DEMO_QUIZ_ID = "00000000-0000-4000-8000-000000000001";

export const DATABASE_DEMO_QUIZ: DemoQuiz = {
  id: DEMO_QUIZ_ID,
  title: "Fundamentos de Bases de Datos (SQL, NoSQL & Modos Interactivos)",
  description: "Quiz técnico de prueba que incluye todas las modalidades de respuesta: opción múltiple, ordenamiento de secuencia (reordenar), textos largos con scroll dinámico y diapositivas de contexto.",
  created_at: new Date().toISOString(),
  questions: [
    {
      id: "db-q1",
      text: "¿Qué propiedad del acrónimo ACID garantiza que una transacción se ejecute completamente o no se ejecute en absoluto?",
      timeLimit: 20,
      questionType: "multiple_choice",
      imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=800&auto=format&fit=crop",
      contextSlide: {
        title: "Propiedades ACID en Bases de Datos Relacionales",
        text: "En las bases de datos SQL tradicionales, las propiedades ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad) garantizan la fiabilidad absoluta de las transacciones financieras y críticas.",
        imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=800&auto=format&fit=crop",
      },
      options: [
        { id: "db-q1-opt0", text: "Atomicidad (All or Nothing)" },
        { id: "db-q1-opt1", text: "Aislamiento (Isolation)" },
        { id: "db-q1-opt2", text: "Algoritmicidad (Algorithmic)" },
        { id: "db-q1-opt3", text: "Asincronía (Asynchrony)" },
      ],
      correctIndex: 0,
    },
    {
      id: "db-q2",
      text: "🧩 REORDENAR: Ordena las etapas lógicas de procesamiento de una consulta SELECT en un motor SQL",
      timeLimit: 30,
      questionType: "reorder",
      contextSlide: {
        title: "Orden Lógico de Ejecución de SQL",
        text: "A diferencia del orden en que se escribe una consulta (SELECT... FROM... WHERE...), el motor de SQL procesa primero el origen de datos (FROM & JOIN), luego los filtros (WHERE), después los agrupamientos (GROUP BY) y finalmente la proyección de campos y ordenamiento (SELECT & ORDER BY).",
      },
      options: [
        { id: "db-q2-opt0", text: "1º FROM & JOIN (Identificar tablas de origen)" },
        { id: "db-q2-opt1", text: "2º WHERE (Filtrar filas iniciales de entrada)" },
        { id: "db-q2-opt2", text: "3º GROUP BY & HAVING (Agrupar y filtrar datos)" },
        { id: "db-q2-opt3", text: "4º SELECT & ORDER BY (Proyectar campos y ordenar resultado)" },
      ],
      correctIndex: 0,
      correctOrder: [0, 1, 2, 3],
    },
    {
      id: "db-q3",
      text: "Según el Teorema CAP de Eric Brewer para bases de datos distribuidas y no relacionales, ¿cuál es la limitación fundamental insuperable cuando ocurre una partición de red (Network Partition) entre los nodos del clúster?",
      timeLimit: 30,
      questionType: "multiple_choice",
      contextSlide: {
        title: "Teorema CAP en Sistemas Distribuidos",
        text: "El Teorema CAP demuestra que en presencia de una partición de red inevitable en un sistema distribuido, es físicamente imposible garantizar simultáneamente Consistencia (C) y Disponibilidad (A). El sistema debe elegir CP o AP.",
      },
      options: [
        { id: "db-q3-opt0", text: "El sistema debe elegir obligatoriamente entre mantener Consistencia estricta (rechazando escrituras si los nodos no comunican) o mantener Alta Disponibilidad (respondiendo aunque los datos estén temporalmente desactualizados)." },
        { id: "db-q3-opt1", text: "El sistema puede mantener automáticamente la Consistencia y Disponibilidad al 100% simultáneamente si se utiliza un algoritmo de consenso Paxos o Raft con discos SSD en red de fibra óptica." },
        { id: "db-q3-opt2", text: "La base de datos se corrompe irreversiblemente y requiere restaurar un backup físico completo desde almacenamiento en disco duro obligando a reiniciar todos los servidores de la red." },
        { id: "db-q3-opt3", text: "Las particiones de red son completamente imposibles de ocurrir si se utiliza una base de datos NoSQL orientada a documentos formateados en JSON/BSON con esquemas flexibles." },
      ],
      correctIndex: 0,
    },
    {
      id: "db-q4",
      text: "🧩 REORDENAR: Ordena los pasos del ciclo de vida de una transacción SQL segura utilizando el registro de escritura anticipada (Write-Ahead Logging / WAL)",
      timeLimit: 30,
      questionType: "reorder",
      contextSlide: {
        title: "Ciclo de Vida de Transacción con WAL",
        text: "Para garantizar la durabilidad sin degradar el rendimiento, los motores SQL modernos escriben primero las modificaciones en un log secuencial en disco (WAL) antes de confirmar el COMMIT a los clientes.",
      },
      options: [
        { id: "db-q4-opt0", text: "1º BEGIN TRANSACTION (Inicio de la transacción)" },
        { id: "db-q4-opt1", text: "2º MEMORY BUFFER EXECUTION (Modificación de páginas en memoria RAM)" },
        { id: "db-q4-opt2", text: "3º WAL SYNCHRONOUS WRITE (Escritura síncrona en el registro WAL en disco)" },
        { id: "db-q4-opt3", text: "4º COMMIT & CLIENT RESPONSE (Confirmación exitosa enviada a la aplicación)" },
      ],
      correctIndex: 0,
      correctOrder: [0, 1, 2, 3],
    },
    {
      id: "db-q5",
      text: "¿Cuál de los siguientes comandos SQL pertenece a la categoría DDL (Data Definition Language)?",
      timeLimit: 20,
      questionType: "multiple_choice",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
      contextSlide: {
        title: "Sublenguajes SQL: DDL vs DML",
        text: "SQL se divide en comandos DDL (que definen estructuras de tablas e índices) y DML (que manipulan los datos almacenados en las filas existentes).",
        imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
      },
      options: [
        { id: "db-q5-opt0", text: "INSERT INTO usuarios (nombre) VALUES ('Ana')" },
        { id: "db-q5-opt1", text: "UPDATE usuarios SET activo = true WHERE id = 1" },
        { id: "db-q5-opt2", text: "CREATE TABLE usuarios (id INT PRIMARY KEY, nombre VARCHAR(100))" },
        { id: "db-q5-opt3", text: "SELECT * FROM usuarios WHERE activo = true" },
      ],
      correctIndex: 2,
    },
    {
      id: "db-q6",
      text: "¿Qué función principal cumple un ÍNDICE (Index B-Tree) en una tabla relacional de gran escala?",
      timeLimit: 20,
      questionType: "multiple_choice",
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
      contextSlide: {
        title: "Optimización de Consultas e Índices B-Tree",
        text: "Los índices organizan punteros en estructuras de árbol balanceado para evitar escaneos completos de tabla (Full Table Scan) en millones de filas de datos.",
        imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
      },
      options: [
        { id: "db-q6-opt0", text: "Acelerar búsquedas SELECT a costa de utilizar espacio extra en disco y requerir tiempo adicional en operaciones INSERT/UPDATE/DELETE" },
        { id: "db-q6-opt1", text: "Encriptar automáticamente los campos de contraseña y datos personales sensibles almacenados dentro de la tabla relacional" },
        { id: "db-q6-opt2", text: "Eliminar registros duplicados de la tabla de forma totalmente transparente sin necesidad de ejecutar un comando DISTINCT" },
        { id: "db-q6-opt3", text: "Comprimir los archivos físicos de la base de datos en disco duro para reducir el consumo de memoria principal RAM del servidor" },
      ],
      correctIndex: 0,
    },
  ],
};

// Helper para asegurar que el quiz predeterminado existe y se actualiza en localStorage
export function seedDemoQuizzes(): void {
  if (typeof window === "undefined") return;
  try {
    const existingRaw = localStorage.getItem("monolith_quizzes");
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    if (Array.isArray(existing)) {
      // Reemplazar o anteponer siempre DATABASE_DEMO_QUIZ con sus últimas mejoras
      const filtered = existing.filter((q: { id: string }) => q.id !== DATABASE_DEMO_QUIZ.id);
      localStorage.setItem("monolith_quizzes", JSON.stringify([DATABASE_DEMO_QUIZ, ...filtered]));
    } else {
      localStorage.setItem("monolith_quizzes", JSON.stringify([DATABASE_DEMO_QUIZ]));
    }
  } catch (e) {
    console.log("Error seeding demo quizzes:", e);
  }
}
