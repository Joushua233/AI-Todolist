import React, { useState } from 'react';
import { ScreenState } from '../types';
import { supabase, isConfigured } from '../src/lib/supabase';

interface LoginScreenProps {
  onNavigate: (screen: ScreenState) => void;
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('admin@voicesync.com');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    !isConfigured ? 'Supabase 未配置，请在环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。' : null
  );



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-lg shadow-gray-200/40 p-8 md:p-10 border border-gray-100">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">keyboard_voice</span>
          </div>
          <h2 className="text-gray-900 text-2xl font-bold tracking-tight">欢迎回来</h2>
          <p className="text-gray-500 text-sm mt-2">请登录您的 VoiceSync 账号</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-sm font-semibold ml-1">账号/邮箱</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-gray-400 text-lg">person</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex w-full rounded-lg text-gray-900 bg-white focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary border border-gray-200 h-12 pl-12 placeholder:text-gray-400 text-sm transition-all"
                placeholder="手机号、邮箱或用户名"
                type="text"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-700 text-sm font-semibold ml-1">密码</label>
            <div className="relative flex items-center group">
              <span className="material-symbols-outlined absolute left-4 text-gray-400 text-lg">lock</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex w-full rounded-lg text-gray-900 bg-white focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary border border-gray-200 h-12 pl-12 pr-12 placeholder:text-gray-400 text-sm transition-all"
                placeholder="请输入密码"
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                className="absolute right-4 text-gray-400 hover:text-primary transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 transition-colors"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-gray-600 text-xs font-medium group-hover:text-primary transition-colors">记住我</span>
            </label>
            <a className="text-primary text-xs font-medium hover:underline" href="#">忘记密码？</a>
          </div>

          <button
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-semibold leading-normal hover:bg-primary-hover transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? '正在登录...' : '登录'}
          </button>
        </form>


        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            还没有账号？
            <button
              onClick={() => onNavigate(ScreenState.REGISTER)}
              className="text-primary font-bold hover:underline ml-1"
            >
              立即注册
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-6 text-gray-400 text-xs font-medium">
        <a className="hover:text-primary transition-colors" href="#">隐私条款</a>
        <a className="hover:text-primary transition-colors" href="#">服务协议</a>
        <a className="hover:text-primary transition-colors" href="#">帮助中心</a>
      </div>
    </div>
  );
};