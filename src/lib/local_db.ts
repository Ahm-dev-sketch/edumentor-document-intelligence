import fs from 'fs';
import path from 'path';

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'processing' | 'processed' | 'error';
  extractedText: string;
  createdAt: string;
}

const DB_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'documents.json');

// Initialize database file and folder
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * Reads all documents from the local JSON database.
 */
export function getAllDocuments(): DocumentMetadata[] {
  try {
    initDb();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local db:', error);
    return [];
  }
}

/**
 * Saves all documents to the local JSON database.
 */
export function saveAllDocuments(docs: DocumentMetadata[]) {
  try {
    initDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local db:', error);
  }
}

/**
 * Adds or updates a document metadata record.
 */
export function upsertDocument(doc: DocumentMetadata): DocumentMetadata {
  const docs = getAllDocuments();
  const index = docs.findIndex(d => d.id === doc.id);
  if (index >= 0) {
    docs[index] = doc;
  } else {
    docs.push(doc);
  }
  saveAllDocuments(docs);
  return doc;
}

/**
 * Gets a document by its ID.
 */
export function getDocumentById(id: string): DocumentMetadata | undefined {
  const docs = getAllDocuments();
  return docs.find(d => d.id === id);
}

/**
 * Deletes a document by its ID.
 */
export function deleteDocumentById(id: string): boolean {
  const docs = getAllDocuments();
  const filtered = docs.filter(d => d.id !== id);
  if (filtered.length !== docs.length) {
    saveAllDocuments(filtered);
    return true;
  }
  return false;
}
