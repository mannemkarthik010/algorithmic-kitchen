"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { resume } from "../data/resume";
import { SectionHeader, GlowBlob, Btn, FadeUp } from "./ui";
import { useSoundFx } from "../hooks/useSoundFx";

type Msg = { role: "user" | "assistant"; text: string };

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]         = useState(false);
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [msgs, setMsgs]         = useState<Msg[]>([{ role: "assistant", text: "Welcome! I'm ChefGPT — Karthik's AI assistant. Ask me anything about his skills, projects, or experience." }]);
  const [loading, setLoading]   = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const hasMounted  = useRef(false);
  const { play }    = useSoundFx();

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Send failed");
      play("/sounds/notification.mp3", 0.3);
      setSent(true);
    } catch {
      play("/sounds/error.mp3", 0.3);
      setSendError("Kitchen is temporarily closed — please email directly at " + resume.email);
    } finally {
      setSending(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || loading) return;
    const txt = chatInput.trim(); setChatInput("");
    setMsgs((p) => [...p, { role: "user", text: txt }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are ChefGPT, the AI assistant on Karthik Mannem's portfolio "The Algorithmic Kitchen". Be warm, professional, subtly witty. Max 3 short paragraphs.\n\nKarthik Mannem — ML Engineer, CSUN M.S. CS (GPA 3.92, May 2026 — graduated), Los Angeles.\nSkills: Python, LangChain, RAG, PyTorch, TensorFlow, HuggingFace, Docker, Flask, AWS, Next.js.\nProjects: Preventive Care RAG Agent, SplitWise Pro, Netflix Recommender, Fake Currency CNN, BERT Product Predictor, Retail Demand Intelligence Platform (multi-model forecasting + agentic LLM Q&A on AWS).\nExperience: Generative AI Analyst @ Handshake AI (Sep 2025 – Apr 2026), 3+ yrs Freelance ML Engineer (Aug 2023 – Jun 2024).\nEmail: ${resume.email} | GitHub: github.com/mannemkarthik010\nOpen to: full-time ML/AI roles — immediately available.`,
          messages: [...msgs.filter((_,i)=>i>0).map((m)=>({ role: m.role, content: m.text })), { role: "user", content: txt }],
        }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.reply ?? "Brief kitchen outage — please try again!"
        : data.error || "Brief kitchen outage — please try again!";
      play(res.ok ? "/sounds/notification.mp3" : "/sounds/error.mp3", 0.25);
      setMsgs((p) => [...p, { role: "assistant", text: reply }]);
    } catch {
      play("/sounds/error.mp3", 0.25);
      setMsgs((p) => [...p, { role: "assistant", text: "Brief kitchen outage — please try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    background: "var(--bg-surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", color: "var(--cream)",
    fontFamily: "var(--f-body)", fontSize: 14, outline: "none",
    transition: "border-color 0.2s ease",
  };

  return (
    <section id="contact" className="s-warm" style={{ position: "relative" }}>
      <GlowBlob size={500} color="rgba(200,145,58,0.055)" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <SectionHeader index="§ 07" label="Reserve a Table"
          title={<>Let&apos;s <span className="t-grad">Cook Together</span></>}
          subtitle="Open to full-time ML/AI roles, collaborations, and great conversations."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "var(--space-6)" }}>
          {/* Form */}
          <FadeUp delay={0.05}>
            <h3 className="heading-lg c-cream" style={{ fontWeight: 400, marginBottom: "var(--space-3)" }}>Make a Reservation</h3>

            {!sent ? (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {[
                  { id: "name",    label: "Your Name",  placeholder: "Gordon Ramsay",                   type: "text"  },
                  { id: "email",   label: "Email",      placeholder: "gordon@kitchennightmares.com",    type: "email" },
                  { id: "subject", label: "Subject",    placeholder: "Let's talk AI...",                type: "text"  },
                ].map(({ id, label, placeholder, type }) => (
                  <div key={id}>
                    <label className="label" style={{ display: "block", marginBottom: 6 }}>{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={form[id as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                      required style={fieldStyle}
                      onFocus={(e)  => (e.target.style.borderColor = "var(--border-active)")}
                      onBlur={(e)   => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>
                ))}
                <div>
                  <label className="label" style={{ display: "block", marginBottom: 6 }}>Message</label>
                  <textarea placeholder="Tell me about the opportunity..."
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required rows={4}
                    style={{ ...fieldStyle, resize: "vertical" }}
                    onFocus={(e)  => (e.target.style.borderColor = "var(--border-active)")}
                    onBlur={(e)   => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                {sendError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="body-sm" style={{ color: "var(--orange)", padding: "8px 12px", background: "rgba(212,93,32,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(212,93,32,0.3)" }}>
                    {sendError}
                  </motion.p>
                )}

                <Btn type="submit" variant="primary" disabled={sending} style={{ alignSelf: "flex-start" }}>
                  {sending ? "Sending…" : "Send Reservation"}
                </Btn>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                style={{ padding: "var(--space-5) var(--space-4)", background: "rgba(200,145,58,0.07)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
                <p className="heading-xl t-grad" style={{ marginBottom: "var(--space-1)" }}>Reservation Received ✓</p>
                <p className="body-md c-muted">Your table is being prepared. Karthik will be in touch shortly.</p>
              </motion.div>
            )}

            <div style={{ marginTop: "var(--space-3)", display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
              {[
                { label: "LinkedIn", href: resume.linkedin },
                { label: "GitHub",   href: resume.github   },
                { label: "Email",    href: `mailto:${resume.email}` },
              ].map(({ label, href }) => (
                <Btn key={label} href={href} variant="secondary" target="_blank" rel="noopener noreferrer"
                  style={{ padding: "8px 18px", fontSize: 11 }}>
                  {label}
                </Btn>
              ))}
            </div>
          </FadeUp>

          {/* ChefGPT */}
          <FadeUp delay={0.12}>
            <h3 className="heading-lg c-cream" style={{ fontWeight: 400, marginBottom: "0.4rem" }}>Ask ChefGPT</h3>
            <p className="body-sm c-muted" style={{ marginBottom: "var(--space-2)" }}>Have questions? My AI assistant knows the full menu.</p>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Chat header */}
              <div style={{ padding: "0.85rem var(--space-3)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,145,58,0.12)", border: "1px solid var(--border-active)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mono c-gold" style={{ fontSize: 11, opacity: 0.8 }}>CG</span>
                </div>
                <div>
                  <p className="body-sm c-cream" style={{ fontWeight: 500 }}>ChefGPT</p>
                  <p className="label c-gold" style={{ fontSize: 9 }}>● Online</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ height: 280, overflowY: "auto", padding: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {msgs.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "82%", padding: "9px 13px",
                      borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                      background: m.role === "user" ? "var(--gold)" : "rgba(200,145,58,0.09)",
                      color: m.role === "user" ? "var(--bg-base)" : "var(--cream)",
                      border: m.role === "assistant" ? "1px solid var(--border)" : "none" }}>
                      <p className="body-sm" style={{ lineHeight: 1.6, color: "inherit" }}>{m.text}</p>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "9px 13px", borderRadius: "12px 12px 12px 3px", background: "rgba(200,145,58,0.09)", border: "1px solid var(--border)" }}>
                      <motion.p className="body-sm c-muted" animate={{ opacity: [1,0.4,1] }} transition={{ duration: 1, repeat: Infinity }}>Chef is thinking…</motion.p>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "0.75rem var(--space-2)", borderTop: "1px solid var(--border)", display: "flex", gap: "var(--space-1)" }}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask about skills, projects, availability..."
                  style={{ flex: 1, padding: "8px 11px", background: "rgba(200,145,58,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--cream)", fontFamily: "var(--f-body)", fontSize: 13, outline: "none" }}
                />
                <Btn onClick={sendChat} variant="primary" disabled={loading} style={{ padding: "8px 16px", fontSize: 11, flexShrink: 0 }}>Send</Btn>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
