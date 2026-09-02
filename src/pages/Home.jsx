import { useState } from "react"
import GeneratorPanel from "../components/GeneratorPanel"
import {
  CtaBand,
  DocTypes,
  Ecosystem,
  FaqSection,
  FlowSteps,
  Hero,
  HistorySection,
  MatrixBand,
  Pricing,
} from "../components/Blocks"
import { Footer, LoginModal, Navbar, Reveal, ToastHost } from "../components/Chrome"

export default function Home() {
  const [login, setLogin] = useState(false)
  return (
    <>
      <Navbar onLogin={() => setLogin(true)} />
      <main>
        <Hero />
        <DocTypes />
        <FlowSteps />
        <MatrixBand />
        <section className="section" id="demo">
          <div className="container">
            <Reveal>
              <div className="section-head">
                <h2>
                  在线体验 · <span className="grad-text">免费生成大纲</span>
                </h2>
                <p>无需登录即可体验完整交互：选择类型、填写题目，观看智能大纲逐步生成。</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <GeneratorPanel />
            </Reveal>
          </div>
        </section>
        <HistorySection />
        <Pricing />
        <Ecosystem />
        <FaqSection />
        <CtaBand />
      </main>
      <Footer />
      {login && <LoginModal mode="login" onClose={() => setLogin(false)} />}
      <ToastHost />
    </>
  )
}
