import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/store'
import { CHAT_SUGGESTIONS, chatbotReply } from '../lib/chatbot'

interface Msg {
  role: 'bot' | 'user'
  text: string
}

export default function ChatBot() {
  const { reports } = useStore()
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'bot', text: '안녕하세요! Living_Lot 주차 도우미예요 🅿️ 무엇이든 물어보세요.' },
  ])
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing, open])

  const send = (text: string) => {
    const q = text.trim()
    if (!q || typing) return
    setMsgs((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setTyping(true)
    // 응답 시늉 (타이핑 딜레이)
    setTimeout(() => {
      const reply = chatbotReply(q, reports)
      setMsgs((m) => [...m, { role: 'bot', text: reply }])
      setTyping(false)
    }, 700 + Math.random() * 700)
  }

  return (
    <>
      <button
        className={`chat-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI 주차 도우미"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <span className="chat-ava">🅿️</span>
            <div>
              <strong>주차 도우미</strong>
              <span className="chat-status">
                <i /> AI · 온라인
              </span>
            </div>
          </div>

          <div className="chat-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="bubble bot typing">
                <span /><span /><span />
              </div>
            )}
            {msgs.length <= 1 && !typing && (
              <div className="chat-suggest">
                {CHAT_SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요…"
            />
            <button type="submit" disabled={!input.trim() || typing}>
              ↑
            </button>
          </form>
        </div>
      )}
    </>
  )
}
