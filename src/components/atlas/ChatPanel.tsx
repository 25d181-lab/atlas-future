import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCheck, Loader2, Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import { Check } from "lucide-react";
import { useAtlas } from "@/lib/atlas-store";
import { useI18n, useT, LANGUAGES } from "@/lib/i18n";
import { blobToBase64, startRecording, type Recorder } from "@/lib/wav";
import { transcribeAudio } from "@/lib/transcribe.functions";
import { askAtlas, speakAtlas, type AtlasTurn } from "@/lib/assistant.functions";

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
  const { messages, phase, send, approve, reset, pushMessage } = useAtlas();
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const turnsRef = useRef<AtlasTurn[]>([]);

  const suggestions = [t("s1"), t("s2"), t("s3")];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase, thinking]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  };

  const speak = async (value: string) => {
    try {
      stopAudio();
      const { audioBase64 } = await speakAtlas({ data: { text: value } });
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      setSpeaking(true);
      await audio.play();
    } catch {
      setSpeaking(false);
    }
  };

  const submit = async (value: string, voice = false) => {
    const trimmed = value.trim();
    if (!trimmed || thinking) return;
    setError(null);
    setText("");

    if (phase === "awaiting" && /^(yes|haudu|ha|ok|proceed|sari|ಹೌದು|हाँ|हां|ஆம்|అవును|അതെ)/i.test(trimmed)) {
      approve();
      return;
    }

    pushMessage("farmer", trimmed, voice);
    turnsRef.current = [...turnsRef.current, { role: "user" as const, content: trimmed }].slice(-12);
    setThinking(true);
    try {
      const answer = await askAtlas({ data: { messages: turnsRef.current, lang } });
      if (answer.intent === "sell_harvest") {
        setThinking(false);
        send(trimmed, voice, { skipFarmerEcho: true });
        return;
      }
      const reply = answer.reply || t("outOfScope");
      turnsRef.current = [...turnsRef.current, { role: "assistant" as const, content: reply }].slice(-12);
      pushMessage("atlas", reply);
      setThinking(false);
      void speak(reply);
    } catch (e) {
      setThinking(false);
      setError(e instanceof Error ? e.message : t("assistantError"));
    }
  };

  const stopAndTranscribe = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setListening(false);
    if (!recorder) return;

    const blob = await recorder.stop();
    if (blob.size < 4096) {
      setError(t("tooShort"));
      return;
    }
    setTranscribing(true);
    try {
      const audioBase64 = await blobToBase64(blob);
      const stt = LANGUAGES.find((l) => l.code === lang)?.stt;
      const result = await transcribeAudio({ data: { audioBase64, language: stt } });
      setTranscribing(false);
      if (result.text) await submit(result.text, true);
      else setError(t("tooShort"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed.");
    } finally {
      setTranscribing(false);
    }
  };

  const toggleMic = async () => {
    setError(null);
    if (transcribing) return;
    if (listening) {
      await stopAndTranscribe();
      return;
    }
    try {
      recorderRef.current = await startRecording();
      setListening(true);
    } catch {
      setError(t("micDenied"));
    }
  };


  return (
    <div className="panel flex h-full min-h-[560px] flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
        <div className="grid size-10 place-items-center rounded-full bg-whatsapp/20 text-lg">🌾</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t("assistant")}</p>
          <p className="text-xs text-leaf">{t("online")}</p>
        </div>
        {speaking && (
          <button
            onClick={stopAudio}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-leaf/50 bg-leaf/10 px-3 py-1 text-xs text-leaf"
          >
            <VolumeX className="size-3.5" /> {t("stopAudio")}
          </button>
        )}
        <button
          onClick={() => {
            stopAudio();
            turnsRef.current = [];
            reset();
          }}
          className={`${speaking ? "" : "ml-auto "}rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground`}
        >
          {t("newChat")}
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
                    <span className="text-[11px] text-muted-foreground">{t("voiceNote")}</span>
                  </div>
                )}
                {m.text}
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                  {m.from === "atlas" && m.text && (
                    <button
                      onClick={() => void speak(m.text)}
                      className="mr-auto flex items-center gap-1 text-leaf transition hover:brightness-125"
                      aria-label={t("speakAnswer")}
                    >
                      <Volume2 className="size-3.5" /> {t("speakAnswer")}
                    </button>
                  )}
                  {m.time}
                  {m.from === "farmer" && <CheckCheck className="size-3 text-leaf" />}
                </div>

              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {transcribing && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 rounded-2xl rounded-br-sm bg-whatsapp/20 px-3.5 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-leaf" />
              {t("transcribing")}
            </div>
          </div>
        )}

        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-gold" />
              {t("thinking")}
            </div>
          </div>
        )}


        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

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
              <span className="text-xs text-muted-foreground">{t("working")}</span>
            </div>
          </div>
        )}

        {phase === "awaiting" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pt-1">
            <button
              onClick={approve}
              className="flex-1 rounded-xl bg-leaf px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-glow-leaf transition hover:brightness-110"
            >
              <Check className="mr-1 inline size-4" /> {t("yesProceed")}
            </button>
            <button
              onClick={reset}
              className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              {t("notNow")}
            </button>
          </motion.div>
        )}
      </div>

      {phase === "idle" && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {suggestions.map((s) => (
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
            <span className="truncate text-xs text-muted-foreground">{t("recording")}</span>
          </div>
        ) : (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={phase === "awaiting" ? t("typeYes") : t("typeOrMic")}
            className="flex-1 rounded-full bg-background/60 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-gold/50"
          />
        )}
        <button
          type="button"
          onClick={toggleMic}
          disabled={transcribing}
          className={`grid size-10 shrink-0 place-items-center rounded-full transition disabled:opacity-60 ${
            listening ? "bg-destructive text-destructive-foreground" : "bg-leaf/20 text-leaf hover:bg-leaf/30"
          }`}
          aria-label={t("voiceNote")}
        >
          {transcribing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : listening ? (
            <Square className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
        </button>
        <button
          type="submit"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-primary-foreground transition hover:brightness-110"
          aria-label={t("send")}
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
