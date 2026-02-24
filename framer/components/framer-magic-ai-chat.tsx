// CODED Program Finder — Framer Component
// Drop this file into your Framer project via Assets > Code > New File
// Then drag it onto any frame or section on your canvas.

import { useState, useEffect, useRef } from "react";
import { addPropertyControls, ControlType } from "framer";

// ── Types ──────────────────────────────────────────────────────────────────
interface State {
  step: number;
  direction: "forward" | "back";
  employees: string | null;
  iterations: string | null;
  field: string[];
  duration: string | null;
  audience: string[];
  location: string | null;
  company: string;
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
};

const STEPS = [
  "employees",
  "field",
  "duration",
  "audience",
  "location",
  "company",
] as const;

// ── Courses ────────────────────────────────────────────────────────────────
const COURSES = [
  {
    id: "AI-BOOT",
    name: "AI App Developer Bootcamp",
    duration: "> 5 weeks",
    audience: ["Technical Teams", "Fresh Graduates"],
    fields: ["AI"],
    size: "12 – 15",
    desc: "Hands-on vibe-coding program — build real AI-powered products from day one.",
  },
  {
    id: "AI-CHAMP",
    name: "AI Champions Program",
    duration: "1 day",
    audience: ["Executives", "Mixed Levels"],
    fields: ["AI"],
    size: "< 8",
    desc: "Strategic AI literacy for leadership — think differently about automation & tools.",
  },
  {
    id: "FULLSTACK",
    name: "Full-Stack Bootcamp",
    duration: "> 5 weeks",
    audience: ["Fresh Graduates", "Technical Teams"],
    fields: ["Full-Stack"],
    size: "12 – 15",
    desc: "End-to-end web development mastery — from design to deployment.",
  },
  {
    id: "DATA",
    name: "Data Analytics Sprint",
    duration: "< 3 weeks",
    audience: ["Technical Teams", "Executives"],
    fields: ["Data"],
    size: "< 8",
    desc: "Practical data storytelling, SQL, and dashboards that drive decisions.",
  },
  {
    id: "CYBER",
    name: "Cybersecurity Foundations",
    duration: "< 3 weeks",
    audience: ["Technical Teams", "Mixed Levels"],
    fields: ["Cybersecurity"],
    size: "< 8",
    desc: "Essential threat awareness, security protocols, and hands-on defence techniques.",
  },
  {
    id: "CORP-AI",
    name: "Corporate AI Transformation",
    duration: "< 3 days",
    audience: ["Executives", "Mixed Levels"],
    fields: ["AI"],
    size: "> 25",
    desc: "Large-scale AI upskilling across departments — strategy to execution.",
  },
  {
    id: "CORP-DS",
    name: "Data Science for Enterprise",
    duration: "< 3 weeks",
    audience: ["Technical Teams"],
    fields: ["Data"],
    size: "> 25",
    desc: "Scalable data science training — from analytics to ML pipelines.",
  },
];

const SIZE_MAP: Record<string, string> = {
  "< 8 people": "< 8",
  "12 – 15 people": "12 – 15",
  "> 25 people": "> 25",
};

function recommend(s: State) {
  const scored = COURSES.map((c) => {
    let score = 0;
    if (s.audience.some((a) => c.audience.includes(a))) score += 3;
    if (s.field.some((f) => c.fields.includes(f))) score += 3;
    if (c.duration === s.duration) score += 2;
    if (s.employees && c.size === SIZE_MAP[s.employees]) score += 1;
    return { ...c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2);
}

// ── Spark SVG ──────────────────────────────────────────────────────────────
function Spark({
  size,
  color,
  opacity,
  top,
  left,
  duration,
  delay,
}: {
  size: number;
  color: string;
  opacity: number;
  top: string;
  left: string;
  duration: string;
  delay: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        color,
        opacity,
        animation: `codedSparkFloat ${duration} ease-in-out ${delay} infinite`,
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" />
      </svg>
    </div>
  );
}

// ── Chip ───────────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "9px 18px",
        borderRadius: 100,
        border: `1.5px solid ${selected ? "#1565C0" : hovered ? "#1565C0" : "#DDE3EC"}`,
        background: selected ? "#1565C0" : hovered ? "#EEF4FF" : "#F8FAFB",
        color: selected ? "#fff" : hovered ? "#1565C0" : "#3A4D63",
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.16s ease",
        outline: "none",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {label}
    </button>
  );
}

