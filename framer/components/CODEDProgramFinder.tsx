// CODED Program Finder — Framer Component
// AI-powered 6-step questionnaire that recommends training programs.
// Assets > Code > New File > paste this entire file.

import { useState, useEffect, useRef, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

// ── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "")
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

// ── Types ───────────────────────────────────────────────────────────────────
interface State {
    step: number
    direction: "forward" | "back"
    employees: string | null
    iterations: string | null
    field: string[]
    duration: string | null
    audience: string[]
    location: string | null
    company: string
}

interface Recommendation {
    courseTitle: string
    courseType: string
    duration: string
    tag: string
    whyThisFits: string
    description: string
}

interface AIResponse {
    greeting: string
    recommendations: Recommendation[]
    note?: string
}

const INITIAL_STATE: State = {
    step: 0,
    direction: "forward",
    employees: null,
    iterations: null,
    field: [],
    duration: null,
    audience: [],
    location: null,
    company: "",
}

const STEPS = ["employees", "field", "duration", "audience", "location", "company"] as const

// ── Local fallback courses (used when workerUrl is empty) ───────────────────
const COURSES = [
    { id: "AI-BOOT", name: "AI App Developer Bootcamp", duration: "> 5 weeks", audience: ["Technical Teams", "Fresh Graduates"], fields: ["AI"], size: "12 – 15", desc: "Hands-on vibe-coding program — build real AI-powered products from day one." },
    { id: "AI-CHAMP", name: "AI Champions Program", duration: "1 day", audience: ["Executives", "Mixed Levels"], fields: ["AI"], size: "< 8", desc: "Strategic AI literacy for leadership — think differently about automation & tools." },
    { id: "FULLSTACK", name: "Full-Stack Bootcamp", duration: "> 5 weeks", audience: ["Fresh Graduates", "Technical Teams"], fields: ["Full-Stack"], size: "12 – 15", desc: "End-to-end web development mastery — from design to deployment." },
    { id: "DATA", name: "Data Analytics Sprint", duration: "< 3 weeks", audience: ["Technical Teams", "Executives"], fields: ["Data"], size: "< 8", desc: "Practical data storytelling, SQL, and dashboards that drive decisions." },
    { id: "CYBER", name: "Cybersecurity Foundations", duration: "< 3 weeks", audience: ["Technical Teams", "Mixed Levels"], fields: ["Cybersecurity"], size: "< 8", desc: "Essential threat awareness, security protocols, and hands-on defence techniques." },
    { id: "CORP-AI", name: "Corporate AI Transformation", duration: "< 3 days", audience: ["Executives", "Mixed Levels"], fields: ["AI"], size: "> 25", desc: "Large-scale AI upskilling across departments — strategy to execution." },
    { id: "CORP-DS", name: "Data Science for Enterprise", duration: "< 3 weeks", audience: ["Technical Teams"], fields: ["Data"], size: "> 25", desc: "Scalable data science training — from analytics to ML pipelines." },
]

const SIZE_MAP: Record<string, string> = { "< 8 people": "< 8", "12 – 15 people": "12 – 15", "> 25 people": "> 25" }

function localRecommend(s: State): AIResponse {
    const scored = COURSES.map((c) => {
        let score = 0
        if (s.audience.some((a) => c.audience.includes(a))) score += 3
        if (s.field.some((f) => c.fields.includes(f))) score += 3
        if (c.duration === s.duration) score += 2
        if (s.employees && c.size === SIZE_MAP[s.employees]) score += 1
        return { ...c, score }
    })
    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, 2)
    const name = s.company.trim().split(" ")[0] || null
    return {
        greeting: name ? `Here's what we'd recommend for ${name}` : "Your top program picks",
        recommendations: top.map((c) => ({
            courseTitle: c.name,
            courseType: c.fields[0] || "",
            duration: c.duration,
            tag: c.audience[0] || "",
            whyThisFits: c.desc,
            description: c.desc,
        })),
        note: "Our advisors will tailor the details to your team.",
    }
}

// ── Spark SVG ───────────────────────────────────────────────────────────────
function Spark({ style }: { style?: React.CSSProperties }) {
    return (
        <svg viewBox="0 0 16 16" fill="none" style={style}>
            <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" fill="currentColor" />
        </svg>
    )
}

