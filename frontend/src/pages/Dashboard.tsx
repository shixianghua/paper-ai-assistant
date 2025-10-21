import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { documentService } from '../services/documentService';
import { Document } from '../types';
import { FileText, Trash2, Download, Calendar, User } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载文档失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个文档吗？')) return;

    try {
      await documentService.deleteDocument(id);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === 'generate' ? '论文生成' : '智能降重';
  };

  const getStatusLabel = (status: string) => {
    return status === 'completed' ? '已完成' : '草稿';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">用户中心</h1>
        <p className="mt-2 text-gray-600">管理您的论文和历史记录</p>
      </div>

      {/* User Info Card */}
      <div className="card mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-primary-100 rounded-full p-4">
            <User className="h-12 w-12 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user?.username}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-primary-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900">{documents.length}</div>
            <div className="text-gray-600 text-sm">总文档数</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <Calendar className="mx-auto h-10 w-10 text-green-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              {documents.filter(d => d.status === 'completed').length}
            </div>
            <div className="text-gray-600 text-sm">已完成</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-yellow-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              {documents.filter(d => d.status === 'draft').length}
            </div>
            <div className="text-gray-600 text-sm">草稿</div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">我的文档</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500">还没有文档，快去创建吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {doc.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(doc.createdAt)}
                      </span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded">
                        {getDocumentTypeLabel(doc.type)}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        doc.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusLabel(doc.status)}
                      </span>
                      {doc.metadata.wordCount && (
                        <span>{doc.metadata.wordCount} 字</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="下载"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
