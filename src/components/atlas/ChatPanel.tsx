import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCheck, Mic, Send, Square } from "lucide-react";
import { useAtlas } from "@/lib/atlas-store";

const SUGGESTIONS = [
  "I harvested 2 tons of tomatoes in Vemagal",
  "1.2 tonnes tomato ready in Sugatur",
  "3 tons of ragi at Malur",
];

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-6 items-center gap-[3px]">
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-leaf"
          animate={
            active
              ? { height: [6, 8 + ((i * 7) % 18), 6] }
              : { height: 4 + ((i * 5) % 10) }
          }
          transition={{ duration: 0.7 + (i % 5) * 0.08, repeat: active ? Infinity : 0, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function ChatPanel() {
  const { messages, phase, send, approve, reset } = useAtlas();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  const submit = (value: string, voice = false) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (phase === "awaiting" && /^(yes|haudu|ok|proceed|ha|sari)/i.test(trimmed)) {
      approve();
      setText("");
      return;
    }
    send(trimmed, voice);
    setText("");
  };

  const toggleMic = () => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SR) {
      // Graceful demo fallback: simulate a voice note.
      setListening(true);
      setTimeout(() => {
        setListening(false);
        submit(SUGGESTIONS[0]!, true);
      }, 2200);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) submit(transcript, true);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div className="panel flex h-full min-h-[560px] flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
        <div className="grid size-10 place-items-center rounded-full bg-whatsapp/20 text-lg">🌾</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">ATLAS Assistant</p>
          <p className="text-xs text-leaf">online · WhatsApp (simulated)</p>
        </div>
        <button
          onClick={reset}
          className="ml-auto rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          New chat
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.from === "farmer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  m.from === "farmer"
                    ? "rounded-br-sm bg-whatsapp/25 text-foreground"
                    : "rounded-bl-sm bg-surface-2 text-foreground"
                }`}
              >
                {m.voice && (
                  <div className="mb-2 flex items-center gap-2 text-leaf">
                    <Mic className="size-4" />
                    <Waveform active={false} />
                    <span className="text-[11px] text-muted-foreground">0:07</span>
                  </div>
                )}
                {m.text}
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                  {m.time}
                  {m.from === "farmer" && <CheckCheck className="size-3 text-leaf" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {phase === "running" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-leaf"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
              <span className="text-xs text-muted-foreground">ATLAS agents are working…</span>
            </div>
          </div>
        )}

        {phase === "awaiting" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pt-1">
            <button
              onClick={approve}
              className="flex-1 rounded-xl bg-leaf px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-glow-leaf transition hover:brightness-110"
            >
              <Check className="mr-1 inline size-4" /> Yes, proceed
            </button>
            <button
              onClick={reset}
              className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Not now
            </button>
          </motion.div>
        )}
      </div>

      {phase === "idle" && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-gold/50 hover:text-gold"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="flex items-center gap-2 border-t border-border bg-surface-2/60 px-3 py-3"
      >
        {listening ? (
          <div className="flex flex-1 items-center gap-3 rounded-full bg-background/60 px-4 py-2">
            <span className="size-2 animate-pulse rounded-full bg-destructive" />
            <Waveform active />
            <span className="text-xs text-muted-foreground">Recording…</span>
          </div>
        ) : (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={phase === "awaiting" ? 'Type "Yes" to confirm' : "Type or hold the mic…"}
            className="flex-1 rounded-full bg-background/60 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-gold/50"
          />
        )}
        <button
          type="button"
          onClick={toggleMic}
          className={`grid size-10 shrink-0 place-items-center rounded-full transition ${
            listening ? "bg-destructive text-destructive-foreground" : "bg-leaf/20 text-leaf hover:bg-leaf/30"
          }`}
          aria-label="Voice note"
        >
          {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
        </button>
        <button
          type="submit"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-primary-foreground transition hover:brightness-110"
          aria-label="Send"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
