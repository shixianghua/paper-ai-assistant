import { Link } from 'react-router-dom';
import { FileText, RefreshCw, Shield, Zap } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            智能论文生成与降重平台
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            借助先进的AI技术，快速生成高质量学术论文，智能降重改写，让写作更简单高效
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              立即开始
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-white text-primary-600 rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors duration-200"
            >
              登录账号
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          核心功能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <FileText className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">智能论文生成</h3>
            <p className="text-gray-600">
              输入主题和关键词，AI自动生成结构完整、逻辑清晰的论文内容
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <RefreshCw className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">智能降重改写</h3>
            <p className="text-gray-600">
              自动检测高相似度内容，提供多种改写方案，有效降低重复率
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <Zap className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">快速高效</h3>
            <p className="text-gray-600">
              秒级响应速度，大幅提升写作效率，节省宝贵时间
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">安全可靠</h3>
            <p className="text-gray-600">
              数据加密存储，隐私保护完善，使用更放心
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            使用流程
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">注册账号</h3>
              <p className="text-gray-600">
                快速注册，立即开始使用AI助手
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">选择功能</h3>
              <p className="text-gray-600">
                论文生成或智能降重，满足不同需求
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">导出使用</h3>
              <p className="text-gray-600">
                支持Word、PDF格式，方便下载使用
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            加入我们，让AI助力您的学术写作
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            免费注册
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
