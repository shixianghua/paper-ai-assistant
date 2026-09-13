import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { initBackend } from './lib/store.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 启动时探测后端（Byet 主机上的 PHP 接口）；纯静态环境下会自动回退到本地演示模式
initBackend().catch(() => {})
