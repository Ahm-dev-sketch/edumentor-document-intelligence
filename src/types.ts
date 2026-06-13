export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'processing' | 'processed' | 'error';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: string;
}

export type AnalysisStyle = 'formal' | 'conversational';
