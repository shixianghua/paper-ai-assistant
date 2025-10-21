export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'generate' | 'rewrite';
  status: 'draft' | 'completed';
  metadata: {
    wordCount?: number;
    similarity?: number;
    topic?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRequest {
  topic: string;
  keywords: string[];
  wordCount: number;
  subject?: string;
}

export interface RewriteRequest {
  text: string;
}

export interface SimilarityResult {
  similarity: number;
  highlightedText: Array<{
    text: string;
    isHighlight: boolean;
  }>;
}

export interface RewriteSuggestion {
  original: string;
  suggestions: string[];
}

export interface HistoryItem {
  id: string;
  userId: string;
  action: string;
  documentId?: string;
  timestamp: string;
  metadata: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
