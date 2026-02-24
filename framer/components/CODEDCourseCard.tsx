// CODED Course Card — Standalone Framer Component
// A reusable featured course/program card. Drop anywhere on your site.
// Assets > Code > New File > paste this entire file.

import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// ── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "")
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

// ── Spark SVG ───────────────────────────────────────────────────────────────
function Spark({ size, color }: { size: number; color: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
            <path d="M8 0L9.2 6.8L16 8L9.2 9.2L8 16L6.8 9.2L0 8L6.8 6.8L8 0Z" />
        </svg>
    )
}

// ── Main Component ──────────────────────────────────────────────────────────
function CODEDCourseCard({
    title = "AI Champions Program",
    description = "Strategic AI literacy for leadership — think differently about automation & tools.",
    tags = "Workshop, 4-6 Hours, AI",
    badgeText = "Best Match",
    showBadge = true,
    isFeatured = true,
    ctaLink = "mailto:pro@coded.com",
    ctaText = "Learn More",
    showCta = true,
    accentColor = "#2563EB",
}: {
    title?: string
    description?: string
    tags?: string
    badgeText?: string
    showBadge?: boolean
    isFeatured?: boolean
    ctaLink?: string
    ctaText?: string
    showCta?: boolean
    accentColor?: string
}) {
    const [hovered, setHovered] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60)
        return () => clearTimeout(t)
    }, [])

    const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Syne:wght@600;700;800&display=swap');
            `}</style>

            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    position: "relative",
                    width: "100%",
                    border: `1.5px solid ${
                        hovered
                            ? accentColor
                            : isFeatured
                              ? accentColor
                              : "#E4EAF3"
                    }`,
                    borderRadius: 16,
                    padding: 20,
                    background: isFeatured
                        ? "linear-gradient(145deg, #F0F6FF, #FAFCFF)"
                        : "white",
                    overflow: "hidden",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box",
                    transition:
                        "border-color 0.18s, box-shadow 0.18s, opacity 0.4s ease, transform 0.4s ease",
                    boxShadow: hovered
                        ? `0 4px 20px ${hexToRgba(accentColor, 0.1)}`
                        : "none",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(12px)",
                    cursor: showCta ? "default" : "pointer",
                }}
            >
                {/* Top accent line */}
                {isFeatured && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: accentColor,
                            borderRadius: "16px 16px 0 0",
                        }}
                    />
                )}

                {/* Badge */}
                {showBadge && isFeatured && badgeText && (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: hexToRgba(accentColor, 0.08),
                            color: accentColor,
                            borderRadius: 100,
                            padding: "3px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            marginBottom: 10,
                        }}
                    >
                        <Spark size={9} color={accentColor} />
                        {badgeText}
                    </div>
                )}

                {/* Title */}
                <p
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#0A1628",
                        marginBottom: 5,
                        lineHeight: 1.3,
                        margin: "0 0 5px",
                    }}
                >
                    {title}
                </p>

                {/* Description */}
                <p
                    style={{
                        fontSize: 12.5,
                        color: "#7A8899",
                        lineHeight: 1.55,
                        marginBottom: 12,
                        margin: "0 0 12px",
                    }}
                >
                    {description}
                </p>

                {/* Tags */}
                {tagList.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 5,
                            marginBottom: showCta ? 14 : 0,
                        }}
                    >
                        {tagList.map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    background: isFeatured
                                        ? hexToRgba(accentColor, 0.08)
                                        : "#F0F4F8",
                                    color: isFeatured ? accentColor : "#7A8899",
                                    borderRadius: 100,
                                    padding: "3px 10px",
                                    fontSize: 11,
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* CTA Button */}
                {showCta && (
                    <a
                        href={ctaLink}
                        style={{
                            display: "inline-block",
                            background: accentColor,
                            color: "white",
                            borderRadius: 100,
                            padding: "9px 20px",
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: 13,
                            textDecoration: "none",
                            transition:
                                "opacity 0.2s, transform 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            ;(e.target as HTMLElement).style.opacity = "0.85"
                            ;(e.target as HTMLElement).style.transform =
                                "translateY(-1px)"
                        }}
                        onMouseLeave={(e) => {
                            ;(e.target as HTMLElement).style.opacity = "1"
                            ;(e.target as HTMLElement).style.transform = "none"
                        }}
                    >
                        {ctaText}
                    </a>
                )}
            </div>
        </>
    )
}

// ── Framer Property Controls ────────────────────────────────────────────────
addPropertyControls(CODEDCourseCard, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "AI Champions Program",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "Strategic AI literacy for leadership — think differently about automation & tools.",
        displayTextArea: true,
    },
    tags: {
        type: ControlType.String,
        title: "Tags",
        defaultValue: "Workshop, 4-6 Hours, AI",
        description: "Comma-separated tags",
    },
    badgeText: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: "Best Match",
    },
    showBadge: {
        type: ControlType.Boolean,
        title: "Show Badge",
        defaultValue: true,
    },
    isFeatured: {
        type: ControlType.Boolean,
        title: "Featured Style",
        defaultValue: true,
        description: "Featured = blue gradient bg + accent line",
    },
    ctaLink: {
        type: ControlType.String,
        title: "CTA Link",
        defaultValue: "mailto:pro@coded.com",
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "Learn More",
    },
    showCta: {
        type: ControlType.Boolean,
        title: "Show CTA",
        defaultValue: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#2563EB",
    },
})

export default CODEDCourseCard
