import api from './api';
import { Document, GenerateRequest, RewriteRequest, SimilarityResult, RewriteSuggestion, ApiResponse } from '../types';

export const documentService = {
  // Paper generation
  generateOutline: async (data: GenerateRequest): Promise<{ outline: string }> => {
    const response = await api.post<ApiResponse<{ outline: string }>>('/api/paper/generate-outline', data);
    return response.data.data!;
  },

  generateContent: async (data: { outline: string; topic: string }): Promise<{ content: string }> => {
    const response = await api.post<ApiResponse<{ content: string }>>('/api/paper/generate-content', data);
    return response.data.data!;
  },

  savePaper: async (data: { title: string; content: string; metadata: any }): Promise<Document> => {
    const response = await api.post<ApiResponse<Document>>('/api/paper/save', data);
    return response.data.data!;
  },

  // Rewrite/Similarity
  checkSimilarity: async (data: RewriteRequest): Promise<SimilarityResult> => {
    const response = await api.post<ApiResponse<SimilarityResult>>('/api/rewrite/check-similarity', data);
    return response.data.data!;
  },

  rewriteText: async (data: RewriteRequest): Promise<{ rewrittenText: string }> => {
    const response = await api.post<ApiResponse<{ rewrittenText: string }>>('/api/rewrite/rewrite-text', data);
    return response.data.data!;
  },

  getSuggestions: async (data: { text: string }): Promise<RewriteSuggestion[]> => {
    const response = await api.post<ApiResponse<RewriteSuggestion[]>>('/api/rewrite/suggest', data);
    return response.data.data!;
  },

  // Document management
  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get<ApiResponse<Document[]>>('/api/documents');
    return response.data.data!;
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await api.get<ApiResponse<Document>>(`/api/documents/${id}`);
    return response.data.data!;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/api/documents/${id}`);
  },

  exportDocument: async (id: string, format: 'docx' | 'pdf'): Promise<Blob> => {
    const response = await api.post(`/api/documents/export`, { id, format }, { responseType: 'blob' });
    return response.data;
  },
};
