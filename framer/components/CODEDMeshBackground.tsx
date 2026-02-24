// CODED Mesh Background — Framer Component
// An animated mesh gradient section wrapper. Drop on your canvas,
// then place any component (like ProgramFinder) inside it.
// Assets > Code > New File > paste this entire file.

import { addPropertyControls, ControlType } from "framer"

// ── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "")
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

// Speed multiplier map
const SPEED_MAP: Record<string, number> = {
    slow: 1.5,
    normal: 1,
    fast: 0.6,
}

// ── Blob definitions ────────────────────────────────────────────────────────
interface BlobDef {
    width: number
    height: number
    top: string
    left: string
    colorKey: "primary" | "secondary"
    opacityMultiplier: number
    animName: string
}

const BLOBS: BlobDef[] = [
    {
        width: 700,
        height: 700,
        top: "50%",
        left: "30%",
        colorKey: "primary",
        opacityMultiplier: 1.2,
        animName: "codedMB_drift1",
    },
    {
        width: 500,
        height: 500,
        top: "40%",
        left: "65%",
        colorKey: "secondary",
        opacityMultiplier: 0.7,
        animName: "codedMB_drift2",
    },
    {
        width: 400,
        height: 350,
        top: "10%",
        left: "50%",
        colorKey: "primary",
        opacityMultiplier: 0.5,
        animName: "codedMB_drift3",
    },
    {
        width: 350,
        height: 350,
        top: "85%",
        left: "40%",
        colorKey: "secondary",
        opacityMultiplier: 0.4,
        animName: "codedMB_drift4",
    },
]

// ── Main Component ──────────────────────────────────────────────────────────
function CODEDMeshBackground({
    primaryColor = "#0B1D3A",
    secondaryColor = "#2563EB",
    blobOpacity = 0.15,
    animationSpeed = "normal",
    paddingY = 100,
    children,
}: {
    primaryColor?: string
    secondaryColor?: string
    blobOpacity?: number
    animationSpeed?: string
    paddingY?: number
    children?: React.ReactNode
}) {
    const mult = SPEED_MAP[animationSpeed] || 1

    // Base durations per blob (seconds)
    const durations = [20, 25, 18, 22]

    const keyframes = `
        @keyframes codedMB_drift1 {
            0%   { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
            25%  { transform: translate(-50%, -50%) translate(15px, -10px) scale(1.03); }
            50%  { transform: translate(-50%, -50%) translate(-8px, 12px) scale(0.97); }
            75%  { transform: translate(-50%, -50%) translate(-18px, -6px) scale(1.02); }
            100% { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
        }
        @keyframes codedMB_drift2 {
            0%   { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
            30%  { transform: translate(-50%, -50%) translate(-12px, 18px) scale(1.04); }
            60%  { transform: translate(-50%, -50%) translate(20px, -8px) scale(0.96); }
            100% { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
        }
        @keyframes codedMB_drift3 {
            0%   { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
            35%  { transform: translate(-50%, -50%) translate(8px, 20px) scale(1.05); }
            70%  { transform: translate(-50%, -50%) translate(-14px, -12px) scale(0.95); }
            100% { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
        }
        @keyframes codedMB_drift4 {
            0%   { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
            40%  { transform: translate(-50%, -50%) translate(-16px, -14px) scale(1.03); }
            80%  { transform: translate(-50%, -50%) translate(10px, 16px) scale(0.97); }
            100% { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
        }
    `

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                padding: `${paddingY}px 24px`,
                overflow: "hidden",
            }}
        >
            <style>{keyframes}</style>

            {/* Gradient blobs */}
            {BLOBS.map((blob, i) => {
                const color =
                    blob.colorKey === "primary" ? primaryColor : secondaryColor
                const opacity = blobOpacity * blob.opacityMultiplier
                const dur = durations[i] * mult

                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: blob.width,
                            height: blob.height,
                            top: blob.top,
                            left: blob.left,
                            borderRadius: "50%",
                            pointerEvents: "none",
                            filter: "blur(80px)",
                            background: `radial-gradient(circle, ${hexToRgba(color, opacity)} 0%, transparent 70%)`,
                            animation: `${blob.animName} ${dur}s ease-in-out infinite`,
                            willChange: "transform",
                        }}
                    />
                )
            })}

            {/* Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                {children}
            </div>
        </div>
    )
}

// ── Framer Property Controls ────────────────────────────────────────────────
addPropertyControls(CODEDMeshBackground, {
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#0B1D3A",
        description: "Navy — the dominant blob color",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#2563EB",
        description: "Blue — the accent blob color",
    },
    blobOpacity: {
        type: ControlType.Number,
        title: "Blob Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 0.4,
        step: 0.01,
        description: "Master opacity for all gradient blobs",
    },
    animationSpeed: {
        type: ControlType.Enum,
        title: "Animation Speed",
        defaultValue: "normal",
        options: ["slow", "normal", "fast"],
        optionTitles: ["Slow", "Normal", "Fast"],
    },
    paddingY: {
        type: ControlType.Number,
        title: "Vertical Padding",
        defaultValue: 100,
        min: 40,
        max: 200,
        step: 10,
        unit: "px",
    },
})

export default CODEDMeshBackground
