import React, { useState } from 'react';
import { DeploymentConfig } from '../types';

interface IoTConfigModalProps {
  onClose: () => void;
}

export const IoTConfigModal: React.FC<IoTConfigModalProps> = ({ onClose }) => {
  const [config, setConfig] = useState<DeploymentConfig>({
    rk3576Id: 'RK-3576-DEV-001',
    cloudProvider: 'alibaba',
    alibabaRegion: 'cn-hangzhou',
    iotPort: 1883,
    serverIp: '47.104.22.10',
    status: 'disconnected'
  });

  const [logs, setLogs] = useState<string[]>([]);

  const handleDeploy = () => {
    setConfig(prev => ({ ...prev, status: 'connecting' }));
    setLogs(['开始连接 RK3576 本地代理...', '正在验证阿里云 ECS 凭证...']);
    
    setTimeout(() => {
      setLogs(prev => [...prev, `正在预约 IoT 端口: ${config.iotPort} (MQTT)...`, '端口保留成功。']);
    }, 1000);

    setTimeout(() => {
      setLogs(prev => [...prev, '上传本地 Agent 模型到边缘设备...', '部署完成！开始同步数据。']);
      setConfig(prev => ({ ...prev, status: 'connected' }));
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface dark:border dark:border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">router</span>
            <h3 className="font-bold text-lg dark:text-white">RK3576 边缘计算部署配置</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 dark:text-gray-300">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase text-gray-500 tracking-wider">本地设备设置</h4>
              
              <div>
                <label className="block text-xs font-medium mb-1.5">NPU 芯片型号</label>
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-white/5 dark:border-white/10">
                  <span className="material-symbols-outlined text-gray-400">memory</span>
                  <input readOnly value="Rockchip RK3576 (6 TOPS)" className="bg-transparent w-full text-sm font-medium outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">设备 ID</label>
                <input 
                  value={config.rk3576Id}
                  onChange={e => setConfig({...config, rk3576Id: e.target.value})}
                  className="w-full p-2 border rounded-lg text-sm dark:bg-white/5 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                 <label className="block text-xs font-medium mb-1.5">Agent 模型路径</label>
                 <div className="text-xs text-gray-500 truncate font-mono bg-gray-100 dark:bg-black/30 p-2 rounded">/usr/local/bin/voice-agent-v2</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase text-gray-500 tracking-wider">云端部署 (Alibaba Cloud)</h4>
              
              <div>
                <label className="block text-xs font-medium mb-1.5">云服务商</label>
                <select 
                  value={config.cloudProvider}
                  onChange={e => setConfig({...config, cloudProvider: e.target.value as any})}
                  className="w-full p-2 border rounded-lg text-sm dark:bg-white/5 dark:border-white/10 outline-none"
                >
                  <option value="alibaba">Alibaba Cloud (阿里云)</option>
                  <option value="aws">AWS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">ECS 服务器 IP</label>
                <input 
                  value={config.serverIp}
                  onChange={e => setConfig({...config, serverIp: e.target.value})}
                  className="w-full p-2 border rounded-lg text-sm dark:bg-white/5 dark:border-white/10 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-primary font-bold">IoT 端口预约 (Socket/MQTT)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={config.iotPort}
                    onChange={e => setConfig({...config, iotPort: parseInt(e.target.value)})}
                    className="w-full p-2 border border-primary/30 bg-primary/5 rounded-lg text-sm dark:bg-primary/10 dark:border-primary/40 outline-none font-bold text-primary"
                  />
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="size-2 bg-green-500 rounded-full"></span>
                    可用
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-black/90 rounded-xl p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto border border-gray-700 shadow-inner">
            <div className="opacity-50 border-b border-white/10 pb-1 mb-2">Deploy Console Output...</div>
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{`> ${log}`}</div>
            ))}
            {config.status === 'connecting' && <div className="animate-pulse">_</div>}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50 dark:bg-white/5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-white/10">取消</button>
          <button 
            onClick={handleDeploy}
            disabled={config.status !== 'disconnected'}
            className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg flex items-center gap-2 transition-all ${config.status === 'connected' ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary-hover'}`}
          >
            {config.status === 'disconnected' && <><span className="material-symbols-outlined text-sm">rocket_launch</span> 立即部署 Agent</>}
            {config.status === 'connecting' && '部署中...'}
            {config.status === 'connected' && <><span className="material-symbols-outlined text-sm">check</span> 部署成功</>}
          </button>
        </div>
      </div>
    </div>
  );
};