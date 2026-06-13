import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { parsePDF } from "./src/lib/parsers/pdf.ts";
import { parseDocx } from "./src/lib/parsers/docx.ts";
import { parseExcel } from "./src/lib/parsers/excel.ts";
import {
  getAllDocuments,
  upsertDocument,
  getDocumentById,
  deleteDocumentById,
  DocumentMetadata
} from "./src/lib/local_db.ts";
import { streamDocumentAnalysis, translateHistory } from "./src/lib/gemini.ts";

/**
 * Configure Multer memory storage and upload limits
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // max limit: 10MB limit handled dynamically in route
  }
});

const app = express();

// Support parsing JSON bodies
app.use(express.json({ limit: '10mb' }));

// API Route: Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API Route: Read all documents (excluding heavy extractedText to optimize payload)
app.get("/api/documents", (req, res) => {
  try {
    const documents = getAllDocuments();
    // Map and omit extractedText for optimization, unless requested
    const result = documents.map(({ id, name, type, size, status, createdAt }) => ({
      id,
      name,
      type,
      size,
      status,
      createdAt
    }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve documents." });
  }
});

// API Route: Retrieve single document details
app.get("/api/documents/:id", (req, res) => {
  try {
    const id = req.params.id;
    const doc = getDocumentById(id);
    if (!doc) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve document." });
  }
});

// API Route: Delete a document
app.delete("/api/documents/:id", (req, res) => {
  try {
    const id = req.params.id;
    const success = deleteDocumentById(id);
    if (success) {
      res.json({ success: true, message: "Document deleted successfully." });
    } else {
      res.status(404).json({ error: "Document not found or already deleted." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete document." });
  }
});

// API Route: Detach file from a document and reset it to general chat
app.post("/api/documents/detach/:id", (req, res) => {
  try {
    const id = req.params.id;
    const doc = getDocumentById(id);
    if (!doc) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    doc.name = "Obrolan Umum";
    doc.type = "application/json";
    doc.size = 0;
    doc.extractedText = "";
    doc.status = "processed";
    upsertDocument(doc);
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to detach document." });
  }
});

// API Route: Create a new blank chat session/document
app.post("/api/documents/new", (req, res) => {
  try {
    const { name = "Obrolan Baru" } = req.body;
    const documentId = "doc_" + Math.random().toString(36).substring(2, 11);
    const newDoc: DocumentMetadata = {
      id: documentId,
      name: name,
      type: "application/json",
      size: 0,
      status: 'processed',
      extractedText: '',
      createdAt: new Date().toISOString()
    };
    upsertDocument(newDoc);
    res.json(newDoc);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create new chat session." });
  }
});

// API Route: Upload & Parse Document Pipeline
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file provided in the upload request." });
      return;
    }

    const { originalname, mimetype, size, buffer } = file;

    // 1. Validate File Types
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "text/csv"
    ];

    if (!allowedMimeTypes.includes(mimetype)) {
      res.status(400).json({
        error: `Unsupported file type: ${mimetype}. Only PDF, DOCX, XLSX, and CSV are allowed.`
      });
      return;
    }

    // 2. Validate File Sizes strictly on Server
    const isExcelOrCsv = mimetype === "text/csv" || mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const maxLimit = isExcelOrCsv ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // Excel/CSV: 5MB, PDF/DOCX: 10MB

    if (size > maxLimit) {
      res.status(400).json({
        error: `File size exceeds the allowable limit. (Maximum for PDF/DOCX: 10MB, Excel/CSV: 5MB)`
      });
      return;
    }

    // Check if we should update an existing document/session instead of creating a new one
    const targetDocId = req.query.documentId as string | undefined;
    let newDoc: DocumentMetadata;

    if (targetDocId) {
      const existing = getDocumentById(targetDocId);
      if (existing) {
        newDoc = {
          ...existing,
          name: originalname,
          type: mimetype,
          size: size,
          status: 'processing',
          extractedText: ''
        };
      } else {
        const documentId = "doc_" + Math.random().toString(36).substring(2, 11);
        newDoc = {
          id: documentId,
          name: originalname,
          type: mimetype,
          size: size,
          status: 'processing',
          extractedText: '',
          createdAt: new Date().toISOString()
        };
      }
    } else {
      const documentId = "doc_" + Math.random().toString(36).substring(2, 11);
      newDoc = {
        id: documentId,
        name: originalname,
        type: mimetype,
        size: size,
        status: 'processing',
        extractedText: '',
        createdAt: new Date().toISOString()
      };
    }

    upsertDocument(newDoc);

    // 3. Document Parsing Pipeline
    let parsedText = '';
    try {
      if (mimetype === "application/pdf") {
        parsedText = await parsePDF(buffer);
      } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        parsedText = await parseDocx(buffer);
      } else {
        // Excel or CSV parsed into sheet results
        const excelResult = parseExcel(buffer);
        // Return structures in string format for Gemini digestion as requested
        parsedText = JSON.stringify(excelResult, null, 2);
      }

      // Update with processed status and text
      newDoc.extractedText = parsedText;
      newDoc.status = 'processed';
      upsertDocument(newDoc);

      res.json({
        documentId: newDoc.id,
        name: newDoc.name,
        status: 'processed'
      });

    } catch (parseError: any) {
      console.error("Failed parsing file contents:", parseError);
      newDoc.status = 'error';
      newDoc.extractedText = `Error encountered during ingestion-parsing: ${parseError.message || parseError}`;
      upsertDocument(newDoc);
      res.status(422).json({
        error: `File parsing failed: ${parseError.message || parseError}`
      });
    }

  } catch (err: any) {
    console.error("General upload pipeline exception:", err);
    res.status(500).json({ error: err.message || "Server upload validation failed." });
  }
});

// API Route: Translate previous chat message logs on configuration language toggle
app.post("/api/chat/translate", async (req, res) => {
  try {
    const { messages = [], targetLang = 'id' } = req.body;
    if (messages.length === 0) {
      res.json([]);
      return;
    }
    const translated = await translateHistory(messages, targetLang);
    res.json(translated);
  } catch (error: any) {
    console.error("Translation route failed:", error);
    res.status(500).json({ error: error.message || "Failed to translate chat history." });
  }
});

// API Route: Stream Q&A chat responses backed by Gemini
app.post("/api/chat", async (req, res) => {
  try {
    const { documentId, message, history = [], analysisStyle = 'formal', lang = 'id' } = req.body;

    if (!documentId) {
      res.status(400).json({ error: "Missing documentId parameter." });
      return;
    }
    if (!message) {
      res.status(400).json({ error: "Missing query message." });
      return;
    }

    const activeDoc = getDocumentById(documentId);
    if (!activeDoc) {
      res.status(404).json({ error: "The selected document was not found." });
      return;
    }

    if (activeDoc.status !== "processed") {
      res.status(400).json({ error: "The selected document is still processing or had a parsing error." });
      return;
    }

    // Configure streamer headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await streamDocumentAnalysis(
        activeDoc.name,
        activeDoc.extractedText,
        message,
        history,
        analysisStyle,
        lang
      );

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }
      res.end();
    } catch (geminiError: any) {
      console.error("Gemini invocation error:", geminiError);
      const errStr = JSON.stringify(geminiError) + " " + (geminiError.message || "") + " " + String(geminiError);
      
      let friendlyMessage = "Terjadi kesalahan pada sistem kecerdasan AI. Silakan coba sesaat lagi.";
      if (errStr.includes("429") || errStr.toLowerCase().includes("quota") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.toLowerCase().includes("limit")) {
        friendlyMessage = "Batas kuota gratis (Rate Limit / Quota Exceeded) untuk API Gemini telah terlampaui saat ini. Mohon tunggu sekitar 15-30 detik sebelum mengajukan pertanyaan baru.";
      } else if (errStr.includes("apiKey") || errStr.includes("API_KEY") || errStr.includes("not configured")) {
        friendlyMessage = "Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi dengan benar di server. Silakan hubungi administrator untuk mengatur Secrets.";
      } else {
        friendlyMessage = `Terjadi kesalahan saat berkomunikasi dengan AI: ${geminiError.message || geminiError}`;
      }

      if (!res.headersSent) {
        // If headers haven't been sent yet, send a proper JSON error response
        res.status(429).json({ error: friendlyMessage });
      } else {
        // Otherwise, write it directly to the open stream representation
        res.write(`\n\n**System Notice:** ${friendlyMessage}`);
        res.end();
      }
    }

  } catch (err: any) {
    console.error("General chat api error:", err);
    res.status(500).json({ error: err.message || "Failed to process chat demand." });
  }
});

// Configure local server listener & Vite middleware
if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`EduMentor server listening on: http://localhost:${PORT}`);
    });
  });
} else if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduMentor server listening on: http://localhost:${PORT}`);
  });
}

export default app;
