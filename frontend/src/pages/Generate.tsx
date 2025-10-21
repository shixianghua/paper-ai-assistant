import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { documentService } from '../services/documentService';
import { GenerateRequest } from '../types';
import { FileText, Download, Save, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface GenerateForm extends GenerateRequest {
  keywordsText: string;
}

const Generate = () => {
  const [outline, setOutline] = useState('');
  const [content, setContent] = useState('');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<GenerateForm>();

  const onGenerateOutline = async (data: GenerateForm) => {
    try {
      setIsGeneratingOutline(true);
      setError('');
      const keywords = data.keywordsText.split(/[,，\s]+/).filter(k => k.trim());
      const result = await documentService.generateOutline({
        topic: data.topic,
        keywords,
        wordCount: data.wordCount,
        subject: data.subject,
      });
      setOutline(result.outline);
      setSuccess('大纲生成成功！请检查并编辑大纲');
    } catch (err: any) {
      setError(err.response?.data?.message || '生成大纲失败，请稍后重试');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const onGenerateContent = async (data: GenerateForm) => {
    if (!outline) {
      setError('请先生成论文大纲');
      return;
    }

    try {
      setIsGeneratingContent(true);
      setError('');
      const result = await documentService.generateContent({
        outline,
        topic: data.topic,
      });
      setContent(result.content);
      setSuccess('内容生成成功！');
    } catch (err: any) {
      setError(err.response?.data?.message || '生成内容失败，请稍后重试');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const onSave = async (data: GenerateForm) => {
    if (!content) {
      setError('请先生成论文内容');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await documentService.savePaper({
        title: data.topic,
        content,
        metadata: {
          topic: data.topic,
          wordCount: content.replace(/<[^>]*>/g, '').length,
        },
      });
      setSuccess('论文保存成功！');
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="mr-3 h-8 w-8 text-primary-600" />
          AI论文生成
        </h1>
        <p className="mt-2 text-gray-600">输入论文信息，AI将帮您生成完整的论文内容</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Input Form */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">论文信息</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  论文主题 *
                </label>
                <input
                  type="text"
                  {...register('topic', { required: '请输入论文主题' })}
                  className="input-field"
                  placeholder="例如: 人工智能在教育领域的应用研究"
                />
                {errors.topic && (
                  <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关键词 *
                </label>
                <input
                  type="text"
                  {...register('keywordsText', { required: '请输入关键词' })}
                  className="input-field"
                  placeholder="用逗号或空格分隔，例如: 人工智能, 教育, 机器学习"
                />
                {errors.keywordsText && (
                  <p className="mt-1 text-sm text-red-600">{errors.keywordsText.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  字数要求 *
                </label>
                <input
                  type="number"
                  {...register('wordCount', {
                    required: '请输入字数要求',
                    min: { value: 1000, message: '至少需要1000字' },
                  })}
                  className="input-field"
                  placeholder="例如: 5000"
                />
                {errors.wordCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.wordCount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学科领域
                </label>
                <input
                  type="text"
                  {...register('subject')}
                  className="input-field"
                  placeholder="例如: 计算机科学"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit(onGenerateOutline)}
                disabled={isGeneratingOutline}
                className="w-full btn-primary"
              >
                {isGeneratingOutline ? (
                  <>
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  '生成大纲'
                )}
              </button>
            </form>
          </div>

          {/* Outline Editor */}
          {outline && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">论文大纲</h2>
              <textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                className="input-field min-h-[300px] font-mono text-sm"
                placeholder="编辑论文大纲..."
              />
              <button
                type="button"
                onClick={handleSubmit(onGenerateContent)}
                disabled={isGeneratingContent}
                className="w-full btn-primary mt-4"
              >
                {isGeneratingContent ? (
                  <>
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    生成内容中...
                  </>
                ) : (
                  '生成论文内容'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Content Editor */}
        <div className="space-y-6">
          {content && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">论文内容</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit(onSave)}
                    disabled={isSaving}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? '保存中...' : '保存'}</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="h-4 w-4" />
                    <span>导出</span>
                  </button>
                </div>
              </div>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                className="bg-white"
                style={{ height: '600px', marginBottom: '50px' }}
              />
            </div>
          )}

          {!content && (
            <div className="card text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">请先在左侧填写信息并生成论文</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate;