// ── Sparks Field ────────────────────────────────────────────────────────────
function SparksField({ color }: { color: string }) {
    const sparks = [
        { size: 14, top: "9%", left: "94%", delay: "0s", dur: "3.4s", o: 0.22 },
        { size: 9, top: "78%", left: "97%", delay: "1.2s", dur: "2.8s", o: 0.18 },
        { size: 18, top: "60%", left: "1%", delay: "0.7s", dur: "3.8s", o: 0.15 },
        { size: 7, top: "20%", left: "2%", delay: "2s", dur: "3.1s", o: 0.2 },
    ]
    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
            {sparks.map((s, i) => (
                <Spark key={i} style={{ position: "absolute", top: s.top, left: s.left, width: s.size, height: s.size, color, opacity: s.o, animation: `codedPF_sparkFloat ${s.dur} ease-in-out ${s.delay} infinite` }} />
            ))}
        </div>
    )
}

// ── Thinking Dots ───────────────────────────────────────────────────────────
function ThinkingDots({ color }: { color: string }) {
    return (
        <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "18px 0 10px" }}>
            {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: color, animation: `codedPF_thinkBounce 1.1s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
        </div>
    )
}

// ── Chip ────────────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick, accent }: { label: string; selected: boolean; onClick: () => void; accent: string }) {
    const [hovered, setHovered] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: "9px 18px", borderRadius: 100, fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                cursor: "pointer", outline: "none", whiteSpace: "nowrap", userSelect: "none",
                border: `1.5px solid ${selected ? accent : hovered ? accent : "#DDE3EC"}`,
                background: selected ? accent : hovered ? hexToRgba(accent, 0.05) : "#F8FAFB",
                color: selected ? "#fff" : hovered ? accent : "#3A4D63",
                transition: "all 0.16s ease",
            }}
        >
            {label}
        </button>
    )
}

// ── Field Card ──────────────────────────────────────────────────────────────
const FIELD_META: Record<string, { icon: string; sub: string }> = {
    AI: { icon: "✦", sub: "Tools, agents & automation" },
    Cybersecurity: { icon: "🛡", sub: "Threat defence & protocols" },
    Data: { icon: "◈", sub: "Analytics & data science" },
    "Full-Stack": { icon: "⬡", sub: "Web development" },
}

function FieldCard({ id, selected, onClick, accent }: { id: string; selected: boolean; onClick: () => void; accent: string }) {
    const [hovered, setHovered] = useState(false)
    const meta = FIELD_META[id]
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: "14px 18px", borderRadius: 14, textAlign: "left",
                display: "flex", alignItems: "center", gap: 10, userSelect: "none",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14,
                cursor: "pointer", outline: "none",
                border: `1.5px solid ${selected ? accent : hovered ? accent : "#DDE3EC"}`,
                background: selected ? accent : hovered ? hexToRgba(accent, 0.05) : "#F8FAFB",
                color: selected ? "#fff" : hovered ? accent : "#3A4D63",
                transition: "all 0.16s ease",
            }}
        >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: selected ? "rgba(255,255,255,0.2)" : hexToRgba(accent, 0.08), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {meta.icon}
            </div>
            <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{id}</div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 1 }}>{meta.sub}</div>
            </div>
        </button>
    )
}

// ── Back Button ─────────────────────────────────────────────────────────────
function BackBtn({ onClick, accent }: { onClick: () => void; accent: string }) {
    const [hovered, setHovered] = useState(false)
    return (
        <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} title="Back"
            style={{ width: 38, height: 38, borderRadius: 100, border: `1.5px solid ${hovered ? accent : "#DDE3EC"}`, background: "white", color: hovered ? accent : "#7A8899", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.16s", flexShrink: 0, outline: "none" }}>
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13L5 8L10 3" /></svg>
        </button>
    )
}

// ── Primary Button ──────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, disabled, children, accent }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; accent: string }) {
    const [hovered, setHovered] = useState(false)
    return (
        <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ background: disabled ? "#DDE3EC" : hovered ? accent : "#0A1628", color: disabled ? "#A0AEBD" : "white", border: "none", borderRadius: 100, padding: "11px 26px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: disabled ? "default" : "pointer", transition: "background 0.18s, transform 0.12s", outline: "none", transform: hovered && !disabled ? "translateY(-1px)" : "none" }}>
            {children}
        </button>
    )
}

// ── Ghost Button ────────────────────────────────────────────────────────────
function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    const [hovered, setHovered] = useState(false)
    return (
        <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ background: "transparent", border: "none", color: hovered ? "#3A4D63" : "#A0AEBD", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", padding: "11px 6px", transition: "color 0.15s", outline: "none" }}>
            {children}
        </button>
    )
}

// ── Step Wrapper ────────────────────────────────────────────────────────────
function StepWrap({ children, direction }: { children: React.ReactNode; direction: "forward" | "back" }) {
    const [visible, setVisible] = useState(false)
    useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
    return (
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : direction === "back" ? "translateX(-18px)" : "translateX(18px)", transition: "opacity 0.32s ease, transform 0.32s cubic-bezier(.22,1,.36,1)" }}>
            {children}
        </div>
    )
}

// ── Result Card (inline) ────────────────────────────────────────────────────
function ResultCard({ rec, best, delay, accent }: { rec: Recommendation; best: boolean; delay: number; accent: string }) {
    const [hovered, setHovered] = useState(false)
    const [visible, setVisible] = useState(false)
    useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
    return (
        <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ border: `1.5px solid ${hovered ? accent : best ? accent : "#E4EAF3"}`, borderRadius: 16, padding: 20, background: best ? "linear-gradient(145deg, #F0F6FF, #FAFCFF)" : "white", position: "relative", overflow: "hidden", transition: "border-color 0.18s, box-shadow 0.18s, opacity 0.4s, transform 0.4s", boxShadow: hovered ? `0 4px 20px ${hexToRgba(accent, 0.1)}` : "none", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}>
            {best && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "16px 16px 0 0" }} />}
            {best && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: hexToRgba(accent, 0.08), color: accent, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
                    <svg width={9} height={9} viewBox="0 0 16 16" fill="currentColor"><path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" /></svg>
                    Best Match
                </div>
            )}
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#0A1628", marginBottom: 5, lineHeight: 1.3, margin: "0 0 5px" }}>{rec.courseTitle}</p>
            <p style={{ fontSize: 12.5, color: "#7A8899", lineHeight: 1.55, margin: "0 0 12px" }}>{rec.whyThisFits || rec.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {[rec.courseType, rec.duration, rec.tag].filter(Boolean).map((t) => (
                    <span key={t} style={{ background: best ? hexToRgba(accent, 0.08) : "#F0F4F8", color: best ? accent : "#7A8899", borderRadius: 100, padding: "3px 10px", fontSize: 11 }}>{t}</span>
                ))}
            </div>
        </div>
    )
}

// ── Shared styles ───────────────────────────────────────────────────────────
const qStyle: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: "#0A1628", marginBottom: 6, fontFamily: "'Syne', sans-serif", lineHeight: 1.3, margin: "0 0 6px" }
const hintStyle: React.CSSProperties = { fontSize: 13, color: "#9AAABB", marginBottom: 18, margin: "0 0 18px" }
const chipsStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 9 }
const navStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, marginTop: 24 }

// ═══════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function CODEDProgramFinder({
    workerUrl = "",
    aiPromptContext = "You are a training program advisor for CODED, a tech education company in Kuwait.",
    q1Text = "How many people will be enrolling?",
    q1Hint = "We'll use this to match group size and format.",
    q2Text = "Which field is this training in?",
    q2Hint = "You can select more than one.",
    q3Text = "How long can your team commit to training?",
    q3Hint = "Shorter doesn't mean less impact — we design for both.",
    q4Text = "Who's this training for?",
    q4Hint = "Select all that apply.",
    q5Text = "Where should the training take place?",
    q5Hint = "We can accommodate any preference.",
    q6Text = "Who should we address this to?",
    q6Hint = "A company name or your first name works — entirely up to you.",
    accentColor = "#2563EB",
    cardStyle = "glass",
    ctaText = "Book a Consultation",
    ctaLink = "mailto:pro@coded.com",
}: {
    workerUrl?: string
    aiPromptContext?: string
    q1Text?: string; q1Hint?: string
    q2Text?: string; q2Hint?: string
    q3Text?: string; q3Hint?: string
    q4Text?: string; q4Hint?: string
    q5Text?: string; q5Hint?: string
    q6Text?: string; q6Hint?: string
    accentColor?: string
    cardStyle?: string
    ctaText?: string
    ctaLink?: string
}) {
    const [s, setS] = useState<State>(INITIAL_STATE)
    const [thinking, setThinking] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<AIResponse | null>(null)
    const [error, setError] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const thinkTimer = useRef<any>(null)

    const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }))

    // ── Navigation ────────────────────────────────────────────────────────
    const advanceWithThink = useCallback(() => {
        if (s.step < STEPS.length - 1) {
            setThinking(true)
            clearTimeout(thinkTimer.current)
            thinkTimer.current = setTimeout(() => {
                setThinking(false)
                update({ step: s.step + 1, direction: "forward" })
            }, 450)
        } else {
            // Final step — submit
            setShowResults(true)
            setLoading(true)
            setError("")
        }
    }, [s.step])

    const goBack = () => {
        if (showResults) { setShowResults(false); setLoading(false); setResults(null); setError(""); return }
        if (thinking) return
        if (s.step > 0) update({ step: s.step - 1, direction: "back" })
    }

    const restart = () => {
        setShowResults(false); setLoading(false); setResults(null); setError("")
        setThinking(false); setS(INITIAL_STATE)
    }

    const toggleMulti = (key: "field" | "audience", val: string) => {
        const arr = s[key] as string[]
        update({ [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] })
    }

    // ── Auto-focus company input ──────────────────────────────────────────
    useEffect(() => {
        if (STEPS[s.step] === "company" && inputRef.current) inputRef.current.focus()
    }, [s.step])

    useEffect(() => { return () => clearTimeout(thinkTimer.current) }, [])

    // ── Fetch recommendations ─────────────────────────────────────────────
    useEffect(() => {
        if (!showResults || !loading) return

        const fetchRecs = async () => {
            if (!workerUrl) {
                // Mock mode — use local scoring
                setTimeout(() => {
                    setResults(localRecommend(s))
                    setLoading(false)
                }, 2000)
                return
            }

            try {
                const endpoint = workerUrl.replace(/\/$/, "") + "/workshop-recommend"
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        duration: s.duration || "",
                        teamSize: s.employees || "",
                        multipleIterations: s.iterations === "Multiple iterations",
                        location: s.location || "",
                        audience: s.audience,
                        companyName: s.company,
                        freeText: s.field.join(", "),
                        promptContext: aiPromptContext,
                    }),
                })
                if (!res.ok) {
                    const d = await res.json().catch(() => null)
                    throw new Error(d?.error || `Request failed (${res.status})`)
                }
                const data: AIResponse = await res.json()
                setResults(data)
            } catch (err: any) {
                setError(err.message || "Something went wrong")
            } finally {
                setLoading(false)
            }
        }
        fetchRecs()
    }, [showResults, loading])

    // ── Progress ──────────────────────────────────────────────────────────
    const progressPct = (s.step / STEPS.length) * 100

    // ── Card container style ──────────────────────────────────────────────
    const containerStyle: React.CSSProperties = cardStyle === "glass"
        ? {
            position: "relative", width: "100%", background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            borderRadius: 20, padding: "48px 52px",
            border: "1px solid rgba(11,29,58,0.06)",
            boxShadow: "0 24px 64px rgba(11,29,58,0.08), 0 0 0 1px rgba(255,255,255,0.6) inset",
            overflow: "hidden", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
        }
        : {
            position: "relative", width: "100%", background: "#ffffff",
            borderRadius: 20, padding: "48px 52px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(10,22,40,0.08), 0 0 0 1px rgba(10,22,40,0.06)",
            overflow: "hidden", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
        }

    // ── CSS Keyframes ─────────────────────────────────────────────────────
    const css = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Syne:wght@600;700;800&display=swap');
        @keyframes codedPF_sparkFloat {
            0%   { transform: translateY(0px) rotate(0deg) scale(1); }
            30%  { transform: translateY(-10px) rotate(15deg) scale(1.18); }
            60%  { transform: translateY(-5px) rotate(-8deg) scale(0.88); }
            100% { transform: translateY(0px) rotate(0deg) scale(1); }
        }
        @keyframes codedPF_thinkBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.25; }
            40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes codedPF_fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    `

    // ═════════════════════════════════════════════════════════════════════
    // STEP RENDERS
    // ═════════════════════════════════════════════════════════════════════
    const renderStep = () => {
        const stepId = STEPS[s.step]

        // Step 1 — Employees
        if (stepId === "employees") return (
            <StepWrap direction={s.direction}>
                <p style={qStyle}>{q1Text}</p>
                <p style={hintStyle}>{q1Hint}</p>
                <div style={chipsStyle}>
                    {["< 8 people", "12 – 15 people", "> 25 people"].map((o) => (
                        <Chip key={o} label={o} accent={accentColor} selected={s.employees === o} onClick={() => { update({ employees: o, iterations: null }); if (o !== "> 25 people") setTimeout(advanceWithThink, 130) }} />
                    ))}
                </div>
                {s.employees === "> 25 people" && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #EEF1F6", animation: "codedPF_fadeUp 0.28s ease" }}>
                        <p style={{ fontSize: 13, color: "#7A8899", marginBottom: 10, fontWeight: 500, margin: "0 0 10px" }}>Will this run across multiple cohorts?</p>
                        <div style={chipsStyle}>
                            {["Single cohort", "Multiple iterations"].map((o) => (
                                <Chip key={o} label={o} accent={accentColor} selected={s.iterations === o} onClick={() => { update({ iterations: o }); setTimeout(advanceWithThink, 130) }} />
                            ))}
                        </div>
                    </div>
                )}
                {s.step > 0 && <div style={navStyle}><BackBtn onClick={goBack} accent={accentColor} /></div>}
            </StepWrap>
        )

        // Step 2 — Field
        if (stepId === "field") return (
            <StepWrap direction={s.direction}>
                <p style={qStyle}>{q2Text}</p>
                <p style={hintStyle}>{q2Hint}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {["AI", "Cybersecurity", "Data", "Full-Stack"].map((f) => (
                        <FieldCard key={f} id={f} accent={accentColor} selected={s.field.includes(f)} onClick={() => toggleMulti("field", f)} />
                    ))}
                </div>
                <div style={navStyle}>
                    <BackBtn onClick={goBack} accent={accentColor} />
                    <PrimaryBtn onClick={advanceWithThink} disabled={s.field.length === 0} accent={accentColor}>Continue →</PrimaryBtn>
                </div>
            </StepWrap>
        )

        // Step 3 — Duration
        if (stepId === "duration") return (
            <StepWrap direction={s.direction}>
                <p style={qStyle}>{q3Text}</p>
                <p style={hintStyle}>{q3Hint}</p>
                <div style={chipsStyle}>
                    {["1 day", "< 3 days", "< 3 weeks", "> 5 weeks"].map((o) => (
                        <Chip key={o} label={o} accent={accentColor} selected={s.duration === o} onClick={() => { update({ duration: o }); setTimeout(advanceWithThink, 130) }} />
                    ))}
                </div>
                <div style={navStyle}><BackBtn onClick={goBack} accent={accentColor} /></div>
            </StepWrap>
        )

        // Step 4 — Audience
        if (stepId === "audience") return (
            <StepWrap direction={s.direction}>
                <p style={qStyle}>{q4Text}</p>
                <p style={hintStyle}>{q4Hint}</p>
                <div style={chipsStyle}>
                    {["Fresh Graduates", "Technical Teams", "Executives", "Mixed Levels"].map((o) => (
                        <Chip key={o} label={o} accent={accentColor} selected={s.audience.includes(o)} onClick={() => toggleMulti("audience", o)} />
                    ))}
                </div>
                <div style={navStyle}>
                    <BackBtn onClick={goBack} accent={accentColor} />
                    <PrimaryBtn onClick={advanceWithThink} disabled={s.audience.length === 0} accent={accentColor}>Continue →</PrimaryBtn>
                </div>
            </StepWrap>
        )

        // Step 5 — Location
        if (stepId === "location") return (
            <StepWrap direction={s.direction}>
                <p style={qStyle}>{q5Text}</p>
                <p style={hintStyle}>{q5Hint}</p>
                <div style={chipsStyle}>
                    {["At CODED HQ", "At our office", "Flexible / Online"].map((o) => (
                        <Chip key={o} label={o} accent={accentColor} selected={s.location === o} onClick={() => { update({ location: o }); setTimeout(advanceWithThink, 130) }} />
                    ))}
                </div>
                <div style={navStyle}><BackBtn onClick={goBack} accent={accentColor} /></div>
            </StepWrap>
        )

        // Step 6 — Company
        if (stepId === "company") return (
            <StepWrap direction={s.direction}>
                <p style={qStyle}>{q6Text}</p>
                <p style={hintStyle}>{q6Hint}</p>
                <input ref={inputRef} placeholder="Type here…" value={s.company}
                    onChange={(e) => update({ company: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && advanceWithThink()}
                    style={{ width: "100%", background: "#F8FAFB", border: "1.5px solid #DDE3EC", borderRadius: 12, color: "#0A1628", fontSize: 15, fontFamily: "'DM Sans', sans-serif", padding: "13px 16px", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${hexToRgba(accentColor, 0.1)}` }}
                    onBlur={(e) => { e.target.style.borderColor = "#DDE3EC"; e.target.style.boxShadow = "none" }}
                />
                <div style={navStyle}>
                    <BackBtn onClick={goBack} accent={accentColor} />
                    <PrimaryBtn onClick={advanceWithThink} accent={accentColor}>See recommendations →</PrimaryBtn>
                    <GhostBtn onClick={advanceWithThink}>Skip</GhostBtn>
                </div>
            </StepWrap>
        )

        return null
    }

    // ═════════════════════════════════════════════════════════════════════
    // RESULTS
    // ═════════════════════════════════════════════════════════════════════
    const renderResults = () => {
        // Loading state
        if (loading) return (
            <StepWrap direction="forward">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <Spark style={{ width: 16, height: 16, color: accentColor, animation: "codedPF_sparkFloat 1.5s ease-in-out infinite" }} />
                    <span style={{ color: accentColor, fontSize: 14, fontWeight: 500 }}>Analyzing our catalog for you...</span>
                </div>
                <ThinkingDots color={accentColor} />
            </StepWrap>
        )

        // Error state
        if (error) return (
            <StepWrap direction="forward">
                <p style={{ margin: "0 0 12px", color: "#DC2626", fontSize: 14 }}>{error}</p>
                <div style={navStyle}>
                    <BackBtn onClick={goBack} accent={accentColor} />
                    <PrimaryBtn onClick={() => { setError(""); setLoading(true) }} accent={accentColor}>Try again</PrimaryBtn>
                </div>
            </StepWrap>
        )

        // Results
        if (results) {
            const recs = results.recommendations || []
            return (
                <StepWrap direction="forward">
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                        <svg width={13} height={13} viewBox="0 0 16 16" fill={accentColor}><path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" /></svg>
                        <span style={{ fontSize: 11, fontWeight: 600, color: accentColor, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Your recommendations</span>
                    </div>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "#0A1628", margin: "0 0 4px" }}>{results.greeting || "Your top program picks"}</p>
                    {results.note && <p style={{ fontSize: 13, color: "#9AAABB", margin: "0 0 20px" }}>{results.note}</p>}
                    <div style={{ display: "grid", gridTemplateColumns: recs.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
                        {recs.map((r, i) => <ResultCard key={i} rec={r} best={i === 0} delay={i * 100} accent={accentColor} />)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" as const }}>
                        <a href={ctaLink} style={{ background: "#0A1628", color: "white", borderRadius: 100, padding: "11px 26px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, textDecoration: "none", display: "inline-block" }}>{ctaText}</a>
                        <button onClick={restart} style={{ background: "transparent", border: "1.5px solid #DDE3EC", color: "#7A8899", borderRadius: 100, padding: "10px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", outline: "none" }}>Start over</button>
                    </div>
                </StepWrap>
            )
        }

        return null
    }

    // ═════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════
    return (
        <>
            <style>{css}</style>
            <div style={containerStyle}>
                <SparksField color={accentColor} />

                {/* Header */}
                <div style={{ marginBottom: 32, position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <svg width={12} height={12} viewBox="0 0 16 16" fill={accentColor}><path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" /></svg>
                        <span style={{ fontSize: 11, fontWeight: 600, color: accentColor, letterSpacing: "0.13em", textTransform: "uppercase" }}>CODED · Program Finder</span>
                    </div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, color: "#0A1628", lineHeight: 1.2, margin: 0 }}>
                        Find the right program<br />for your team
                    </h2>
                    <p style={{ fontSize: 14, color: "#7A8899", marginTop: 6, fontWeight: 400 }}>Answer a few questions — we'll match you in seconds.</p>
                </div>

                {/* Progress */}
                {!showResults && !thinking && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, position: "relative", zIndex: 1 }}>
                        <div style={{ flex: 1, height: 3, background: "#E8EDF3", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progressPct}%`, background: accentColor, borderRadius: 99, transition: "width 0.45s cubic-bezier(.65,0,.35,1)" }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#A0AEBD", fontWeight: 500, whiteSpace: "nowrap" }}>{s.step + 1} of {STEPS.length}</span>
                    </div>
                )}

                {/* Content */}
                <div style={{ minHeight: 220, position: "relative", zIndex: 1 }}>
                    {thinking && <ThinkingDots color={accentColor} />}
                    {!thinking && !showResults && renderStep()}
                    {showResults && renderResults()}
                </div>
            </div>
        </>
    )
}

// ── Framer Property Controls ────────────────────────────────────────────────
addPropertyControls(CODEDProgramFinder, {
    // API
    workerUrl: {
        type: ControlType.String,
        title: "Worker URL",
        defaultValue: "",
        description: "Cloudflare Worker base URL. Leave empty for mock/preview mode.",
    },
    aiPromptContext: {
        type: ControlType.String,
        title: "AI Prompt Context",
        defaultValue: "You are a training program advisor for CODED, a tech education company in Kuwait.",
        displayTextArea: true,
        description: "System prompt context sent to the AI for tailored recommendations.",
    },
    // Questions
    q1Text: { type: ControlType.String, title: "Q1 — Text", defaultValue: "How many people will be enrolling?" },
    q1Hint: { type: ControlType.String, title: "Q1 — Hint", defaultValue: "We'll use this to match group size and format." },
    q2Text: { type: ControlType.String, title: "Q2 — Text", defaultValue: "Which field is this training in?" },
    q2Hint: { type: ControlType.String, title: "Q2 — Hint", defaultValue: "You can select more than one." },
    q3Text: { type: ControlType.String, title: "Q3 — Text", defaultValue: "How long can your team commit to training?" },
    q3Hint: { type: ControlType.String, title: "Q3 — Hint", defaultValue: "Shorter doesn't mean less impact — we design for both." },
    q4Text: { type: ControlType.String, title: "Q4 — Text", defaultValue: "Who's this training for?" },
    q4Hint: { type: ControlType.String, title: "Q4 — Hint", defaultValue: "Select all that apply." },
    q5Text: { type: ControlType.String, title: "Q5 — Text", defaultValue: "Where should the training take place?" },
    q5Hint: { type: ControlType.String, title: "Q5 — Hint", defaultValue: "We can accommodate any preference." },
    q6Text: { type: ControlType.String, title: "Q6 — Text", defaultValue: "Who should we address this to?" },
    q6Hint: { type: ControlType.String, title: "Q6 — Hint", defaultValue: "A company name or your first name works — entirely up to you." },
    // Style
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#2563EB",
    },
    cardStyle: {
        type: ControlType.Enum,
        title: "Card Style",
        defaultValue: "glass",
        options: ["glass", "solid"],
        optionTitles: ["Glass (frosted)", "Solid (white)"],
    },
    // CTA
    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "Book a Consultation",
    },
    ctaLink: {
        type: ControlType.String,
        title: "CTA Link",
        defaultValue: "mailto:pro@coded.com",
    },
})
