import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect, useRef, useCallback } from "react"

// ── Constants ────────────────────────────────────────────────────────────────
const NAVY = "#0B1D3A"
const BLUE = "#2563EB"
const BLUE_LIGHT = "#3B82F6"

// ── Spark SVG ────────────────────────────────────────────────────────────────
function Spark({ style }: { style?: React.CSSProperties }) {
    return (
        <svg viewBox="0 0 16 16" fill="none" style={style}>
            <path
                d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z"
                fill="currentColor"
            />
        </svg>
    )
}

// ── Floating Sparks Field ────────────────────────────────────────────────────
function SparksField({ color }: { color: string }) {
    const sparks = [
        { size: 12, top: "6%", left: "5%", delay: "0s", dur: "3.2s", opacity: 0.18 },
        { size: 7, top: "14%", left: "90%", delay: "0.6s", dur: "2.8s", opacity: 0.12 },
        { size: 16, top: "72%", left: "93%", delay: "1.1s", dur: "3.6s", opacity: 0.15 },
        { size: 9, top: "82%", left: "3%", delay: "1.8s", dur: "2.6s", opacity: 0.1 },
        { size: 5, top: "40%", left: "95%", delay: "0.3s", dur: "4s", opacity: 0.08 },
        { size: 14, top: "58%", left: "2%", delay: "2.1s", dur: "3s", opacity: 0.14 },
        { size: 6, top: "28%", left: "92%", delay: "0.9s", dur: "3.4s", opacity: 0.1 },
        { size: 10, top: "90%", left: "48%", delay: "1.5s", dur: "2.9s", opacity: 0.12 },
        { size: 4, top: "3%", left: "52%", delay: "2.4s", dur: "3.8s", opacity: 0.08 },
    ]

    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
            {sparks.map((s, i) => (
                <Spark
                    key={i}
                    style={{
                        position: "absolute",
                        top: s.top,
                        left: s.left,
                        width: s.size,
                        height: s.size,
                        color,
                        opacity: s.opacity,
                        animation: `sparkFloat ${s.dur} ease-in-out ${s.delay} infinite`,
                    }}
                />
            ))}
        </div>
    )
}