// ── Field Card ─────────────────────────────────────────────────────────────
const FIELD_META: Record<string, { icon: string; sub: string }> = {
  AI: { icon: "✦", sub: "Tools, agents & automation" },
  Cybersecurity: { icon: "🛡", sub: "Threat defence & protocols" },
  Data: { icon: "◈", sub: "Analytics & data science" },
  "Full-Stack": { icon: "⬡", sub: "Web development" },
};

function FieldCard({
  id,
  selected,
  onClick,
}: {
  id: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meta = FIELD_META[id];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "14px 18px",
        borderRadius: 14,
        border: `1.5px solid ${selected ? "#1565C0" : hovered ? "#1565C0" : "#DDE3EC"}`,
        background: selected ? "#1565C0" : hovered ? "#EEF4FF" : "#F8FAFB",
        color: selected ? "#fff" : hovered ? "#1565C0" : "#3A4D63",
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.16s ease",
        outline: "none",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 10,
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: selected
            ? "rgba(255,255,255,0.2)"
            : "rgba(21,101,192,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {meta.icon}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{id}</div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.65,
            marginTop: 1,
          }}
        >
          {meta.sub}
        </div>
      </div>
    </button>
  );
}

// ── BackArrow ──────────────────────────────────────────────────────────────
function BackBtn({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Back"
      style={{
        width: 38,
        height: 38,
        borderRadius: 100,
        border: `1.5px solid ${hovered ? "#1565C0" : "#DDE3EC"}`,
        background: "white",
        color: hovered ? "#1565C0" : "#7A8899",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.16s",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13L5 8L10 3" />
      </svg>
    </button>
  );
}

// ── PrimaryBtn ─────────────────────────────────────────────────────────────
function PrimaryBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: disabled ? "#DDE3EC" : hovered ? "#1565C0" : "#0A1628",
        color: disabled ? "#A0AEBD" : "white",
        border: "none",
        borderRadius: 100,
        padding: "11px 26px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: 14,
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.18s, transform 0.12s",
        outline: "none",
        transform: hovered && !disabled ? "translateY(-1px)" : "none",
      }}
    >
      {children}
    </button>
  );
}

// ── GhostBtn ───────────────────────────────────────────────────────────────
function GhostBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "transparent",
        border: "none",
        color: hovered ? "#3A4D63" : "#A0AEBD",
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
        cursor: "pointer",
        padding: "11px 6px",
        transition: "color 0.15s",
        outline: "none",
      }}
    >
      {children}
    </button>
  );
}

