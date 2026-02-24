import { useState, useEffect, useRef } from "react";

// ── Spark SVG ──────────────────────────────────────────────────────────────
function Spark({ style }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ── Floating Sparks Field ──────────────────────────────────────────────────
function SparksField() {
  const sparks = [
    { size: 14, top: "8%",  left: "6%",  delay: "0s",    dur: "3.2s", opacity: 0.9 },
    { size: 8,  top: "15%", left: "88%", delay: "0.6s",  dur: "2.8s", opacity: 0.6 },
    { size: 20, top: "70%", left: "92%", delay: "1.1s",  dur: "3.6s", opacity: 0.85 },
    { size: 10, top: "80%", left: "4%",  delay: "1.8s",  dur: "2.6s", opacity: 0.5 },
    { size: 6,  top: "45%", left: "96%", delay: "0.3s",  dur: "4s",   opacity: 0.4 },
    { size: 16, top: "55%", left: "2%",  delay: "2.1s",  dur: "3s",   opacity: 0.7 },
    { size: 7,  top: "30%", left: "93%", delay: "0.9s",  dur: "3.4s", opacity: 0.55 },
    { size: 12, top: "88%", left: "50%", delay: "1.5s",  dur: "2.9s", opacity: 0.65 },
    { size: 5,  top: "5%",  left: "50%", delay: "2.4s",  dur: "3.8s", opacity: 0.45 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {sparks.map((s, i) => (
        <Spark
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            color: "#4FC3F7",
            opacity: s.opacity,
            animation: `sparkFloat ${s.dur} ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Chips ──────────────────────────────────────────────────────────────────
function ChipGroup({ options, multi = false, value, onChange }) {
  const toggle = (opt) => {
    if (!multi) {
      onChange(opt);
      return;
    }
    const current = Array.isArray(value) ? value : [];
    onChange(
      current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt]
    );
  };
  const isSelected = (opt) =>
    multi ? (Array.isArray(value) && value.includes(opt)) : value === opt;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          style={{
            padding: "7px 14px",
            borderRadius: 100,
            border: isSelected(opt) ? "1.5px solid #4FC3F7" : "1.5px solid rgba(255,255,255,0.18)",
            background: isSelected(opt) ? "rgba(79,195,247,0.18)" : "rgba(255,255,255,0.05)",
            color: isSelected(opt) ? "#4FC3F7" : "rgba(255,255,255,0.75)",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            transition: "all 0.18s ease",
            outline: "none",
            backdropFilter: "blur(4px)",
            whiteSpace: "nowrap",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Step bubble ────────────────────────────────────────────────────────────
function Bubble({ children, delay = 0, visible }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.4s ease ${delay}s, transform 0.4s cubic-bezier(.34,1.56,.64,1) ${delay}s`,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

// ── COURSES DATA ───────────────────────────────────────────────────────────
const COURSES = [
  { id: "AI-CHAMP", name: "AI Champions", duration: "1 day", audience: ["Executives", "Mixed"], size: "<8", desc: "Half-day AI literacy sprint for leadership teams." },
  { id: "AI-BOOT",  name: "AI App Developer Bootcamp", duration: "> 5 weeks", audience: ["Technical", "Fresh Grads"], size: "12–15", desc: "Full immersive vibe-coding program." },
  { id: "FULLSTACK",name: "Full-Stack Bootcamp", duration: "> 5 weeks", audience: ["Fresh Grads", "Technical"], size: "12–15", desc: "End-to-end web development mastery." },
  { id: "DATA",     name: "Data Analytics Sprint", duration: "< 3 weeks", audience: ["Technical", "Executives"], size: "<8", desc: "Practical data storytelling & dashboards." },
  { id: "PM",       name: "Product Management Intensive", duration: "< 3 weeks", audience: ["Executives", "Mixed"], size: "12–15", desc: "Build & pitch products like a PM." },
  { id: "CORP",     name: "Corporate AI Transformation", duration: "< 3 days", audience: ["Executives", "Mixed"], size: ">25", desc: "Large-scale AI upskilling for enterprise." },
];

function recommend({ audience, duration, employees, location, topic }) {
  let scored = COURSES.map((c) => {
    let score = 0;
    const aud = Array.isArray(audience) ? audience : [audience];
    if (aud.some((a) => c.audience.includes(a))) score += 3;
    if (c.duration === duration) score += 2;
    if (c.size === employees) score += 1;
    if (topic && c.name.toLowerCase().includes(topic.toLowerCase().split(" ")[0])) score += 2;
    return { ...c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2);
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function CODEDFinder() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [answers, setAnswers] = useState({
    topic: "", duration: null, employees: null,
    location: null, audience: [], company: "", iterations: null,
  });
  const [results, setResults] = useState(null);
  const [typing, setTyping] = useState(false);
  const inputRef = useRef();

  // Steps definition
  const steps = [
    { id: "topic" },
    { id: "audience" },
    { id: "duration" },
    { id: "employees" },
    { id: "location" },
    { id: "company" },
  ];

  const advance = (updates = {}) => {
    const next = { ...answers, ...updates };
    setAnswers(next);
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      // recommend
      const recs = recommend(next);
      setResults(recs);
      setStep(steps.length);
    }
  };

  const handleTopicSubmit = (e) => {
    if (e.key === "Enter" && answers.topic.trim()) advance();
  };

  const needIterations = answers.employees === ">25";
  const totalSteps = needIterations ? steps.length + 1 : steps.length;

  // auto-focus input on step 0
  useEffect(() => {
    if (step === 0 && inputRef.current) inputRef.current.focus();
  }, [step]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');

        @keyframes sparkFloat {
          0%   { transform: translateY(0px) rotate(0deg) scale(1); }
          25%  { transform: translateY(-8px) rotate(12deg) scale(1.15); }
          50%  { transform: translateY(-4px) rotate(-6deg) scale(0.9); }
          75%  { transform: translateY(-11px) rotate(8deg) scale(1.05); }
          100% { transform: translateY(0px) rotate(0deg) scale(1); }
        }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-ring {
          0%   { transform: scale(0.92); opacity: 0.6; }
          50%  { transform: scale(1.04); opacity: 0.2; }
          100% { transform: scale(0.92); opacity: 0.6; }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .coded-input {
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          color: white;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          padding: 12px 16px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .coded-input:focus { border-color: #4FC3F7; }
        .coded-input::placeholder { color: rgba(255,255,255,0.3); }

        .result-card {
          background: rgba(79,195,247,0.08);
          border: 1px solid rgba(79,195,247,0.25);
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 10px;
          animation: fadeSlide 0.5s ease forwards;
        }

        .cta-btn {
          background: #4FC3F7;
          color: #0A1628;
          border: none;
          border-radius: 100px;
          padding: 11px 24px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.2s, transform 0.15s;
        }
        .cta-btn:hover { background: #81D4FA; transform: translateY(-1px); }
      `}</style>

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 480,
        minHeight: 460,
        background: "linear-gradient(145deg, #0A1628 0%, #0D1F3C 60%, #0A2040 100%)",
        borderRadius: 24,
        padding: "32px 28px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,195,247,0.1)",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        boxSizing: "border-box",
      }}>

        <SparksField />

        {/* Header */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Spark style={{ width: 16, height: 16, color: "#4FC3F7" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4FC3F7", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              CODED · Program Finder
            </span>
          </div>
          <h2 style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "white",
            lineHeight: 1.25,
          }}>
            Find your perfect<br />training program
          </h2>
        </div>

        {/* Progress dots */}
        {step < steps.length && (
          <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                height: 3,
                flex: 1,
                borderRadius: 99,
                background: i <= step ? "#4FC3F7" : "rgba(255,255,255,0.12)",
                transition: "background 0.3s ease",
              }} />
            ))}
          </div>
        )}

        {/* ── STEPS ─────────────────────────── */}
        <div style={{ position: "relative" }}>

          {/* STEP 0 — Topic */}
          {step === 0 && (
            <div style={{ animation: "fadeSlide 0.4s ease" }}>
              <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                What do you want your team to learn? <span style={{ color: "rgba(255,255,255,0.35)" }}>(press Enter)</span>
              </p>
              <input
                ref={inputRef}
                className="coded-input"
                placeholder="e.g. AI tools, data analytics, web dev..."
                value={answers.topic}
                onChange={(e) => setAnswers({ ...answers, topic: e.target.value })}
                onKeyDown={handleTopicSubmit}
              />
              <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                Or jump straight in →
              </p>
              <button className="cta-btn" style={{ marginTop: 8 }} onClick={() => advance()}>
                Skip & explore programs
              </button>
            </div>
          )}

          {/* STEP 1 — Audience */}
          {step === 1 && (
            <div style={{ animation: "fadeSlide 0.4s ease" }}>
              <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                Who's this training for?{" "}
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>pick all that apply</span>
              </p>
              <ChipGroup
                multi
                options={["Fresh Graduates", "Technical Teams", "Executives", "Mixed Levels"]}
                value={answers.audience}
                onChange={(v) => setAnswers({ ...answers, audience: v })}
              />
              <button
                className="cta-btn"
                disabled={answers.audience.length === 0}
                style={{ opacity: answers.audience.length === 0 ? 0.4 : 1, marginTop: 18 }}
                onClick={() => advance()}
              >
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2 — Duration */}
          {step === 2 && (
            <div style={{ animation: "fadeSlide 0.4s ease" }}>
              <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                How long can your team commit?
              </p>
              <ChipGroup
                options={["1 day", "< 3 days", "< 3 weeks", "> 5 weeks"]}
                value={answers.duration}
                onChange={(v) => advance({ duration: v })}
              />
            </div>
          )}

          {/* STEP 3 — Employees */}
          {step === 3 && (
            <div style={{ animation: "fadeSlide 0.4s ease" }}>
              <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                How many people are enrolling?
              </p>
              <ChipGroup
                options={["< 8 people", "12 – 15 people", "> 25 people"]}
                value={answers.employees}
                onChange={(v) => {
                  setAnswers({ ...answers, employees: v });
                  if (v !== "> 25 people") advance({ employees: v });
                  else setAnswers((a) => ({ ...a, employees: v }));
                }}
              />
              {answers.employees === "> 25 people" && (
                <div style={{ marginTop: 14, animation: "fadeSlide 0.3s ease" }}>
                  <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                    Will this run across multiple cohorts?
                  </p>
                  <ChipGroup
                    options={["Single cohort", "Multiple iterations"]}
                    value={answers.iterations}
                    onChange={(v) => advance({ iterations: v })}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Location */}
          {step === 4 && (
            <div style={{ animation: "fadeSlide 0.4s ease" }}>
              <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                Where should training take place?
              </p>
              <ChipGroup
                options={["At CODED HQ", "At our office", "Flexible / Online"]}
                value={answers.location}
                onChange={(v) => advance({ location: v })}
              />
            </div>
          )}

          {/* STEP 5 — Company (relaxed) */}
          {step === 5 && (
            <div style={{ animation: "fadeSlide 0.4s ease" }}>
              <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                Last one — who should we address the proposal to?
              </p>
              <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                Company name is totally optional — first name works too.
              </p>
              <input
                className="coded-input"
                placeholder="e.g. KFH, Ministry of Finance, or just Omar 👋"
                value={answers.company}
                onChange={(e) => setAnswers({ ...answers, company: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && advance()}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="cta-btn" onClick={() => advance()}>
                  See my recommendations →
                </button>
                <button
                  onClick={() => advance()}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "11px 0",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* ── RESULTS ─────────────────────────── */}
          {step === steps.length && results && (
            <div style={{ animation: "fadeSlide 0.5s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Spark style={{ width: 14, height: 14, color: "#4FC3F7" }} />
                <span style={{ color: "#4FC3F7", fontSize: 13, fontWeight: 600 }}>
                  {answers.company ? `Here's what we'd recommend for ${answers.company.split(" ")[0]}` : "Your top picks"}
                </span>
              </div>

              {results.map((r, i) => (
                <div key={r.id} className="result-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: "0 0 4px", fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "white", fontSize: 16 }}>
                        {r.name}
                      </p>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.5 }}>
                        {r.desc}
                      </p>
                    </div>
                    {i === 0 && (
                      <span style={{
                        background: "rgba(79,195,247,0.2)", color: "#4FC3F7",
                        borderRadius: 100, padding: "3px 10px", fontSize: 11,
                        fontWeight: 600, whiteSpace: "nowrap", marginLeft: 10,
                      }}>
                        Best Match
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {[r.duration, r.size, ...r.audience.slice(0, 1)].map((tag) => (
                      <span key={tag} style={{
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.5)",
                        borderRadius: 100, padding: "2px 10px", fontSize: 11,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  href="mailto:pro@coded.com"
                  style={{
                    display: "inline-block",
                    background: "#4FC3F7",
                    color: "#0A1628",
                    borderRadius: 100,
                    padding: "10px 22px",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Book a consultation
                </a>
                <button
                  onClick={() => { setStep(0); setAnswers({ topic: "", duration: null, employees: null, location: null, audience: [], company: "", iterations: null }); setResults(null); }}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.5)",
                    borderRadius: 100,
                    padding: "10px 18px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Start over
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Bottom noise texture overlay */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 24,
          background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
          pointerEvents: "none", opacity: 0.4,
        }} />
      </div>
    </>
  );
}
