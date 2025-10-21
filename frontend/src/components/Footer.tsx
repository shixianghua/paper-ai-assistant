const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">关于我们</h3>
            <p className="text-gray-300 text-sm">
              论文AI助手是一款智能化的学术写作工具，致力于为用户提供高质量的论文生成和降重服务。
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">功能特色</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• AI智能论文生成</li>
              <li>• 智能降重改写</li>
              <li>• 相似度检测</li>
              <li>• 多格式导出</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">联系我们</h3>
            <p className="text-gray-300 text-sm">
              邮箱: support@paper-ai.com<br />
              技术支持: tech@paper-ai.com
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; 2024 论文AI助手. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
