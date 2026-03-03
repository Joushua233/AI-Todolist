-- 针对 VoiceSync-AI 的 Supabase Schema 设置

-- 默认启用行级安全策略 (RLS) 以实现数据隔离。

-- 1. Tasks (待办事项) 表
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    time TEXT,
    tag TEXT,
    tag_color TEXT,
    completed BOOLEAN DEFAULT FALSE,
    type TEXT CHECK (type IN ('work', 'personal', 'urgent')) DEFAULT 'work',
    source TEXT CHECK (source IN ('ai', 'manual')) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 针对 Tasks 表的行级安全性设置
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的待办事项" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以创建自己的待办事项" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的待办事项" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的待办事项" ON public.tasks FOR DELETE USING (auth.uid() = user_id);


-- 2. Agendas (日程) 表
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    full_iso_date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('past', 'current', 'future')) DEFAULT 'future',
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 针对 Agendas 表的行级安全性设置
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的日程" ON public.agendas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以创建自己的日程" ON public.agendas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的日程" ON public.agendas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的日程" ON public.agendas FOR DELETE USING (auth.uid() = user_id);


-- 3. Transcripts (转录文本) 表
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT CHECK (type IN ('text', 'task', 'agenda')) DEFAULT 'text',
    meta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 针对 Transcripts 表的行级安全性设置
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的转录文本" ON public.transcripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以创建自己的转录文本" ON public.transcripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的转录文本" ON public.transcripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的转录文本" ON public.transcripts FOR DELETE USING (auth.uid() = user_id);
