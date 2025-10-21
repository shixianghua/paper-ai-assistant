import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { RegisterData } from '../types';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterData & { confirmPassword: string }>();

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const { confirmPassword, ...registerData } = data;
      const result = await authService.register(registerData);
      login(result.user, result.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <UserPlus className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">创建账号</h2>
            <p className="mt-2 text-gray-600">开始使用AI助手</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                {...register('username', {
                  required: '请输入用户名',
                  minLength: {
                    value: 2,
                    message: '用户名至少需要2个字符',
                  },
                })}
                className="input-field"
                placeholder="您的用户名"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: '请输入邮箱地址',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '请输入有效的邮箱地址',
                  },
                })}
                className="input-field"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: '请输入密码',
                  minLength: {
                    value: 6,
                    message: '密码至少需要6个字符',
                  },
                })}
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: '请确认密码',
                })}
                className="input-field"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              已有账号？{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
