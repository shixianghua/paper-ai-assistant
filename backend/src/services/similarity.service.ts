import logger from '../utils/logger';

export class SimilarityService {
  /**
   * Calculate text similarity using simple algorithm
   * Returns a similarity score between 0-100
   */
  calculateSimilarity(text1: string, text2: string): number {
    try {
      // Simple implementation using Levenshtein distance
      const distance = this.levenshteinDistance(text1, text2);
      const maxLength = Math.max(text1.length, text2.length);
      const similarity = ((maxLength - distance) / maxLength) * 100;
      
      return Math.round(similarity);
    } catch (error) {
      logger.error('Error calculating similarity:', error);
      return 0;
    }
  }

  /**
   * Check text similarity against reference database
   * Returns similarity percentage and highlighted sections
   */
  async checkSimilarity(text: string): Promise<{
    similarity: number;
    highlightedText: Array<{ text: string; isHighlight: boolean }>;
  }> {
    try {
      // Mock implementation - random similarity between 20-80%
      const similarity = Math.floor(Math.random() * 60) + 20;

      // Split text into sentences and randomly mark some as high similarity
      const sentences = text.split(/[。！？\n]+/).filter(s => s.trim());
      const highlightedText = sentences.map((sentence, index) => ({
        text: sentence + '。',
        isHighlight: index % 3 === 0 && similarity > 50, // Mark every 3rd sentence if high similarity
      }));

      logger.info('Similarity check completed:', similarity);
      return { similarity, highlightedText };
    } catch (error) {
      logger.error('Error checking similarity:', error);
      throw new Error('相似度检测失败');
    }
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate cosine similarity between two texts
   */
  private cosineSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    const uniqueWords = new Set([...words1, ...words2]);
    const vector1: number[] = [];
    const vector2: number[] = [];

    uniqueWords.forEach(word => {
      vector1.push(words1.filter(w => w === word).length);
      vector2.push(words2.filter(w => w === word).length);
    });

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return (dotProduct / (magnitude1 * magnitude2)) * 100;
  }
}

export default new SimilarityService();
