import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { Dashboard } from './components/Dashboard';
import { ScreenState, ThemeMode } from './types';
import { supabase } from './src/lib/supabase';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(ScreenState.LOGIN);
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [loading, setLoading] = useState(true);

  // Sync theme class with body
  useEffect(() => {
    const html = document.documentElement;
    if (theme === ThemeMode.DARK) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      // 每次打开页面先清除旧 session，强制重新登录
      await supabase.auth.signOut();
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // 只响应当前会话的登录/登出事件
      if (_event === 'SIGNED_IN' && session) {
        setCurrentScreen(ScreenState.DASHBOARD);
      } else if (_event === 'SIGNED_OUT') {
        setCurrentScreen(ScreenState.LOGIN);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigateTo = (screen: ScreenState) => {
    setCurrentScreen(screen);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigateTo(ScreenState.LOGIN);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans ${theme === ThemeMode.DARK ? 'bg-dark-bg text-white' : 'bg-slate-50 text-slate-900'}`}>
      {currentScreen === ScreenState.LOGIN && (
        <LoginScreen
          onNavigate={navigateTo}
          onLogin={() => navigateTo(ScreenState.DASHBOARD)}
        />
      )}

      {currentScreen === ScreenState.REGISTER && (
        <RegisterScreen
          onNavigate={navigateTo}
          onRegister={() => navigateTo(ScreenState.DASHBOARD)}
        />
      )}

      {currentScreen === ScreenState.DASHBOARD && (
        <Dashboard
          onLogout={handleLogout}
          toggleTheme={toggleTheme}
          currentTheme={theme}
        />
      )}
    </div>
  );
};

export default App;
