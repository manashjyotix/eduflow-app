"use client"
import { useState, useRef, useEffect } from "react"
import type { ReactNode } from "react"
import { Bot, X, Send, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  "Who can cover Period 3?",
  "How many absences today?",
  "Show fee defaulters",
  "What's the timetable for VIII-A?",
]

const MOCK_RESPONSES: Record<string, string> = {
  proxy: "Based on today's schedule, **Priya Sharma** and **Rajesh Kalita** are available for proxy duty. Priya has the same subject (English) and is best suited for P3 coverage.",
  absence: "Today we have **3 teacher absences**: Anita Devi (full day, sick leave ✅ approved), Dipak Baruah (P1–P3, doctor visit ✅ approved), and Rima Das (full day, family emergency ⏳ pending approval).",
  fee: "Current fee defaulters: **15 students** with total outstanding of **₹78,500**. Top defaulter: Arjun Borah (Class X-A) — ₹14,200 overdue for 67 days. Would you like me to draft a reminder SMS?",
  timetable: "Class VIII-A timetable for today (Monday): P1 Math (Anita Devi), P2 English (Priya Sharma), P3 Science (Dipak Baruah), P4 Social Studies (Rajesh Kalita), P5 Hindi (Meena Gogoi), P6 Sanskrit (Sunita Borah), P7 Computer Science (Biju Das).",
  proxy_board: "Today's proxy board: **5/7 periods covered** (71.4%). P2 and P5 for Anita Devi's classes are still uncovered. I recommend assigning Himanta Bezbaruah for P2 (he has a free period) and Rima Das for P5 if her leave is rejected.",
  attendance: "Today's attendance summary: **Teachers**: 7/10 present (3 absent). **Students**: 271/284 present (84.6% overall). Class X-A has the lowest attendance at 78% today.",
  report: "Available reports: Proxy Coverage (last generated Jun 14), Teacher Attendance (Jun 10), Fee Collection (Jun 01), and Student Attendance (Jun 14). Which report would you like me to generate?",
  weather: "Current weather in Howly: 28°C, partly cloudy. No rain expected today — outdoor sports activities are safe to proceed.",
  hello: "Hello! I'm the **EduFlow Assistant** 👋. I can help you with proxy assignments, absences, fee collection, timetables, and more. What can I help you with today?",
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes("cover") || lower.includes("proxy") || lower.includes("assign")) {
    return MOCK_RESPONSES.proxy
  }
  if (lower.includes("absent") || lower.includes("absence") || lower.includes("leave")) {
    return MOCK_RESPONSES.absence
  }
  if (lower.includes("fee") && (lower.includes("default") || lower.includes("pending") || lower.includes("due"))) {
    return MOCK_RESPONSES.fee
  }
  if (lower.includes("timetable") || lower.includes("schedule") || lower.includes("class viii") || lower.includes("period")) {
    return MOCK_RESPONSES.timetable
  }
  if (lower.includes("proxy board") || lower.includes("board") || lower.includes("covered") || lower.includes("uncovered")) {
    return MOCK_RESPONSES.proxy_board
  }
  if (lower.includes("attendance") || lower.includes("present") || lower.includes("student")) {
    return MOCK_RESPONSES.attendance
  }
  if (lower.includes("report") || lower.includes("analytics")) {
    return MOCK_RESPONSES.report
  }
  if (lower.includes("weather") || lower.includes("rain")) {
    return MOCK_RESPONSES.weather
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("help")) {
    return MOCK_RESPONSES.hello
  }
  return "I can help with proxy assignments, absences, fee management, timetables, attendance reports, and more. Try asking: *'Who can cover Period 3?'* or *'How many absences today?'*"
}

export function EduFlowAssistant() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your **EduFlow Assistant** 👋. Ask me anything about proxies, absences, fees, or the timetable.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const val = typeof window !== "undefined" ? localStorage.getItem("ef-assistant-dismissed") : null
    if (val === "true") setDismissed(true)
  }, [])

  function dismiss() {
    setDismissed(true)
    if (typeof window !== "undefined") localStorage.setItem("ef-assistant-dismissed", "true")
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)
    const delay = 600 + Math.random() * 800
    await new Promise(r => setTimeout(r, delay))
    const response = getResponse(text)
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() }
    setMessages(prev => [...prev, assistantMsg])
    setLoading(false)
  }

  function renderContent(content: string): ReactNode[] {
    // Split on **bold** and *italic* markers, producing an array of React nodes.
    // Pattern: capture groups alternate between plain text and marked segments.
    const nodes: ReactNode[] = []
    // First pass: handle **bold**
    const boldParts = content.split(/\*\*(.*?)\*\*/g)
    boldParts.forEach((part, i) => {
      if (i % 2 === 1) {
        // Odd indices are the captured bold content
        nodes.push(<strong key={`b-${i}`}>{part}</strong>)
      } else {
        // Even indices are plain text segments — may still contain *italic*
        const italicParts = part.split(/\*(.*?)\*/g)
        italicParts.forEach((iPart, j) => {
          if (j % 2 === 1) {
            nodes.push(<em key={`b-${i}-i-${j}`}>{iPart}</em>)
          } else if (iPart) {
            nodes.push(iPart)
          }
        })
      }
    })
    return nodes
  }

  if (dismissed && !open) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className="w-[340px] sm:w-[380px] bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-primary text-primary-foreground">
            <div className="size-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">EduFlow Assistant</p>
              <p className="text-xs opacity-75">AI-powered school helper</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
                {msg.role === "assistant" && (
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                  msg.role === "assistant"
                    ? "bg-muted text-foreground rounded-tl-none"
                    : "bg-primary text-primary-foreground rounded-tr-none"
                )}>
                  <p className="leading-relaxed">
                    {renderContent(msg.content)}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="size-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-xl rounded-tl-none px-3 py-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                className="h-8 text-sm bg-muted border-0"
              />
              <Button
                size="icon"
                className="size-8 flex-shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="flex items-center gap-2">
        {!open && !dismissed && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={dismiss}
            title="Dismiss assistant"
          >
            <X className="size-3.5" />
          </Button>
        )}
        <Button
          onClick={() => { setOpen(!open); setDismissed(false) }}
          className="size-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          size="icon"
          aria-label="Open EduFlow Assistant"
        >
          {open ? <X className="size-6" /> : <Bot className="size-6" />}
        </Button>
      </div>
    </div>
  )
}
