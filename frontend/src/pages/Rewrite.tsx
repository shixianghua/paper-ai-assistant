import { useState } from 'react';
import { documentService } from '../services/documentService';
import { RefreshCw, AlertCircle, Check, Loader2 } from 'lucide-react';

const Rewrite = () => {
  const [originalText, setOriginalText] = useState('');
  const [rewrittenText, setRewrittenText] = useState('');
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckSimilarity = async () => {
    if (!originalText.trim()) {
      setError('请输入需要检测的文本');
      return;
    }

    try {
      setIsChecking(true);
      setError('');
      const result = await documentService.checkSimilarity({ text: originalText });
      setSimilarity(result.similarity);
      setSuccess('相似度检测完成！');
    } catch (err: any) {
      setError(err.response?.data?.message || '检测失败，请稍后重试');
    } finally {
      setIsChecking(false);
    }
  };

  const handleRewrite = async () => {
    if (!originalText.trim()) {
      setError('请输入需要改写的文本');
      return;
    }

    try {
      setIsRewriting(true);
      setError('');
      const result = await documentService.rewriteText({ text: originalText });
      setRewrittenText(result.rewrittenText);
      setSuccess('文本改写完成！');
    } catch (err: any) {
      setError(err.response?.data?.message || '改写失败，请稍后重试');
    } finally {
      setIsRewriting(false);
    }
  };

  const getSimilarityColor = (sim: number) => {
    if (sim < 30) return 'text-green-600';
    if (sim < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSimilarityBg = (sim: number) => {
    if (sim < 30) return 'bg-green-50 border-green-200';
    if (sim < 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <RefreshCw className="mr-3 h-8 w-8 text-primary-600" />
          智能降重改写
        </h1>
        <p className="mt-2 text-gray-600">检测文本相似度并进行智能改写</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Text */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">原文</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCheckSimilarity}
                disabled={isChecking || !originalText.trim()}
                className="btn-secondary text-sm"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="inline mr-1 h-4 w-4 animate-spin" />
                    检测中...
                  </>
                ) : (
                  '检测相似度'
                )}
              </button>
              <button
                onClick={handleRewrite}
                disabled={isRewriting || !originalText.trim()}
                className="btn-primary text-sm"
              >
                {isRewriting ? (
                  <>
                    <Loader2 className="inline mr-1 h-4 w-4 animate-spin" />
                    改写中...
                  </>
                ) : (
                  '智能改写'
                )}
              </button>
            </div>
          </div>

          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            className="input-field min-h-[400px] resize-none"
            placeholder="在此输入或粘贴需要降重的文本..."
          />

          <div className="mt-4 text-sm text-gray-500">
            字数: {originalText.length}
          </div>

          {similarity !== null && (
            <div className={`mt-4 p-4 rounded-lg border ${getSimilarityBg(similarity)}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">相似度:</span>
                <span className={`text-2xl font-bold ${getSimilarityColor(similarity)}`}>
                  {similarity}%
                </span>
              </div>
              <div className="mt-2 text-sm">
                {similarity < 30 && '相似度较低，通过率高'}
                {similarity >= 30 && similarity < 60 && '相似度中等，建议继续降重'}
                {similarity >= 60 && '相似度较高，需要重点改写'}
              </div>
            </div>
          )}
        </div>

        {/* Rewritten Text */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">改写结果</h2>
            {rewrittenText && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rewrittenText);
                  setSuccess('已复制到剪贴板');
                }}
                className="btn-secondary text-sm"
              >
                复制文本
              </button>
            )}
          </div>

          {rewrittenText ? (
            <>
              <textarea
                value={rewrittenText}
                onChange={(e) => setRewrittenText(e.target.value)}
                className="input-field min-h-[400px] resize-none"
                placeholder="改写结果将显示在此处..."
              />
              <div className="mt-4 text-sm text-gray-500">
                字数: {rewrittenText.length}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <RefreshCw className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500">点击"智能改写"按钮生成改写结果</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 card bg-blue-50">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">使用提示</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 相似度低于30%通常被认为是安全的</li>
          <li>• 建议对高相似度部分进行多次改写</li>
          <li>• 改写后可以再次检测相似度，确保达到要求</li>
          <li>• 保持原文的核心观点和逻辑结构</li>
        </ul>
      </div>
    </div>
  );
};

export default Rewrite;
