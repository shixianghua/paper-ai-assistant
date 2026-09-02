import { HashRouter, Route, Routes } from "react-router-dom"
import { ToastHost } from "./components/Chrome"
import Home from "./pages/Home"
import Workspace from "./pages/Workspace"

export default function App() {
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