// ── Thinking Dots ────────────────────────────────────────────────────────────
function ThinkingDots() {
    return (
        <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "16px 0 8px" }}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: BLUE_LIGHT,
                        animation: `thinkBounce 1.1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                />
            ))}
        </div>
    )
}

// ── Chips ─────────────────────────────────────────────────────────────────────
function ChipGroup({
    options,
    multi = false,
    value,
    onChange,
    accent,
}: {
    options: string[]
    multi?: boolean
    value: string | string[] | null
    onChange: (val: any) => void
    accent: string
}) {
    const toggle = (opt: string) => {
        if (!multi) { onChange(opt); return }
        const current = Array.isArray(value) ? value : []
        onChange(current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt])
    }
    const isSelected = (opt: string) =>
        multi ? Array.isArray(value) && value.includes(opt) : value === opt

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {options.map((opt, idx) => (
                <button
                    key={opt}
                    onClick={() => toggle(opt)}
                    style={{
                        padding: "9px 18px",
                        borderRadius: 100,
                        fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        cursor: "pointer",
                        outline: "none",
                        whiteSpace: "nowrap",
                        border: isSelected(opt)
                            ? `1.5px solid ${accent}`
                            : `1.5px solid rgba(11,29,58,0.1)`,
                        background: isSelected(opt)
                            ? "rgba(37,99,235,0.08)"
                            : "rgba(255,255,255,0.7)",
                        color: isSelected(opt) ? accent : "rgba(11,29,58,0.55)",
                        boxShadow: isSelected(opt) ? "0 2px 12px rgba(37,99,235,0.12)" : "none",
                        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                        animation: `chipIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.06}s backwards`,
                    }}
                >
                    {opt}
                </button>
            ))}
        </div>
    )
}

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
function CODEDWorkshopFinder({
    workerUrl = "",
    accentColor = "#2563EB",
    ctaText = "Book a Consultation",
    ctaLink = "mailto:pro@coded.com",
}: {
    workerUrl?: string
    accentColor?: string
    ctaText?: string
    ctaLink?: string
}) {
    const [step, setStep] = useState(0)
    const [thinking, setThinking] = useState(false)
    const [answers, setAnswers] = useState({
        topic: "",
        duration: null as string | null,
        employees: null as string | null,
        location: null as string | null,
        audience: [] as string[],
        company: "",
        iterations: null as string | null,
    })
    const [results, setResults] = useState<AIResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const thinkTimer = useRef<any>(null)

    const steps = [
        { id: "topic" },
        { id: "audience" },
        { id: "duration" },
        { id: "employees" },
        { id: "location" },
        { id: "company" },
    ]

    const advanceWithThink = useCallback((updates: Record<string, any> = {}) => {
        const next = { ...answers, ...updates }
        setAnswers(next)

        if (step < steps.length - 1) {
            setThinking(true)
            clearTimeout(thinkTimer.current)
            thinkTimer.current = setTimeout(() => {
                setThinking(false)
                setStep((s) => s + 1)
            }, 450)
        } else {
            // Submit
            setStep(steps.length)
            setLoading(true)
            setError("")
            fetchRecommendations(next)
        }
    }, [answers, step])

    const fetchRecommendations = async (data: typeof answers) => {
        if (!workerUrl) {
            // Mock mode for preview
            setTimeout(() => {
                setResults({
                    greeting: data.company
                        ? `Here's what we'd recommend for ${data.company.split(" ")[0]}`
                        : "Your top picks",
                    recommendations: [
                        {
                            courseTitle: "AI Champions Workshop",
                            courseType: "Workshop",
                            duration: "4-6 Training Hours",
                            tag: "Artificial Intelligence",
                            whyThisFits: "A focused, high-impact session designed to get your team AI-fluent fast — perfect for the timeline and group size you described.",
                            description: "Half-day AI literacy sprint.",
                        },
                        {
                            courseTitle: "Data Analytics Sprint",
                            courseType: "Mid Course",
                            duration: "18-30 Training Hours",
                            tag: "Data Science",
                            whyThisFits: "Hands-on dashboards and data storytelling that your technical teams can apply immediately at work.",
                            description: "Practical data storytelling & dashboards course.",
                        },
                    ],
                    note: "Both programs can be delivered at your preferred location. We recommend starting with the workshop to gauge team readiness.",
                })
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
                    duration: data.duration || "",
                    teamSize: data.employees || "",
                    multipleIterations: data.iterations === "Multiple iterations",
                    location: data.location || "",
                    audience: data.audience,
                    companyName: data.company,
                    freeText: data.topic,
                }),
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => null)
                throw new Error(errData?.error || `Request failed (${res.status})`)
            }

            const apiData: AIResponse = await res.json()
            setResults(apiData)
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (step === 0 && inputRef.current) inputRef.current.focus()
    }, [step])

    useEffect(() => {
        return () => clearTimeout(thinkTimer.current)
    }, [])

    const reset = () => {
        setStep(0)
        setThinking(false)
        setAnswers({ topic: "", duration: null, employees: null, location: null, audience: [], company: "", iterations: null })
        setResults(null)
        setError("")
        setLoading(false)
    }

    // ── STYLES (injected as <style>) ──
    const css = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Syne:wght@600;700;800&display=swap');

        @keyframes sparkFloat {
            0%   { transform: translateY(0px) rotate(0deg) scale(1); opacity: var(--spark-o, 1); }
            25%  { transform: translateY(-8px) rotate(12deg) scale(1.2); opacity: calc(var(--spark-o, 1) * 1.4); }
            50%  { transform: translateY(-3px) rotate(-6deg) scale(0.85); opacity: calc(var(--spark-o, 1) * 0.7); }
            75%  { transform: translateY(-12px) rotate(8deg) scale(1.1); opacity: var(--spark-o, 1); }
            100% { transform: translateY(0px) rotate(0deg) scale(1); opacity: var(--spark-o, 1); }
        }

        @keyframes thinkBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.25; }
            40% { transform: translateY(-6px); opacity: 1; }
        }

        @keyframes stepIn {
            from { opacity: 0; transform: translateY(14px) scale(0.98); filter: blur(3px); }
            to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes chipIn {
            from { opacity: 0; transform: scale(0.85) translateY(6px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes dotPulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
        }
    `

    // ── Label style ──
    const labelStyle: React.CSSProperties = {
        margin: "0 0 4px",
        color: "rgba(11,29,58,0.6)",
        fontSize: 14.5,
        fontFamily: "'DM Sans', sans-serif",
    }

    const hintStyle: React.CSSProperties = {
        color: "rgba(11,29,58,0.3)",
        fontSize: 12,
    }

    return (
        <>
            <style>{css}</style>
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 480,
                    minHeight: 420,
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    borderRadius: 24,
                    padding: "36px 30px",
                    border: "1px solid rgba(11,29,58,0.06)",
                    boxShadow: "0 24px 64px rgba(11,29,58,0.08), 0 0 0 1px rgba(255,255,255,0.6) inset",
                    overflow: "hidden",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box",
                    zIndex: 1,
                }}
            >
                <SparksField color={accentColor} />

                {/* Header */}
                <div style={{ position: "relative", marginBottom: 28, zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Spark style={{ width: 16, height: 16, color: accentColor }} />
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: accentColor,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                            }}
                        >
                            CODED · Workshop Finder
                        </span>
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 700,
                            fontSize: 24,
                            color: NAVY,
                            lineHeight: 1.25,
                        }}
                    >
                        Find your perfect
                        <br />
                        training program
                    </h2>
                </div>

                {/* Progress bar */}
                {step < steps.length && !thinking && (
                    <div style={{ display: "flex", gap: 5, marginBottom: 26, position: "relative", zIndex: 1 }}>
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    height: 3,
                                    flex: 1,
                                    borderRadius: 99,
                                    background: i <= step ? accentColor : "rgba(11,29,58,0.06)",
                                    transition: "background 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Content area */}
                <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Thinking dots between steps */}
                    {thinking && <ThinkingDots />}

                    {/* STEP 0 — Topic */}
                    {!thinking && step === 0 && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <p style={labelStyle}>
                                What do you want your team to learn?{" "}
                                <span style={hintStyle}>(press Enter)</span>
                            </p>
                            <input
                                ref={inputRef}
                                placeholder="e.g. AI tools, data analytics, web dev..."
                                value={answers.topic}
                                onChange={(e) => setAnswers({ ...answers, topic: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && answers.topic.trim() && advanceWithThink()}
                                style={{
                                    background: "rgba(255,255,255,0.7)",
                                    border: "1.5px solid rgba(11,29,58,0.08)",
                                    borderRadius: 14,
                                    color: NAVY,
                                    fontSize: 15,
                                    fontFamily: "'DM Sans', sans-serif",
                                    padding: "13px 18px",
                                    width: "100%",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.3s, box-shadow 0.3s, background 0.3s",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = accentColor
                                    e.target.style.background = "#FFFFFF"
                                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(11,29,58,0.08)"
                                    e.target.style.background = "rgba(255,255,255,0.7)"
                                    e.target.style.boxShadow = "none"
                                }}
                            />
                            <p style={{ margin: "14px 0 0", color: "rgba(11,29,58,0.2)", fontSize: 12 }}>
                                Or jump straight in →
                            </p>
                            <button
                                onClick={() => advanceWithThink()}
                                style={{
                                    marginTop: 10,
                                    background: accentColor,
                                    color: "white",
                                    border: "none",
                                    borderRadius: 100,
                                    padding: "12px 26px",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    boxShadow: "0 4px 16px rgba(37,99,235,0.2)",
                                    transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                                }}
                            >
                                Skip & explore programs
                            </button>
                        </div>
                    )}

                    {/* STEP 1 — Audience (multi-select) */}
                    {!thinking && step === 1 && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <p style={labelStyle}>
                                Who's this training for?{" "}
                                <span style={hintStyle}>pick all that apply</span>
                            </p>
                            <ChipGroup
                                multi
                                options={["Fresh Graduates", "Technical Teams", "Executives", "Mixed Levels"]}
                                value={answers.audience}
                                onChange={(v) => setAnswers({ ...answers, audience: v })}
                                accent={accentColor}
                            />
                            <button
                                disabled={answers.audience.length === 0}
                                onClick={() => advanceWithThink()}
                                style={{
                                    marginTop: 20,
                                    opacity: answers.audience.length ? 1 : 0.35,
                                    background: accentColor,
                                    color: "white",
                                    border: "none",
                                    borderRadius: 100,
                                    padding: "12px 26px",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: answers.audience.length ? "pointer" : "default",
                                    boxShadow: answers.audience.length ? "0 4px 16px rgba(37,99,235,0.2)" : "none",
                                    transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                                }}
                            >
                                Continue →
                            </button>
                        </div>
                    )}

                    {/* STEP 2 — Duration */}
                    {!thinking && step === 2 && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <p style={labelStyle}>How long can your team commit?</p>
                            <ChipGroup
                                options={["1 day", "< 3 days", "< 3 weeks", "> 5 weeks"]}
                                value={answers.duration}
                                onChange={(v) => advanceWithThink({ duration: v })}
                                accent={accentColor}
                            />
                        </div>
                    )}

                    {/* STEP 3 — Employees */}
                    {!thinking && step === 3 && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <p style={labelStyle}>How many people are enrolling?</p>
                            <ChipGroup
                                options={["< 8 people", "12 – 15 people", "> 25 people"]}
                                value={answers.employees}
                                onChange={(v) => {
                                    setAnswers((a) => ({ ...a, employees: v }))
                                    if (v !== "> 25 people") advanceWithThink({ employees: v })
                                }}
                                accent={accentColor}
                            />
                            {answers.employees === "> 25 people" && (
                                <div style={{ marginTop: 16, animation: "stepIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                                    <p style={{ margin: "0 0 8px", color: "rgba(11,29,58,0.4)", fontSize: 13 }}>
                                        Will this run across multiple cohorts?
                                    </p>
                                    <ChipGroup
                                        options={["Single cohort", "Multiple iterations"]}
                                        value={answers.iterations}
                                        onChange={(v) => advanceWithThink({ iterations: v })}
                                        accent={accentColor}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4 — Location */}
                    {!thinking && step === 4 && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <p style={labelStyle}>Where should training take place?</p>
                            <ChipGroup
                                options={["At CODED HQ", "At our office", "Flexible / Online"]}
                                value={answers.location}
                                onChange={(v) => advanceWithThink({ location: v })}
                                accent={accentColor}
                            />
                        </div>
                    )}

                    {/* STEP 5 — Company */}
                    {!thinking && step === 5 && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <p style={labelStyle}>Last one — who should we address the proposal to?</p>
                            <p style={{ margin: "0 0 12px", color: "rgba(11,29,58,0.2)", fontSize: 12 }}>
                                Company name is totally optional — first name works too.
                            </p>
                            <input
                                placeholder="e.g. KFH, Ministry of Finance, or just Omar"
                                value={answers.company}
                                onChange={(e) => setAnswers({ ...answers, company: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && advanceWithThink()}
                                autoFocus
                                style={{
                                    background: "rgba(255,255,255,0.7)",
                                    border: "1.5px solid rgba(11,29,58,0.08)",
                                    borderRadius: 14,
                                    color: NAVY,
                                    fontSize: 15,
                                    fontFamily: "'DM Sans', sans-serif",
                                    padding: "13px 18px",
                                    width: "100%",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.3s, box-shadow 0.3s, background 0.3s",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = accentColor
                                    e.target.style.background = "#FFFFFF"
                                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(11,29,58,0.08)"
                                    e.target.style.background = "rgba(255,255,255,0.7)"
                                    e.target.style.boxShadow = "none"
                                }}
                            />
                            <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
                                <button
                                    onClick={() => advanceWithThink()}
                                    style={{
                                        background: accentColor,
                                        color: "white",
                                        border: "none",
                                        borderRadius: 100,
                                        padding: "12px 26px",
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: "pointer",
                                        boxShadow: "0 4px 16px rgba(37,99,235,0.2)",
                                        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                                    }}
                                >
                                    See my recommendations →
                                </button>
                                <button
                                    onClick={() => advanceWithThink()}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "rgba(11,29,58,0.3)",
                                        fontSize: 13,
                                        cursor: "pointer",
                                        padding: "12px 0",
                                        fontFamily: "'DM Sans', sans-serif",
                                        transition: "color 0.2s",
                                    }}
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── LOADING ── */}
                    {step === steps.length && loading && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                <Spark
                                    style={{
                                        width: 16,
                                        height: 16,
                                        color: accentColor,
                                        animation: "sparkFloat 1.5s ease-in-out infinite",
                                    }}
                                />
                                <span style={{ color: accentColor, fontSize: 14, fontWeight: 500 }}>
                                    Analyzing our catalog for you...
                                </span>
                            </div>
                            <ThinkingDots />
                        </div>
                    )}

                    {/* ── ERROR ── */}
                    {step === steps.length && !loading && error && (
                        <div style={{ animation: "stepIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                            <p style={{ margin: "0 0 12px", color: "#DC2626", fontSize: 14 }}>{error}</p>
                            <button
                                onClick={() => { setStep(5); setError("") }}
                                style={{
                                    background: accentColor,
                                    color: "white",
                                    border: "none",
                                    borderRadius: 100,
                                    padding: "12px 26px",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    boxShadow: "0 4px 16px rgba(37,99,235,0.2)",
                                }}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* ── RESULTS ── */}
                    {step === steps.length && !loading && results && (
                        <div style={{ animation: "stepIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                                <Spark style={{ width: 14, height: 14, color: accentColor }} />
                                <span style={{ color: accentColor, fontSize: 13, fontWeight: 600 }}>
                                    {results.greeting || "Your top picks"}
                                </span>
                            </div>

                            {results.recommendations?.map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: "rgba(255,255,255,0.6)",
                                        border: "1px solid rgba(11,29,58,0.06)",
                                        borderRadius: 16,
                                        padding: "18px 20px",
                                        marginBottom: 10,
                                        animation: `chipIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.15}s backwards`,
                                        transition: "border-color 0.3s, box-shadow 0.3s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ flex: 1 }}>
                                            <p
                                                style={{
                                                    margin: "0 0 4px",
                                                    fontFamily: "'Syne', sans-serif",
                                                    fontWeight: 700,
                                                    color: NAVY,
                                                    fontSize: 16,
                                                }}
                                            >
                                                {r.courseTitle}
                                            </p>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: "rgba(11,29,58,0.5)",
                                                    fontSize: 13,
                                                    lineHeight: 1.55,
                                                }}
                                            >
                                                {r.whyThisFits || r.description}
                                            </p>
                                        </div>
                                        {i === 0 && (
                                            <span
                                                style={{
                                                    background: "rgba(37,99,235,0.08)",
                                                    color: accentColor,
                                                    borderRadius: 100,
                                                    padding: "3px 10px",
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    whiteSpace: "nowrap",
                                                    marginLeft: 10,
                                                }}
                                            >
                                                Best Match
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                                        {[r.courseType, r.duration, r.tag].filter(Boolean).map((tag) => (
                                            <span
                                                key={tag}
                                                style={{
                                                    background: "rgba(11,29,58,0.04)",
                                                    color: "rgba(11,29,58,0.4)",
                                                    borderRadius: 100,
                                                    padding: "3px 10px",
                                                    fontSize: 11,
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {results.note && (
                                <p
                                    style={{
                                        margin: "10px 0 16px",
                                        color: "rgba(11,29,58,0.35)",
                                        fontSize: 12,
                                        fontStyle: "italic",
                                    }}
                                >
                                    {results.note}
                                </p>
                            )}

                            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <a
                                    href={ctaLink}
                                    style={{
                                        display: "inline-block",
                                        background: accentColor,
                                        color: "white",
                                        borderRadius: 100,
                                        padding: "12px 24px",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        textDecoration: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        boxShadow: "0 4px 16px rgba(37,99,235,0.2)",
                                        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                                    }}
                                >
                                    {ctaText}
                                </a>
                                <button
                                    onClick={reset}
                                    style={{
                                        background: "transparent",
                                        border: "1px solid rgba(11,29,58,0.1)",
                                        color: "rgba(11,29,58,0.4)",
                                        borderRadius: 100,
                                        padding: "11px 20px",
                                        fontSize: 13,
                                        cursor: "pointer",
                                        fontFamily: "'DM Sans', sans-serif",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    Start over
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

// ── Framer Property Controls ──────────────────────────────────────────────────
addPropertyControls(CODEDWorkshopFinder, {
    workerUrl: {
        title: "Worker URL",
        type: ControlType.String,
        defaultValue: "",
        description: "Your Cloudflare Worker base URL (no trailing slash). Leave empty for mock/preview mode.",
    },
    accentColor: {
        title: "Accent Color",
        type: ControlType.Color,
        defaultValue: "#2563EB",
    },
    ctaText: {
        title: "CTA Text",
        type: ControlType.String,
        defaultValue: "Book a Consultation",
    },
    ctaLink: {
        title: "CTA Link",
        type: ControlType.String,
        defaultValue: "mailto:pro@coded.com",
    },
})

export default CODEDWorkshopFinder
