import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, LogOut, User } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">论文AI助手</span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/generate"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  论文生成
                </Link>
                <Link
                  to="/rewrite"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  智能降重
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                  登录
                </Link>
                <Link to="/register" className="btn-primary">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