// ── Step wrapper (animated) ────────────────────────────────────────────────
function StepWrapper({
  children,
  direction,
  stepKey,
}: {
  children: React.ReactNode;
  direction: "forward" | "back";
  stepKey: string | number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0)"
          : direction === "back"
            ? "translateX(-18px)"
            : "translateX(18px)",
        transition:
          "opacity 0.32s ease, transform 0.32s cubic-bezier(.22,1,.36,1)",
      }}
    >
      {children}
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────
function ResultCard({
  course,
  best,
  delay,
}: {
  course: (typeof COURSES)[0];
  best: boolean;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1.5px solid ${hovered ? "#1565C0" : best ? "#1565C0" : "#E4EAF3"}`,
        borderRadius: 16,
        padding: "20px",
        background: best
          ? "linear-gradient(145deg, #F0F6FF, #FAFCFF)"
          : "white",
        position: "relative",
        overflow: "hidden",
        transition:
          "border-color 0.18s, box-shadow 0.18s, opacity 0.4s, transform 0.4s",
        boxShadow: hovered ? "0 4px 20px rgba(21,101,192,0.1)" : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {/* Top accent line */}
      {best && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "#1565C0",
            borderRadius: "16px 16px 0 0",
          }}
        />
      )}
      {best && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "#EEF4FF",
            color: "#1565C0",
            borderRadius: 100,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          <svg width={9} height={9} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" />
          </svg>
          Best Match
        </div>
      )}
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: "#0A1628",
          marginBottom: 5,
          lineHeight: 1.3,
        }}
      >
        {course.name}
      </p>
      <p
        style={{
          fontSize: 12.5,
          color: "#7A8899",
          lineHeight: 1.55,
          marginBottom: 12,
        }}
      >
        {course.desc}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {[course.duration, course.size + " people", course.audience[0]].map(
          (t) => (
            <span
              key={t}
              style={{
                background: best ? "rgba(21,101,192,0.08)" : "#F0F4F8",
                color: best ? "#1565C0" : "#7A8899",
                borderRadius: 100,
                padding: "3px 10px",
                fontSize: 11,
              }}
            >
              {t}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CODEDProgramFinder({
  ctaEmail = "pro@coded.com",
  accentColor = "#1565C0",
}: {
  ctaEmail?: string;
  accentColor?: string;
}) {
  const [s, setS] = useState<State>(INITIAL_STATE);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (STEPS[s.step] === "company" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [s.step]);

  const update = (patch: Partial<State>) =>
    setS((prev) => ({ ...prev, ...patch }));

  const advance = () => {
    if (s.step < STEPS.length - 1) {
      update({ step: s.step + 1, direction: "forward" });
    } else {
      setShowResults(true);
    }
  };

  const goBack = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (s.step > 0) update({ step: s.step - 1, direction: "back" });
  };

  const restart = () => {
    setShowResults(false);
    setS(INITIAL_STATE);
  };

  const toggleMulti = (key: "field" | "audience", val: string) => {
    const arr = s[key] as string[];
    update({
      [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
    });
  };

  const progressPct = (s.step / STEPS.length) * 100;

  // ── Step Renders ─────────────────────────────────────────────────────
  const renderStep = () => {
    const stepId = STEPS[s.step];

    if (stepId === "employees")
      return (
        <StepWrapper direction={s.direction} stepKey={s.step}>
          <p style={styles.q}>How many people will be enrolling?</p>
          <p style={styles.hint}>
            We'll use this to match group size and format.
          </p>
          <div style={styles.chips}>
            {["< 8 people", "12 – 15 people", "> 25 people"].map((o) => (
              <Chip
                key={o}
                label={o}
                selected={s.employees === o}
                onClick={() => {
                  update({
                    employees: o,
                    iterations: null,
                  });
                  if (o !== "> 25 people") setTimeout(advance, 130);
                }}
              />
            ))}
          </div>
          {s.employees === "> 25 people" && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #EEF1F6",
                animation: "codedFadeUp 0.28s ease",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#7A8899",
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                Will this run across multiple cohorts?
              </p>
              <div style={styles.chips}>
                {["Single cohort", "Multiple iterations"].map((o) => (
                  <Chip
                    key={o}
                    label={o}
                    selected={s.iterations === o}
                    onClick={() => {
                      update({ iterations: o });
                      setTimeout(advance, 130);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div style={styles.nav}>
            <BackBtn onClick={goBack} />
          </div>
        </StepWrapper>
      );

    if (stepId === "field")
      return (
        <StepWrapper direction={s.direction} stepKey={s.step}>
          <p style={styles.q}>Which field is this training in?</p>
          <p style={styles.hint}>You can select more than one.</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {["AI", "Cybersecurity", "Data", "Full-Stack"].map((f) => (
              <FieldCard
                key={f}
                id={f}
                selected={s.field.includes(f)}
                onClick={() => toggleMulti("field", f)}
              />
            ))}
          </div>
          <div style={styles.nav}>
            <BackBtn onClick={goBack} />
            <PrimaryBtn onClick={advance} disabled={s.field.length === 0}>
              Continue →
            </PrimaryBtn>
          </div>
        </StepWrapper>
      );

    if (stepId === "duration")
      return (
        <StepWrapper direction={s.direction} stepKey={s.step}>
          <p style={styles.q}>How long can your team commit to training?</p>
          <p style={styles.hint}>
            Shorter doesn't mean less impact — we design for both.
          </p>
          <div style={styles.chips}>
            {["1 day", "< 3 days", "< 3 weeks", "> 5 weeks"].map((o) => (
              <Chip
                key={o}
                label={o}
                selected={s.duration === o}
                onClick={() => {
                  update({ duration: o });
                  setTimeout(advance, 130);
                }}
              />
            ))}
          </div>
          <div style={styles.nav}>
            <BackBtn onClick={goBack} />
          </div>
        </StepWrapper>
      );

    if (stepId === "audience")
      return (
        <StepWrapper direction={s.direction} stepKey={s.step}>
          <p style={styles.q}>Who's this training for?</p>
          <p style={styles.hint}>Select all that apply.</p>
          <div style={styles.chips}>
            {[
              "Fresh Graduates",
              "Technical Teams",
              "Executives",
              "Mixed Levels",
            ].map((o) => (
              <Chip
                key={o}
                label={o}
                selected={s.audience.includes(o)}
                onClick={() => toggleMulti("audience", o)}
              />
            ))}
          </div>
          <div style={styles.nav}>
            <BackBtn onClick={goBack} />
            <PrimaryBtn onClick={advance} disabled={s.audience.length === 0}>
              Continue →
            </PrimaryBtn>
          </div>
        </StepWrapper>
      );

    if (stepId === "location")
      return (
        <StepWrapper direction={s.direction} stepKey={s.step}>
          <p style={styles.q}>Where should the training take place?</p>
          <p style={styles.hint}>We can accommodate any preference.</p>
          <div style={styles.chips}>
            {["At CODED HQ", "At our office", "Flexible / Online"].map((o) => (
              <Chip
                key={o}
                label={o}
                selected={s.location === o}
                onClick={() => {
                  update({ location: o });
                  setTimeout(advance, 130);
                }}
              />
            ))}
          </div>
          <div style={styles.nav}>
            <BackBtn onClick={goBack} />
          </div>
        </StepWrapper>
      );

    if (stepId === "company")
      return (
        <StepWrapper direction={s.direction} stepKey={s.step}>
          <p style={styles.q}>Who should we address this to?</p>
          <p style={styles.hint}>
            A company name or your first name works — entirely up to you.
          </p>
          <input
            ref={inputRef}
            placeholder="Type here…"
            value={s.company}
            onChange={(e) => update({ company: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && advance()}
            style={{
              width: "100%",
              background: "#F8FAFB",
              border: "1.5px solid #DDE3EC",
              borderRadius: 12,
              color: "#0A1628",
              fontSize: 15,
              fontFamily: "'DM Sans', sans-serif",
              padding: "13px 16px",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#1565C0";
              e.target.style.boxShadow = "0 0 0 3px rgba(21,101,192,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#DDE3EC";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={styles.nav}>
            <BackBtn onClick={goBack} />
            <PrimaryBtn onClick={advance}>See recommendations →</PrimaryBtn>
            <GhostBtn onClick={advance}>Skip</GhostBtn>
          </div>
        </StepWrapper>
      );

    return null;
  };

  // ── Results ──────────────────────────────────────────────────────────
  const renderResults = () => {
    const recs = recommend(s);
    const name = s.company.trim().split(" ")[0] || null;

    return (
      <StepWrapper direction="forward" stepKey="results">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 6,
          }}
        >
          <svg width={13} height={13} viewBox="0 0 16 16" fill="#1565C0">
            <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#1565C0",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
            }}
          >
            Your recommendations
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "#0A1628",
            marginBottom: 4,
          }}
        >
          {name
            ? `Here's what we'd recommend for ${name}`
            : "Your top program picks"}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#9AAABB",
            marginBottom: 20,
          }}
        >
          Our advisors will tailor the details to your team.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {recs.map((r, i) => (
            <ResultCard key={r.id} course={r} best={i === 0} delay={i * 100} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
            flexWrap: "wrap" as const,
          }}
        >
          <a
            href={`mailto:${ctaEmail}`}
            style={{
              background: "#0A1628",
              color: "white",
              borderRadius: 100,
              padding: "11px 26px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Book a consultation
          </a>
          <button
            onClick={restart}
            style={{
              background: "transparent",
              border: "1.5px solid #DDE3EC",
              color: "#7A8899",
              borderRadius: 100,
              padding: "10px 20px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              cursor: "pointer",
              outline: "none",
            }}
          >
            Start over
          </button>
        </div>
      </StepWrapper>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');

                @keyframes codedSparkFloat {
                    0%   { transform: translateY(0px) rotate(0deg) scale(1); }
                    30%  { transform: translateY(-10px) rotate(15deg) scale(1.18); }
                    60%  { transform: translateY(-5px) rotate(-8deg) scale(0.88); }
                    100% { transform: translateY(0px) rotate(0deg) scale(1); }
                }

                @keyframes codedFadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

      <div
        style={{
          position: "relative",
          width: "100%",
          background: "#ffffff",
          borderRadius: 20,
          padding: "48px 52px",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(10,22,40,0.08), 0 0 0 1px rgba(10,22,40,0.06)",
          overflow: "hidden",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Sparks */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <Spark
            size={14}
            color="#1565C0"
            opacity={0.22}
            top="9%"
            left="94%"
            duration="3.4s"
            delay="0s"
          />
          <Spark
            size={9}
            color="#1565C0"
            opacity={0.18}
            top="78%"
            left="97%"
            duration="2.8s"
            delay="1.2s"
          />
          <Spark
            size={18}
            color="#90CAF9"
            opacity={0.32}
            top="60%"
            left="1%"
            duration="3.8s"
            delay="0.7s"
          />
          <Spark
            size={7}
            color="#1565C0"
            opacity={0.2}
            top="20%"
            left="2%"
            duration="3.1s"
            delay="2s"
          />
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 16 16" fill="#1565C0">
              <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" />
            </svg>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#1565C0",
                letterSpacing: "0.13em",
                textTransform: "uppercase",
              }}
            >
              CODED · Program Finder
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: "#0A1628",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Find the right program
            <br />
            for your team
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#7A8899",
              marginTop: 6,
              fontWeight: 400,
            }}
          >
            Answer a few questions — we'll match you in seconds.
          </p>
        </div>

        {/* Progress */}
        {!showResults && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 3,
                background: "#E8EDF3",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "#1565C0",
                  borderRadius: 99,
                  transition: "width 0.45s cubic-bezier(.65,0,.35,1)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                color: "#A0AEBD",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {s.step + 1} of {STEPS.length}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ minHeight: 220 }}>
          {showResults ? renderResults() : renderStep()}
        </div>
      </div>
    </>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const styles = {
  q: {
    fontSize: 18,
    fontWeight: 600,
    color: "#0A1628",
    marginBottom: 6,
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1.3,
  } as React.CSSProperties,
  hint: {
    fontSize: 13,
    color: "#9AAABB",
    marginBottom: 18,
  } as React.CSSProperties,
  chips: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 9,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
  } as React.CSSProperties,
};

// ── Framer Property Controls ───────────────────────────────────────────────
addPropertyControls(CODEDProgramFinder, {
  ctaEmail: {
    type: ControlType.String,
    title: "CTA Email",
    defaultValue: "pro@coded.com",
  },
  accentColor: {
    type: ControlType.Color,
    title: "Accent Color",
    defaultValue: "#1565C0",
  },
});
