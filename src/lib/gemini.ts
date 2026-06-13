import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

/**
 * Lazily configures and returns the GoogleGenAI instance.
 * Fails fast with a clear message if the key is missing.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured. Please register it under Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/**
 * Checks if the application is running in offline demo mode.
 */
export function checkIsDemoMode(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return true;
  const cleanKey = apiKey.trim().replace(/['"]/g, '');
  return cleanKey === "" || cleanKey === "dummy_key" || cleanKey === "MY_GEMINI_API_KEY";
}

/**
 * Mock stream generator for offline demo mode
 */
async function* mockStreamResponse(
  documentName: string,
  documentText: string,
  userMessage: string,
  analysisStyle: 'formal' | 'conversational',
  lang: 'id' | 'en'
) {
  const isEn = lang === 'en';
  const label = isEn ? 'Suggested Next Questions:' : 'Saran Pertanyaan Berikutnya:';
  
  const intro = isEn 
    ? `### 💡 Offline Demo Mode\n\nI am EduMentor running in **Offline Demo Mode** because a valid \`GEMINI_API_KEY\` was not detected in your local environment. Here is a simulated analysis based on your document:\n\n`
    : `### 💡 Mode Demo Offline\n\nSaya adalah EduMentor yang berjalan dalam **Mode Demo Offline** karena \`GEMINI_API_KEY\` yang valid tidak terdeteksi di lingkungan lokal Anda. Berikut adalah simulasi analisis berdasarkan dokumen Anda:\n\n`;

  let customAnswer = "";
  const query = userMessage.toLowerCase();
  
  if (isEn) {
    if (query.includes("hello") || query.includes("hi")) {
      customAnswer = "Hello! How can I assist you with your learning goals today?";
    } else if (query.includes("summary") || query.includes("summarize")) {
      customAnswer = `Here is a summary of the document **"${documentName}"**:\n- **Type**: Document content parsing\n- **Size**: Contains ${documentText ? documentText.length : 0} characters of text.\n- **Content preview**: *"${documentText ? documentText.substring(0, 150) + "..." : "No text extracted yet."}"*\n\nTo get a full detailed AI-powered summary, please configure a valid \`GEMINI_API_KEY\`.`;
    } else {
      customAnswer = `I received your question: *"${userMessage}"*.\n\nSince we are in offline demo mode, I can verify that your document **"${documentName}"** is loaded. It has a text length of **${documentText ? documentText.length : 0} characters**. Once you connect your Gemini API Key, I will analyze the full content to answer this query precisely.`;
    }
  } else {
    if (query.includes("halo") || query.includes("hai") || query.includes("pagi") || query.includes("siang")) {
      customAnswer = "Halo! Ada yang bisa saya bantu untuk menemani proses belajar Anda hari ini?";
    } else if (query.includes("ringkas") || query.includes("rangkum") || query.includes("singkat")) {
      customAnswer = `Berikut adalah ringkasan singkat dari dokumen **"${documentName}"**:\n- **Tipe**: Analisis dokumen\n- **Ukuran**: Memiliki ${documentText ? documentText.length : 0} karakter teks.\n- **Pratinjau konten**: *"${documentText ? documentText.substring(0, 150) + "..." : "Belum ada teks yang diekstraksi."}"*\n\nUntuk mendapatkan rangkuman lengkap bertenaga AI, silakan konfigurasikan kunci \`GEMINI_API_KEY\` Anda.`;
    } else {
      customAnswer = `Saya menerima pertanyaan Anda: *"${userMessage}"*.\n\nDalam mode demo offline ini, saya dapat mengonfirmasi bahwa dokumen **"${documentName}"** telah dimuat dengan panjang teks **${documentText ? documentText.length : 0} karakter**. Setelah Anda memasukkan Kunci API Gemini, saya akan menganalisis konten secara menyeluruh untuk menjawab pertanyaan Anda dengan tepat.`;
    }
  }

  const suggestions = isEn
    ? `\n\n**${label}**\n1. How do I configure my Gemini API key in local .env?\n2. What formats of documents are supported?`
    : `\n\n**${label}**\n1. Bagaimana cara mengatur Kunci API Gemini saya di file lokal .env?\n2. Format dokumen apa saja yang didukung oleh EduMentor?`;

  const fullText = intro + customAnswer + suggestions;
  
  const chunkSize = 6;
  for (let i = 0; i < fullText.length; i += chunkSize) {
    yield { text: fullText.substring(i, i + chunkSize) };
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

/**
 * Initiates content streaming from Gemini incorporating document text, message history,
 * and the chosen analysis style.
 */
export async function streamDocumentAnalysis(
  documentName: string,
  documentText: string,
  userMessage: string,
  history: ChatMessage[],
  analysisStyle: 'formal' | 'conversational',
  lang: 'id' | 'en' = 'id'
) {
  if (checkIsDemoMode()) {
    return mockStreamResponse(documentName, documentText, userMessage, analysisStyle, lang);
  }

  const ai = getGeminiClient();

  const styleDescription = analysisStyle === 'formal'
    ? 'highly professional, analytical, objective, and structured. Use formal vocabulary, academic terms if applicable, and present facts clearly with headings and sub-headings.'
    : 'conversational, warm, empathetic, and easily understandable. Explain hard concepts using simple analogies and keep the language interactive as an educational mentor.';

  const langPrompt = lang === 'en'
    ? 'You MUST speak and respond entirely in ENGLISH. Every paragraph, list, header, and suggestions section must be written in elegant English.'
    : 'You MUST speak and respond entirely in INDONESIAN (Bahasa Indonesia). Every paragraph, list, header, and suggestions section must be written in correct, natural, and friendly Bahasa Indonesia.';

  const suggestionsLabel = lang === 'en' ? 'Suggested Next Questions:' : 'Saran Pertanyaan Berikutnya:';

  const systemPrompt = `You are EduMentor: Document Intelligence, an advanced AI learning and analysis assistant.
Your goal is to explain and answer queries about the document titled "${documentName}" using the provided parsed text contents or structured representations below.

--- START DOCUMENT CONTENT: ${documentName} ---
${documentText}
--- END DOCUMENT CONTENT ---

Rules for your response:
1. Always base your analysis and explanations strictly on the facts, metadata, or metrics inside the document content. 
2. If the user asks something that cannot be resolved solely using the document data, state that clearly, but proceed to give a helpful explanation combining general teaching with warnings about what is/isn't in the actual document context. If the document is a blank generic chat (has empty text or is titled "Obrolan Baru"), directly act as a friendly and helpful general educational mentor, tutor, and assistant to answer their questions beautifully and guide them without referring to any document limitations.
3. Language constraint: ${langPrompt}
4. Analysis Style: Your response tone MUST be ${styleDescription}
5. Markdown Output: Always use Markdown. Ensure that your responses are elegantly formatted with list bullets, bold headers, and proper paragraphs.
6. Chart Rendering: 
   - ONLY produce or render a graph, table visualization, or chart if the user explicitly asks for a graph, table, visualization, or chart in their message. DO NOT automatically produce visual charts or graphs for general numerical or quantitative lists unless the user has specifically and explicitly requested it in their prompt.
   - If (and only if) they explicitly ask for a chart/graph/visualization, output a raw JSON block at the very end of your response text.
   - The JSON block MUST be inside a standard markdown \`\`\`json ... \`\`\` code block.
   - The JSON dictionary MUST strictly have this structure so the frontend can render it automatically:
     {
       "chartData": [
         { "label": "Apples", "value": 50 },
         { "label": "Oranges", "value": 30 }
       ],
       "chartType": "bar", // Can be "line", "bar", or "pie"
       "xAxisKey": "label",
       "yAxisKey": "value",
       "title": "Stock Levels"
     }
   - NEVER inject any text inside the code block other than the raw JSON itself.
7. Interactive Follow-ups & Suggestions (CRITICAL):
   - Every response MUST conclude with a highly interactive and friendly section containing 2 to 3 tailored follow-up question suggestions with the header: **${suggestionsLabel}** to keep the interaction dynamic, helpful, and engaging as an expert educational mentor.
`;

  // Map the chat history to the Gemini parameter format.
  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts[0].text }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  return ai.models.generateContentStream({
    model: 'gemini-3.5-flash',
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
    },
  });
}

/**
 * Translates a list of chat messages (both user questions and model replies) to the target language (INDONESIAN or ENGLISH).
 * Preserves the exact message roles, IDs, timestamps, and charts JSON structure.
 */
export async function translateHistory(
  messages: ChatMessage[],
  targetLang: 'id' | 'en'
): Promise<ChatMessage[]> {
  if (checkIsDemoMode()) {
    return messages;
  }

  const ai = getGeminiClient();
  
  const targetLanguageDisplay = targetLang === 'en' ? 'ENGLISH' : 'INDONESIAN (Bahasa Indonesia)';
  
  const prompt = `You are a professional high-fidelity educational translator built into EduMentor.
Your task is to translate the following JSON array of ChatMessage items into ${targetLanguageDisplay}.

Rules:
1. Translate all text values inside the "parts" arrays (e.g. the descriptions, explanations, bullet points, headers, suggestions) into correct, elegant, and natural target language.
2. If there are code blocks or code syntax or formulas, maintain them intact.
3. If an AI message contains a JSON chart block (e.g. \`\`\`json { ... } \`\`\`), do NOT translate structural key names or the JSON keys themselves, but ONLY translate labels (like "label" text values or "title") if appropriate, or keep them as is if they are technical indicators. The formatting must remain valid JSON.
4. Keep the "role" property EXACTLY the same ("user" or "model").
5. Do NOT change "id" or "timestamp" fields. Keep them exactly as they are.
6. The output must be EXACTLY a valid JSON array of ChatMessage items, matching the length and fields of the input array. Do NOT wrap the JSON array inside markdown \`\`\`json ... \`\`\`, return only the raw JSON array string.

JSON to translate:
${JSON.stringify(messages, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Translation returned an empty response.");
  }

  try {
    const parsed = JSON.parse(responseText.trim());
    if (Array.isArray(parsed)) {
      return parsed as ChatMessage[];
    }
    throw new Error("Result is not an array");
  } catch (err) {
    console.error("Failed to parse translated result:", responseText, err);
    throw new Error("Failed to parse translated conversation history.");
  }
}


