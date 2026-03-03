const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const WebSocket = require('ws');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase 基础配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // 使用 service role key 用于覆盖后端权限，如果不希望如此则使用标准 anon key 依赖客户端传入的 Token 中的 RLS 策略
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 鉴权中间件: 解析来自前端的 JWT Token 验证用户身份
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权：Token 缺失或格式错误' });
  }

  const token = authHeader.split(' ')[1];

  // 使用 Supabase auth.getUser 方法验证 JWT 的合法性
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: '未授权：无效或过期的 Token' });
  }

  // 将用户安全地附加到请求对象上，供后续流程使用
  req.user = user;
  next();
};

// -- API 路由 --

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '后端服务正在运行中' });
});

// === 待办事项 (TASKS) ===

// 获取当前用户的所有待办事项
app.get('/api/tasks', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // 将数据库字段映射回前端需要的驼峰命名格式 (camelCase)
  const formattedData = data.map(item => ({
    ...item,
    tagColor: item.tag_color
  }));
  res.json(formattedData);
});

// 新建待办事项
app.post('/api/tasks', verifyToken, async (req, res) => {
  const { id, title, time, tag, tagColor, completed, type, source } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      id: id, // 允许前端自行提供本地生成的 UUID
      user_id: req.user.id,
      title,
      time,
      tag,
      tag_color: tagColor,
      completed,
      type,
      source
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// 更新待办事项
app.put('/api/tasks/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.tagColor) {
    updates.tag_color = updates.tagColor;
    delete updates.tagColor;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id) // 强制执行安全限制
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// 删除待办事项
app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});


// === 日程 (AGENDAS) ===

// 获取日程
app.get('/api/agendas', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('agendas')
    .select('*')
    .eq('user_id', req.user.id)
    .order('full_iso_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const formattedData = data.map(item => ({
    ...item,
    fullIsoDate: item.full_iso_date
  }));
  res.json(formattedData);
});

// 创建日程
app.post('/api/agendas', verifyToken, async (req, res) => {
  const { id, time, fullIsoDate, title, description, status, location } = req.body;

  const { data, error } = await supabase
    .from('agendas')
    .insert([{
      id,
      user_id: req.user.id,
      time,
      full_iso_date: fullIsoDate,
      title,
      description,
      status,
      location
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// 更新日程
app.put('/api/agendas/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.fullIsoDate) {
    updates.full_iso_date = updates.fullIsoDate;
    delete updates.fullIsoDate;
  }

  const { data, error } = await supabase
    .from('agendas')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// 删除日程
app.delete('/api/agendas/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('agendas')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});


// === 转录文本 (TRANSCRIPTS) ===

app.get('/api/transcripts', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/transcripts', verifyToken, async (req, res) => {
  const { id, text, type, meta } = req.body;

  const { data, error } = await supabase
    .from('transcripts')
    .insert([{
      id,
      user_id: req.user.id,
      text,
      type,
      meta
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put('/api/transcripts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  const { data, error } = await supabase
    .from('transcripts')
    .update({ text })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/transcripts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('transcripts')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// === WebSocket 服务 (接收 RK3576 数据) ===

// 创建 HTTP 服务器
const server = http.createServer(app);

// 初始化 WebSocket 服务实例并挂载到 HTTP 服务器上
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('新设备通过 WebSocket 连接');

  ws.on('message', async (message) => {
    console.log('收到音频/文本数据:', message.toString());

    // 这里做个示例：如果传过来的是JSON `{ "text": "...", "userId": "..." }`
    // 如果 RK3576 只是传原始文本字符串：
    // let textContent = message.toString();
    // 假设使用特定的默认设备账户，或者从消息中获取所有者的 userId

    try {
      const payload = JSON.parse(message);

      // 检查是否有传入文本
      if (payload.text && payload.userId) {
        // 保存转录文本到对应的用户账号下
        const { data, error } = await supabase
          .from('transcripts')
          .insert([{
            user_id: payload.userId, // 这里必须指定该数据属于哪个前端账号
            text: payload.text,
            type: payload.type || 'text',
            meta: payload.meta || 'RK3576'
          }]);

        if (error) {
          console.error('存储转录文本失败:', error);
        } else {
          ws.send(JSON.stringify({ status: 'success', message: '已保存' }));
        }
      }
    } catch (e) {
      // 简单字符串处理的话可以扩展该逻辑
      console.log('非 JSON 消息或处理失败:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('连接已断开');
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => { // 绑定到 局域网/0.0.0.0 以便 RK3576 测试
  console.log(`=== 服务器启动成功 ===
- API 接口运行在: http://localhost:${PORT}
- WebSocket 监听端口在: ws://localhost:${PORT}
(注: RK3576 设备可以直接连接 ws://<服务器局域网IP>:${PORT})`);
});
