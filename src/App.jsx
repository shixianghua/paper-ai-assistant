import { useEffect } from "react"
import { HashRouter, Route, Routes } from "react-router-dom"
import { ToastHost } from "./components/Chrome"
import { importKeyFromUrl } from "./lib/deepseek"
import Home from "./pages/Home"
import Workspace from "./pages/Workspace"

export default function App() {
  // 支持用带参数的网址一键导入 DeepSeek Key（只写入本机浏览器，随后从地址栏抹去）
  useEffect(() => {
    importKeyFromUrl()
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workspace" element={<Workspace />} />
      </Routes>
      <ToastHost />
    </HashRouter>
  )
}
