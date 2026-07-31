import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Brain, Send, Shield } from "lucide-react";
import { useRef, useState } from "react";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant"; content: string; sources?: any[] };

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ask = trpc.copilot.ask.useMutation();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
        const result = await ask.mutateAsync({
          question,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        });
      const answerText = typeof result.answer === "string" ? result.answer : String(result.answer ?? "");
      setMessages(prev => [...prev, { role: "assistant", content: answerText, sources: result.sourcesUsed }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Unable to process request. Please try again." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const SUGGESTED = [
    "What is Biorce's most defensible competitive moat against Faro Health?",
    "What are the EU AI Act compliance risks for Biorce's Barcelona R&D operations?",
    "Who are the top 3 partnership targets and what is the outreach strategy for each?",
    "What is the technical architecture of Aika 2.0 based on available intelligence?",
    "What discrepancies exist between Biorce's public claims and verified data?",
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
              <Brain className="w-4 h-4" style={{ color: "var(--color-primary-foreground)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Strategy Copilot</div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Source-cited intelligence only</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "oklch(0.65 0.18 145 / 0.1)", color: "oklch(0.75 0.15 145)", border: "1px solid oklch(0.65 0.18 145 / 0.3)" }}>
            <Shield className="w-3 h-3" />
            Primary sources only
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8 mt-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-primary)" }}>
                  <Brain className="w-7 h-7" style={{ color: "var(--color-primary-foreground)" }} />
                </div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Biorce Strategy Copilot</h2>
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Ask anything about Biorce's strategy, competitive landscape, regulatory environment, or partnership targets.<br />
                  Every answer cites primary sources from the verified knowledge base.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-left p-3 rounded-lg border text-xs transition-all"
                    style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)"; (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)"; }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-3xl ${m.role === "user" ? "ml-12" : "mr-12"}`}>
                <div className="p-4 rounded-xl text-sm leading-relaxed"
                  style={{
                    background: m.role === "user" ? "var(--color-primary)" : "var(--color-card)",
                    color: m.role === "user" ? "var(--color-primary-foreground)" : "var(--color-foreground)",
                    border: m.role === "assistant" ? "1px solid var(--color-border)" : "none",
                  }}>
                  {m.role === "assistant" ? <Streamdown>{m.content}</Streamdown> : m.content}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.sources.map((s: any) => (
                      <span key={s.id} className={`text-xs px-2 py-0.5 rounded badge-${s.verificationStatus}`}>{s.sourceName ?? s.title?.slice(0, 30)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--color-primary)", animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about strategy, partnerships, regulatory deadlines, competitive intelligence..."
              rows={2}
              className="flex-1 px-4 py-3 rounded-xl border text-sm resize-none outline-none"
              style={{ background: "var(--color-input)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "var(--color-primary)" }}>
              <Send className="w-4 h-4" style={{ color: "var(--color-primary-foreground)" }} />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
