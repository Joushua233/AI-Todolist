import React, { useState } from 'react';
import { ScreenState } from '../types';
import { supabase, isConfigured } from '../src/lib/supabase';

interface RegisterScreenProps {
  onNavigate: (screen: ScreenState) => void;
  onRegister: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigate, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    !isConfigured ? 'Supabase 未配置，请在环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。' : null
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        alert('注册成功！请检查您的邮箱以确认账号（如果启用了邮箱确认）。');
        onRegister();
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-xl">mic</span>
            </div>
            <span className="text-slate-900 text-xl font-bold tracking-tight">VoiceSync</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">帮助中心</button>
            <div className="h-4 w-px bg-slate-200"></div>
            <button className="flex items-center gap-1 text-sm font-medium text-slate-900">
              <span className="material-symbols-outlined text-lg">language</span>
              简体中文
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2.5">创建账号</h1>
            <p className="text-slate-500">开启高效语音生产力之旅</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignUp}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">用户名</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">person</span>
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all outline-none" 
                  placeholder="请输入您的用户名" 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">电子邮箱</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">mail</span>
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all outline-none" 
                  placeholder="example@domain.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">设置密码</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">lock</span>
                <input 
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all outline-none" 
                  placeholder="至少 8 位字符" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <div className="flex items-center h-5">
                <input className="size-4 rounded border-slate-300 text-primary focus:ring-primary transition-all" id="agreement" type="checkbox" required />
              </div>
              <label className="text-sm text-slate-500 leading-tight" htmlFor="agreement">
                我已阅读并同意 <a className="text-primary font-medium hover:underline" href="#">用户协议</a> 和 <a className="text-primary font-medium hover:underline" href="#">隐私政策</a>
              </label>
            </div>

            <button 
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-lg transition-all transform active:scale-[0.99] shadow-md shadow-primary/20 mt-6 disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
              disabled={loading}
            >
              {loading ? '正在创建...' : '创建账号'}
            </button>
          </form>


          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-500 text-sm">
              已有账号？ 
              <button 
                onClick={() => onNavigate(ScreenState.LOGIN)}
                className="text-primary font-bold hover:text-primary/80 ml-1"
              >
                立即登录
              </button>
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl w-full px-6">
          {[
            { icon: 'bolt', title: '极速识别', desc: '毫秒级语音转文字反馈，提升记录效率' },
            { icon: 'shield_lock', title: '隐私安全', desc: '端到端加密技术，保障您的数据私密性' },
            { icon: 'sync_saved_locally', title: '多端同步', desc: '实时云端同步，跨设备无缝办公体验' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="size-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <h3 className="text-slate-900 font-semibold mb-1.5">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};