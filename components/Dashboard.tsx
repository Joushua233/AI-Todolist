import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode, Task, AgendaItem, TranscriptItem } from '../types';
import { api } from '../src/lib/api';

interface DashboardProps {
  onLogout: () => void;
  toggleTheme: () => void;
  currentTheme: ThemeMode;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, toggleTheme, currentTheme }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 点击外部时关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // 计时器 Effect
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        // 这里通常会将音频数据块发送到后端或 RK3576 服务器
        console.log('Audio chunk captured:', e.data.size);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      setStartTime(new Date());
      setRecordingTime(0);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请检查浏览器权限设置或确保在 HTTPS/Localhost 环境下运行。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // 重要：停止所有轨道以释放麦克风权限
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStartTime = (date: Date) => {
    // 格式化输出: "今天 上午 10:42" 或 "2024/10/24 下午 02:30"
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: true }); // e.g. 上午 10:42

    if (isToday) {
      return `今天 ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      return `${dateStr} ${timeStr}`;
    }
  };

  // 转录文本状态
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null);
  const [tempTranscriptText, setTempTranscriptText] = useState('');

  // 组件挂载时加载转录文本
  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const data = await api.getTranscripts();
        setTranscript(data || []);
      } catch (err) {
        console.error("Failed to load transcripts:", err);
      }
    };
    fetchTranscripts();
  }, []);

  // 日程状态
  const [agendaView, setAgendaView] = useState<'day' | 'week' | 'month'>('day');
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
  const [tempAgendaItem, setTempAgendaItem] = useState<Partial<AgendaItem>>({});

  // 日期选择状态
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 辅助函数: 格式化头部显示的日期文本
  const getHeaderDateText = () => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth() + 1;
    const d = selectedDate.getDate();
    const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][selectedDate.getDay()];

    if (agendaView === 'day') {
      return `${y}年${m}月${d}日 · ${weekDay}`;
    }
    if (agendaView === 'week') {
      // Calculate Monday
      const day = selectedDate.getDay();
      const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(selectedDate);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      // Calculate Week Number
      const startOfYear = new Date(y, 0, 1);
      const pastDays = Math.floor((monday.getTime() - startOfYear.getTime()) / 86400000);
      const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);

      return `第 ${weekNum} 周 · ${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getMonth() + 1}月${sunday.getDate()}日`;
    }
    if (agendaView === 'month') {
      return `${y}年${m}月`;
    }
  };

  // 辅助函数: 获取输入框的值 (YYYY-MM-DD 或 YYYY-MM)
  const getInputValue = () => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return agendaView === 'month' ? `${y}-${m}` : `${y}-${m}-${d}`;
  };

  // 处理函数: 日期输入框改变
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const parts = e.target.value.split('-').map(Number);
    if (agendaView === 'month') {
      setSelectedDate(new Date(parts[0], parts[1] - 1, 1));
    } else {
      setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
    }
  };

  // 当视图或所选日期改变时加载日程数据
  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const data = await api.getAgendas();
        setAgenda(data || []);
      } catch (err) {
        console.error("Failed to load agendas:", err);
      }
    };
    fetchAgendas();
  }, [agendaView, selectedDate]);

  // 待办事项状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempTaskTitle, setTempTaskTitle] = useState('');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // 组件挂载时加载待办事项
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await api.getTasks();
        setTasks(data || []);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }
    };
    fetchTasks();
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动转录文本
  useEffect(() => {
    if (scrollRef.current && isRecording && !editingTranscriptId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isRecording, editingTranscriptId]);

  // 转录文本编辑处理函数
  const handleEditTranscript = (item: TranscriptItem) => {
    setEditingTranscriptId(item.id);
    setTempTranscriptText(item.text);
    // Note: We don't necessarily need to stop recording to edit, but it avoids conflicts
    // keeping current behavior
    if (isRecording) stopRecording();
  };

  const handleSaveTranscript = async () => {
    if (editingTranscriptId) {
      try {
        await api.updateTranscript(editingTranscriptId, { text: tempTranscriptText });
        setTranscript(prev => prev.map(t =>
          t.id === editingTranscriptId ? { ...t, text: tempTranscriptText } : t
        ));
      } catch (err) {
        console.error("Failed to save transcript", err);
      }
      setEditingTranscriptId(null);
    }
  };

  const handleDeleteTranscript = async (id: string) => {
    try {
      await api.deleteTranscript(id);
      setTranscript(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete transcript", err);
    }
  };

  // 日程编辑处理函数
  const handleEditAgenda = (item: AgendaItem) => {
    setEditingAgendaId(item.id);
    setTempAgendaItem({ ...item });
  };

  const formatDisplayTime = (isoDate: string, view: 'day' | 'week' | 'month') => {
    const date = new Date(isoDate);
    if (view === 'day') {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (view === 'week') {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const day = weekdays[date.getDay()];
      const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${day} ${time}`;
    } else {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    }
  };

  const handleSaveAgenda = async () => {
    if (editingAgendaId && tempAgendaItem.title && tempAgendaItem.fullIsoDate) {
      try {
        // If it's a new item (has our temp prefix) we create, otherwise update
        let savedItem;
        if (editingAgendaId.startsWith('new_')) {
          const { id, ...createData } = tempAgendaItem;
          // Generate actual DB id or let backend handle if it ignores id. Here we let backend generate it by omitting.
          savedItem = await api.createAgenda(createData);
        } else {
          savedItem = await api.updateAgenda(editingAgendaId, tempAgendaItem);
        }

        setAgenda(prev => {
          let updatedList;
          if (editingAgendaId.startsWith('new_')) {
            updatedList = prev.map(a => a.id === editingAgendaId ? { ...savedItem, time: formatDisplayTime(savedItem.fullIsoDate, agendaView) } : a);
          } else {
            updatedList = prev.map(a =>
              a.id === editingAgendaId ? {
                ...a,
                ...savedItem,
                time: formatDisplayTime(savedItem.fullIsoDate, agendaView) // Update display string based on view
              } as AgendaItem : a
            );
          }

          // Sort by fullIsoDate
          return updatedList.sort((a, b) =>
            new Date(a.fullIsoDate).getTime() - new Date(b.fullIsoDate).getTime()
          );
        });
      } catch (err) {
        console.error("Failed to save agenda", err);
      }
      setEditingAgendaId(null);
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    try {
      if (!id.startsWith('new_')) {
        await api.deleteAgenda(id);
      }
      setAgenda(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete agenda", err);
    }
  };

  const handleAddAgenda = () => {
    const newId = `new_${Date.now()}`;
    const now = new Date();
    // Default to next hour
    now.setHours(now.getHours() + 1, 0, 0, 0);
    // Align with selected date logic roughly if user is viewing a different day?
    // For simplicity, default to "Now" or "Selected Date 09:00"
    if (agendaView !== 'day') {
      // If not in day view, set to morning of selected date
      now.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      now.setHours(9, 0, 0, 0);
    }

    // Format to local ISO string (YYYY-MM-DDTHH:mm)
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const time = now.toTimeString().slice(0, 5);
    const isoString = `${y}-${m}-${d}T${time}`;

    const newItem: AgendaItem = {
      id: newId,
      fullIsoDate: isoString,
      time: formatDisplayTime(isoString, agendaView),
      title: '新日程',
      description: '请输入描述',
      status: 'future'
    };

    // Add, then sort immediately
    setAgenda(prev => [...prev, newItem].sort((a, b) =>
      new Date(a.fullIsoDate).getTime() - new Date(b.fullIsoDate).getTime()
    ));
    handleEditAgenda(newItem);
  };

  // 待办事项处理函数
  const handleAddTask = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      try {
        const newTaskData = {
          title: newTaskTitle,
          completed: false,
          type: 'work',
          source: 'manual'
        };
        const savedTask = await api.createTask(newTaskData);
        setTasks(prev => [savedTask, ...prev]);
        setNewTaskTitle('');
      } catch (err) {
        console.error("Failed to create task", err);
      }
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await api.updateTask(id, { completed: !task.completed });
      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTempTaskTitle(task.title);
  };

  const saveTaskEdit = async () => {
    if (editingTaskId && tempTaskTitle.trim()) {
      try {
        const updated = await api.updateTask(editingTaskId, { title: tempTaskTitle });
        setTasks(prev => prev.map(t =>
          t.id === editingTaskId ? { ...t, title: updated.title } : t
        ));
      } catch (err) {
        console.error("Failed to edit task", err);
      }
      setEditingTaskId(null);
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${currentTheme === ThemeMode.DARK ? 'bg-dark-bg text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* 顶部导航 */}
      <header className={`flex items-center justify-between border-b px-6 py-3 z-30 shrink-0 ${currentTheme === ThemeMode.DARK ? 'bg-dark-bg/80 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`size-8 flex items-center justify-center rounded ${currentTheme === ThemeMode.DARK ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-primary/10 text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">graphic_eq</span>
          </div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">智能语音综合仪表板</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${currentTheme === ThemeMode.DARK ? 'bg-white/5 border-white/10 text-emerald-400' : 'bg-green-50 text-green-700 border-green-100'}`}>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>RK3576 设备在线</span>
          </div>

          <div className={`w-px h-6 ${currentTheme === ThemeMode.DARK ? 'bg-white/10' : 'bg-slate-200'}`}></div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${currentTheme === ThemeMode.DARK ? 'hover:bg-white/10 text-yellow-300' : 'hover:bg-gray-100 text-slate-500'}`}>
              <span className="material-symbols-outlined text-xl">{currentTheme === ThemeMode.DARK ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="flex flex-col items-end mr-1">
              <span className={`text-sm font-medium ${currentTheme === ThemeMode.DARK ? 'text-white' : 'text-slate-600'}`}>管理员</span>
              <span className="text-[10px] text-slate-400">admin@voice.hub</span>
            </div>
            <div className="relative" ref={userMenuRef}>
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-9 ring-2 ring-slate-100 cursor-pointer border border-slate-200"
                style={{ backgroundImage: 'url("https://picsum.photos/100/100")' }}
                onClick={() => setShowUserMenu(!showUserMenu)}
              ></div>

              {showUserMenu && (
                <div className={`absolute right-0 top-12 w-48 rounded-xl shadow-xl border py-1 z-50 animate-in fade-in zoom-in-95 duration-200 ${currentTheme === ThemeMode.DARK ? 'bg-dark-surface border-white/10' : 'bg-white border-slate-100'}`}>
                  <div className={`px-4 py-3 border-b ${currentTheme === ThemeMode.DARK ? 'border-white/5' : 'border-slate-50'}`}>
                    <p className={`text-sm font-bold ${currentTheme === ThemeMode.DARK ? 'text-white' : 'text-slate-900'}`}>管理员</p>
                    <p className="text-xs text-slate-500 truncate">admin@voice.hub</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={onLogout}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${currentTheme === ThemeMode.DARK ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <span className="material-symbols-outlined text-lg">switch_account</span>
                      切换账号
                    </button>
                    <button
                      onClick={onLogout}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${currentTheme === ThemeMode.DARK ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">

        {/* 第一列: 语音识别 */}
        <section className="w-[35%] flex flex-col min-w-0 transition-all">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className={`text-base font-bold flex items-center gap-2 ${currentTheme === ThemeMode.DARK ? 'text-slate-200' : 'text-slate-700'}`}>
              <span className={`material-symbols-outlined text-xl ${currentTheme === ThemeMode.DARK && isRecording ? 'text-red-500 animate-pulse' : 'text-primary'}`}>mic_none</span>
              {isRecording ? '正在实时听写' : '语音识别区'}
            </h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${currentTheme === ThemeMode.DARK ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white text-slate-400 border-slate-200'}`}>
              {formatTime(recordingTime)}
            </span>
          </div>

          <div className={`rounded-2xl shadow-sm border flex flex-col flex-1 overflow-hidden relative transition-colors ${currentTheme === ThemeMode.DARK ? 'glass-panel border-white/10' : 'bg-white border-slate-200'}`}>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 text-sm lg:text-base no-scrollbar pb-32">
              <div className={`text-[11px] font-bold uppercase tracking-widest border-b pb-2 mb-4 ${currentTheme === ThemeMode.DARK ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-50'}`}>
                {startTime ? `${formatStartTime(startTime)} 开始转录` : '准备就绪 - 点击麦克风开始'}
              </div>

              {transcript.map((item) => (
                <div key={item.id} className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {editingTranscriptId === item.id ? (
                    <div className={`p-3 rounded-lg border-2 ${currentTheme === ThemeMode.DARK ? 'bg-white/5 border-primary/50' : 'bg-white border-primary/50'} shadow-lg`}>
                      <textarea
                        value={tempTranscriptText}
                        onChange={(e) => setTempTranscriptText(e.target.value)}
                        className={`w-full bg-transparent outline-none resize-none p-1 ${currentTheme === ThemeMode.DARK ? 'text-white' : 'text-slate-800'}`}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-gray-200/20">
                        <button
                          onClick={() => setEditingTranscriptId(null)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-500 transition-colors"
                          title="取消"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                        <button
                          onClick={handleSaveTranscript}
                          className="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 操作按钮 */}
                      <div className={`absolute -right-2 -top-3 hidden group-hover:flex items-center gap-1 p-1 rounded-lg shadow-sm border z-10 ${currentTheme === ThemeMode.DARK ? 'bg-dark-surface border-white/10' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => handleEditTranscript(item)} className="p-1 hover:text-primary transition-colors text-slate-400">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteTranscript(item.id)} className="p-1 hover:text-red-500 transition-colors text-slate-400">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>

                      {item.type === 'text' && (
                        <p className={`leading-relaxed font-normal ${currentTheme === ThemeMode.DARK ? 'text-slate-300 font-light text-lg' : 'text-slate-800'}`}>{item.text}</p>
                      )}
                      {item.type === 'task' && (
                        <div className={`border-l-4 p-3 rounded-r-lg mt-2 ${currentTheme === ThemeMode.DARK ? 'bg-primary/10 border-primary' : 'bg-blue-50/50 border-primary'}`}>
                          <p className={`font-medium ${currentTheme === ThemeMode.DARK ? 'text-white' : 'text-slate-800'}`}>
                            <span className="text-primary font-bold text-xs uppercase tracking-wider mr-2 bg-primary/20 px-1.5 py-0.5 rounded">{item.meta}</span>
                            {item.text}
                          </p>
                        </div>
                      )}
                      {item.type === 'agenda' && (
                        <div className={`border-l-4 p-3 rounded-r-lg mt-2 ${currentTheme === ThemeMode.DARK ? 'bg-amber-500/10 border-amber-500' : 'bg-amber-50/50 border-amber-500'}`}>
                          <p className={`font-medium ${currentTheme === ThemeMode.DARK ? 'text-white' : 'text-slate-800'}`}>
                            <span className="text-amber-500 font-bold text-xs uppercase tracking-wider mr-2 bg-amber-500/20 px-1.5 py-0.5 rounded">{item.meta}</span>
                            {item.text}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {isRecording && !editingTranscriptId && (
                <p className="text-slate-400 italic text-sm animate-pulse">正在倾听并实时转录中...</p>
              )}
            </div>

            {/* 录音波形与控制 */}
            <div className={`p-4 border-t absolute bottom-0 w-full ${currentTheme === ThemeMode.DARK ? 'bg-black/40 border-white/5 backdrop-blur-md' : 'bg-slate-50/90 border-slate-100 backdrop-blur-sm'}`}>
              <div className="h-12 flex items-center justify-center gap-[4px] mb-4 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div key={i}
                    className={`w-1 rounded-full ${isRecording ? 'animate-sound-wave' : 'h-1'} ${currentTheme === ThemeMode.DARK ? 'bg-primary' : 'bg-primary'}`}
                    style={{
                      animationDelay: `${Math.random() * 0.5}s`,
                      height: isRecording ? `${Math.random() * 100}%` : '4px',
                      opacity: isRecording ? Math.random() * 0.5 + 0.5 : 0.2
                    }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleToggleRecording}
                  className={`flex items-center gap-2 font-bold py-2 px-6 rounded-full shadow-lg transition-all text-sm ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'}`}
                >
                  <span className="material-symbols-outlined text-[20px] filled">{isRecording ? 'stop' : 'mic'}</span>
                  <span>{isRecording ? '停止录音' : '开始录音'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 第二列: 待办清单 */}
        <section className="w-[30%] flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className={`text-base font-bold flex items-center gap-2 ${currentTheme === ThemeMode.DARK ? 'text-slate-200' : 'text-slate-700'}`}>
              <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              待办事项
            </h2>
          </div>
          <div className={`rounded-2xl shadow-sm border flex flex-col flex-1 overflow-hidden transition-colors ${currentTheme === ThemeMode.DARK ? 'glass-panel border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`p-3 border-b ${currentTheme === ThemeMode.DARK ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">add</span>
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleAddTask}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${currentTheme === ThemeMode.DARK ? 'bg-white/5 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-800 placeholder-slate-400'}`}
                  placeholder="添加新任务 (回车确认)..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <ul className={`divide-y ${currentTheme === ThemeMode.DARK ? 'divide-white/5' : 'divide-slate-50'}`}>
                {activeTasks.map(task => (
                  <li key={task.id} className={`group flex items-start gap-3 p-4 transition-colors cursor-pointer ${currentTheme === ThemeMode.DARK ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`mt-0.5 size-5 shrink-0 rounded-full border-2 transition-colors flex items-center justify-center ${task.completed ? 'bg-primary border-primary' : 'border-slate-300 hover:border-primary'} ${currentTheme === ThemeMode.DARK && !task.completed ? 'border-slate-600' : ''}`}
                    >
                      {task.completed && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={tempTaskTitle}
                            onChange={(e) => setTempTaskTitle(e.target.value)}
                            className={`flex-1 bg-transparent border-b border-primary/50 outline-none text-sm ${currentTheme === ThemeMode.DARK ? 'text-white' : 'text-slate-900'}`}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveTaskEdit()}
                            onBlur={saveTaskEdit}
                          />
                        </div>
                      ) : (
                        <div className="relative group/text">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm font-medium break-words ${currentTheme === ThemeMode.DARK ? 'text-slate-200' : 'text-slate-700'}`}>{task.title}</p>
                            <div className="hidden group-hover:flex items-center gap-1 pl-2">
                              <button onClick={() => startEditingTask(task)} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                              <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            </div>
                          </div>
                          {task.time && <p className="text-[11px] text-slate-400 mt-0.5">{task.time}</p>}
                          {task.tag && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${task.tagColor === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{task.tag}</span>
                              {task.tag === '工作' && <span className="text-[11px] text-slate-400">下周二</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* 拖拽区域 (目前仅视觉展示) */}
              {activeTasks.length === 0 && currentTheme === ThemeMode.DARK && (
                <div className="m-4 border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary">move_to_inbox</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">暂无待办事项<br />将转录文本拖入创建</p>
                </div>
              )}
            </div>

            <div className={`border-t ${currentTheme === ThemeMode.DARK ? 'border-white/5' : 'border-slate-50'}`}>
              <button
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="w-full px-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-between"
              >
                <span>已完成 ({completedTasks.length})</span>
                <span className={`material-symbols-outlined text-base transition-transform ${showCompletedTasks ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {showCompletedTasks && (
                <ul className={`bg-gray-50/50 dark:bg-black/20 divide-y ${currentTheme === ThemeMode.DARK ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {completedTasks.map(task => (
                    <li key={task.id} className="group flex items-center gap-3 p-3 pl-4 transition-colors opacity-60 hover:opacity-100">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className="size-4 rounded-full border border-slate-300 bg-slate-300 dark:bg-slate-600 dark:border-slate-600 flex items-center justify-center text-white"
                      >
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      </button>
                      <div className="flex-1 flex justify-between items-center">
                        <span className={`text-sm line-through ${currentTheme === ThemeMode.DARK ? 'text-slate-400' : 'text-slate-500'}`}>{task.title}</span>
                        <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* 第三列: 日程表 */}
        <section className="w-[35%] flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className={`text-base font-bold flex items-center gap-2 ${currentTheme === ThemeMode.DARK ? 'text-slate-200' : 'text-slate-700'}`}>
              <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
              总结日程表
            </h2>
            <div className={`flex p-0.5 rounded-lg border ${currentTheme === ThemeMode.DARK ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <button
                onClick={() => setAgendaView('day')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${agendaView === 'day' ? (currentTheme === ThemeMode.DARK ? 'bg-white/10 text-white' : 'bg-primary text-white') : 'text-slate-500 hover:text-slate-700'}`}
              >
                今日
              </button>
              <button
                onClick={() => setAgendaView('week')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${agendaView === 'week' ? (currentTheme === ThemeMode.DARK ? 'bg-white/10 text-white' : 'bg-primary text-white') : 'text-slate-500 hover:text-slate-700'}`}
              >
                周
              </button>
              <button
                onClick={() => setAgendaView('month')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${agendaView === 'month' ? (currentTheme === ThemeMode.DARK ? 'bg-white/10 text-white' : 'bg-primary text-white') : 'text-slate-500 hover:text-slate-700'}`}
              >
                月
              </button>
            </div>
          </div>
          <div className={`rounded-2xl shadow-sm border flex flex-col flex-1 overflow-hidden transition-colors ${currentTheme === ThemeMode.DARK ? 'glass-panel border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b ${currentTheme === ThemeMode.DARK ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer relative">
                  <span className={`text-sm font-bold ${currentTheme === ThemeMode.DARK ? 'text-slate-300' : 'text-slate-600'}`}>
                    {getHeaderDateText()}
                  </span>
                  <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-primary transition-colors">edit_calendar</span>
                  <input
                    type={agendaView === 'month' ? 'month' : 'date'}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    value={getInputValue()}
                    onChange={handleDateChange}
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={handleAddAgenda} className={`size-7 flex items-center justify-center rounded-full transition-colors ${currentTheme === ThemeMode.DARK ? 'hover:bg-white/10 text-primary' : 'hover:bg-slate-200 text-primary'}`} title="添加日程">
                    <span className="material-symbols-outlined text-xl">add</span>
                  </button>
                  <button className={`size-7 flex items-center justify-center rounded-full transition-colors ${currentTheme === ThemeMode.DARK ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button className={`size-7 flex items-center justify-center rounded-full transition-colors ${currentTheme === ThemeMode.DARK ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 relative no-scrollbar">
              <div className={`absolute left-[5.25rem] top-0 bottom-0 w-px ${currentTheme === ThemeMode.DARK ? 'bg-white/10' : 'bg-slate-100'}`}></div>
              <div className="space-y-8 relative">
                {agenda.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className={`w-20 shrink-0 text-[10px] font-bold mt-1 text-right ${item.status === 'current' ? 'text-primary' : 'text-slate-400'}`}>{item.time}</div>
                    <div className="relative flex-1">
                      {/* 时间线圆点 */}
                      <div className={`absolute -left-[17px] top-1.5 size-2.5 rounded-full ring-4 z-10 
                        ${item.status === 'current'
                          ? 'bg-primary ring-primary/20'
                          : currentTheme === ThemeMode.DARK
                            ? 'bg-slate-700 ring-dark-bg border border-white/10'
                            : 'bg-slate-300 border-2 border-white ring-white'
                        }`}>
                      </div>

                      {/* 卡片或编辑表单 */}
                      {editingAgendaId === item.id ? (
                        <div className={`p-3 rounded-xl border w-full relative overflow-hidden transition-all shadow-lg ${currentTheme === ThemeMode.DARK ? 'bg-dark-surface border-primary/50' : 'bg-white border-primary/50'}`}>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="datetime-local"
                                value={tempAgendaItem.fullIsoDate}
                                onChange={e => setTempAgendaItem({ ...tempAgendaItem, fullIsoDate: e.target.value })}
                                className={`w-40 p-1.5 text-xs font-bold rounded border bg-transparent ${currentTheme === ThemeMode.DARK ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}
                              />
                              <input
                                value={tempAgendaItem.title}
                                onChange={e => setTempAgendaItem({ ...tempAgendaItem, title: e.target.value })}
                                className={`flex-1 p-1.5 text-xs font-bold rounded border bg-transparent ${currentTheme === ThemeMode.DARK ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}
                                placeholder="日程标题"
                              />
                            </div>
                            <textarea
                              value={tempAgendaItem.description}
                              onChange={e => setTempAgendaItem({ ...tempAgendaItem, description: e.target.value })}
                              className={`w-full p-1.5 text-xs rounded border bg-transparent resize-none ${currentTheme === ThemeMode.DARK ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}
                              rows={2}
                              placeholder="描述..."
                            />
                            <input
                              value={tempAgendaItem.location || ''}
                              onChange={e => setTempAgendaItem({ ...tempAgendaItem, location: e.target.value })}
                              className={`w-full p-1.5 text-xs rounded border bg-transparent ${currentTheme === ThemeMode.DARK ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'}`}
                              placeholder="地点 (可选)"
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditingAgendaId(null)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded">取消</button>
                            <button onClick={handleSaveAgenda} className="px-3 py-1 bg-primary text-white text-xs rounded shadow-md hover:bg-primary-hover">保存</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-xl border w-full relative overflow-hidden transition-all
                          ${item.status === 'current'
                            ? (currentTheme === ThemeMode.DARK ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' : 'bg-primary/5 border-primary/20')
                            : (currentTheme === ThemeMode.DARK ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 shadow-sm')
                          }`}>

                          {/* 悬浮时的编辑操作 */}
                          <div className={`absolute top-2 right-2 hidden group-hover:flex gap-1 z-20`}>
                            <button onClick={() => handleEditAgenda(item)} className="p-1 rounded-md bg-white/10 hover:bg-white/20 hover:text-primary transition-colors text-slate-400">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => handleDeleteAgenda(item.id)} className="p-1 rounded-md bg-white/10 hover:bg-white/20 hover:text-red-500 transition-colors text-slate-400">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>

                          {item.status === 'current' && <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>}

                          <div className="flex justify-between items-start pr-6">
                            <h4 className={`text-sm font-bold ${item.status === 'current' ? 'text-primary' : (currentTheme === ThemeMode.DARK ? 'text-slate-200' : 'text-slate-700')}`}>{item.title}</h4>
                            {item.status === 'current' && <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-bold">LIVE</span>}
                          </div>

                          <p className={`text-xs mt-1 ${item.status === 'current' ? (currentTheme === ThemeMode.DARK ? 'text-slate-300' : 'text-slate-600') : 'text-slate-500'}`}>{item.description}</p>

                          {item.status === 'current' && (
                            <div className="mt-2 flex gap-1">
                              <span className="size-1.5 rounded-full bg-primary opacity-70 animate-bounce" style={{ animationDelay: '0s' }}></span>
                              <span className="size-1.5 rounded-full bg-primary opacity-40 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                              <span className="size-1.5 rounded-full bg-primary opacity-20 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                          )}

                          {item.location && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                              <span className="text-[11px] text-slate-500">{item.location}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};