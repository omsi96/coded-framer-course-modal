import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { addPropertyControls, ControlType } from "framer"

export interface CourseRequestModalCourse {
    recordId: string
    courseTitle: string
    duration: string
    courseType: string
    targetAudience: string[]
    description: string
    rank: number | null
    sections: string[]
    pdfRecordIds: string[]
}

interface CourseRequestModalProps {
    isOpen?: boolean
    course?: CourseRequestModalCourse | null
    onClose?: () => void
    apiBaseUrl?: string
    primaryColor?: string
    headerTitle?: string
    headerSubtitle?: string
    previewCourseTitle?: string
    previewSection?: string
    previewDuration?: string
    previewCourseType?: string
    previewTargetAudience?: string
    previewDescription?: string
    previewPdfRecordId?: string
}

export default function CourseRequestModal(props: CourseRequestModalProps) {
    const {
        isOpen = true,
        course,
        onClose,
        apiBaseUrl = "https://coded-landingpage.tools-c81.workers.dev",
        primaryColor = "#1996F0",
        headerTitle = "Request this course",
        headerSubtitle = "Fill your details and receive the course offer.",
        previewCourseTitle = "AI for Executives: Strategy and Practical Adoption",
        previewSection = "Artificial Intelligence",
        previewDuration = "6-12 Training Hours",
        previewCourseType = "Workshop",
        previewTargetAudience = "Executives",
        previewDescription = "Executive-level overview of AI applications, risks, and adoption strategy.",
        previewPdfRecordId = "",
    } = props

    const [requestName, setRequestName] = useState("")
    const [requestCompany, setRequestCompany] = useState("")
    const [requestEmail, setRequestEmail] = useState("")
    const [requestStatus, setRequestStatus] = useState<
        "idle" | "sending" | "sent" | "error"
    >("idle")
    const [requestMessage, setRequestMessage] = useState("")

    useEffect(() => {
        if (!isOpen) return
        setRequestName("")
        setRequestCompany("")
        setRequestEmail("")
        setRequestStatus("idle")
        setRequestMessage("")
    }, [isOpen, course?.recordId])

    const activeCourse = useMemo<CourseRequestModalCourse>(() => {
        if (course) return course
        return {
            recordId: "preview-course",
            courseTitle: previewCourseTitle,
            duration: previewDuration,
            courseType: previewCourseType,
            targetAudience: splitCsv(previewTargetAudience),
            description: previewDescription,
            rank: null,
            sections: splitCsv(previewSection),
            pdfRecordIds: previewPdfRecordId ? [previewPdfRecordId] : [],
        }
    }, [
        course,
        previewCourseTitle,
        previewDuration,
        previewCourseType,
        previewTargetAudience,
        previewDescription,
        previewSection,
        previewPdfRecordId,
    ])

    const resolvedHeaderTitle = useMemo(
        () => resolveTemplate(headerTitle, activeCourse),
        [headerTitle, activeCourse]
    )
    const resolvedHeaderSubtitle = useMemo(
        () => resolveTemplate(headerSubtitle, activeCourse),
        [headerSubtitle, activeCourse]
    )

    if (!isOpen) return null

    async function submitRequest() {
        const name = requestName.trim()
        const company = requestCompany.trim()
        const email = requestEmail.trim()
        if (!name || !company || !email || !isValidEmail(email)) {
            setRequestStatus("error")
            setRequestMessage("Enter name, company, and a valid email.")
            return
        }

        const pdfId = activeCourse.pdfRecordIds[0] || ""
        if (!pdfId) {
            setRequestStatus("error")
            setRequestMessage("This course has no linked PDF yet.")
            return
        }

        setRequestStatus("sending")
        setRequestMessage("")

        try {
            const base = apiBaseUrl.trim().replace(/\/+$/, "")
            if (!base) throw new Error("Missing API base URL")

            const endpoint = `${base}/catalogrequest/${encodeURIComponent(pdfId)}`
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    company,
                }),
            })
            if (!res.ok) throw new Error(`Request failed (${res.status})`)

            setRequestStatus("sent")
            setRequestMessage("Offer request sent. We will contact you shortly.")
            setRequestName("")
            setRequestCompany("")
            setRequestEmail("")
        } catch (e: any) {
            setRequestStatus("error")
            setRequestMessage(
                String(e?.message || "Something went wrong. Please try again.")
            )
        }
    }

    return (
        <div role="dialog" aria-modal="true" style={overlayStyle} onClick={onClose}>
            <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} style={closeButtonStyle}>
                    ×
                </button>

                {resolvedHeaderSubtitle ? (
                    <div style={headerSubtitleStyle}>{resolvedHeaderSubtitle}</div>
                ) : null}
                {resolvedHeaderTitle ? (
                    <h2 style={headerTitleStyle}>{resolvedHeaderTitle}</h2>
                ) : null}

                <div style={sectionStyle}>{activeCourse.sections.join(" • ")}</div>
                <h3 style={titleStyle}>{activeCourse.courseTitle}</h3>

                <div style={capsuleRowStyle}>
                    {activeCourse.duration ? (
                        <span style={capsuleStyle}>
                            <ClockIcon size={13} color={primaryColor} />
                            {activeCourse.duration}
                        </span>
                    ) : null}
                    {activeCourse.courseType ? (
                        <span style={capsuleStyle}>
                            <BookIcon size={13} color={primaryColor} />
                            {activeCourse.courseType}
                        </span>
                    ) : null}
                    {activeCourse.targetAudience.map((aud) => (
                        <span key={aud} style={capsuleStyle}>
                            <UsersIcon size={13} color={primaryColor} />
                            {aud}
                        </span>
                    ))}
                </div>

                <p style={descriptionStyle}>
                    {activeCourse.description || "No description available yet."}
                </p>

                <div style={formStyle}>
                    <input
                        type="text"
                        value={requestName}
                        placeholder="Your name"
                        onChange={(e) => setRequestName(e.target.value)}
                        style={inputStyle}
                    />
                    <input
                        type="text"
                        value={requestCompany}
                        placeholder="Company"
                        onChange={(e) => setRequestCompany(e.target.value)}
                        style={inputStyle}
                    />
                    <input
                        type="email"
                        value={requestEmail}
                        placeholder="Email"
                        onChange={(e) => setRequestEmail(e.target.value)}
                        style={inputStyle}
                    />
                    <button
                        onClick={submitRequest}
                        disabled={requestStatus === "sending"}
                        style={{
                            ...buttonStyle,
                            background: primaryColor,
                            opacity: requestStatus === "sending" ? 0.65 : 1,
                        }}
                    >
                        {requestStatus === "sending" ? "Sending..." : "Send Request"}
                    </button>

                    {requestMessage ? (
                        <div
                            style={{
                                ...messageStyle,
                                color: requestStatus === "error" ? "#B42318" : "#067647",
                            }}
                        >
                            {requestMessage}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function resolveTemplate(
    template: string,
    course: CourseRequestModalCourse | null
): string {
    if (!template) return ""
    if (!course) return template

    const sections = course.sections.join(" • ")
    return template
        .replace(/\{\{\s*courseTitle\s*\}\}/gi, course.courseTitle || "")
        .replace(/\{\{\s*section\s*\}\}/gi, sections)
}

function splitCsv(value: string): string[] {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function fetchSvg(path: string, size: number, color: string) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    )
}

function ClockIcon({ size, color }: { size: number; color: string }) {
    return fetchSvg(
        "M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.73-4-2.27V7z",
        size,
        color
    )
}

function UsersIcon({ size, color }: { size: number; color: string }) {
    return fetchSvg(
        "M16 11c1.66 0 2.99-1.57 2.99-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z",
        size,
        color
    )
}

function BookIcon({ size, color }: { size: number; color: string }) {
    return fetchSvg(
        "M4 5.5A2.5 2.5 0 016.5 3H20v17H6.5A2.5 2.5 0 014 17.5v-12z M6.5 5A.5.5 0 006 5.5v12c0 .28.22.5.5.5H18V5H6.5z",
        size,
        color
    )
}

const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(12,17,29,0.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 20,
}

const cardStyle: CSSProperties = {
    width: "min(760px, 100%)",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#FFFFFF",
    borderRadius: 20,
    border: "1px solid #E7ECF3",
    padding: 20,
    boxSizing: "border-box",
    position: "relative",
}

const closeButtonStyle: CSSProperties = {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid #E7ECF3",
    background: "#FFFFFF",
    cursor: "pointer",
    fontSize: 22,
    lineHeight: 1,
}

const headerSubtitleStyle: CSSProperties = {
    color: "#667085",
    fontSize: "0.95em",
    marginBottom: 4,
    paddingRight: 40,
}

const headerTitleStyle: CSSProperties = {
    margin: "0 0 10px",
    font: "inherit",
    fontWeight: 700,
    fontSize: "1.5em",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
    paddingRight: 40,
}

const sectionStyle: CSSProperties = {
    color: "#667085",
    marginBottom: 6,
}

const titleStyle: CSSProperties = {
    margin: 0,
    marginBottom: 14,
    font: "inherit",
    fontWeight: 700,
    fontSize: "2.1em",
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
}

const capsuleRowStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
}

const capsuleStyle: CSSProperties = {
    border: "1px solid #DCE5F0",
    borderRadius: 999,
    background: "#FFFFFF",
    padding: "6px 10px",
    fontSize: ".93em",
    lineHeight: 1.1,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
}

const descriptionStyle: CSSProperties = {
    margin: "14px 0",
    color: "#475467",
    lineHeight: 1.55,
}

const formStyle: CSSProperties = {
    marginTop: 12,
    display: "grid",
    gap: 8,
}

const inputStyle: CSSProperties = {
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid #E4EAF2",
    padding: "0 12px",
    font: "inherit",
    outline: "none",
    width: "100%",
}

const buttonStyle: CSSProperties = {
    minHeight: 42,
    border: "none",
    borderRadius: 12,
    padding: "0 14px",
    color: "#FFFFFF",
    font: "inherit",
    fontWeight: 700,
    cursor: "pointer",
    justifySelf: "start",
}

const messageStyle: CSSProperties = {
    fontSize: ".94em",
}

addPropertyControls(CourseRequestModal, {
    isOpen: {
        type: ControlType.Boolean,
        title: "Open",
        defaultValue: true,
    },
    apiBaseUrl: {
        type: ControlType.String,
        title: "API Base",
        defaultValue: "https://coded-landingpage.tools-c81.workers.dev",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#1996F0",
    },
    headerTitle: {
        type: ControlType.String,
        title: "Header",
        defaultValue: "Request {{courseTitle}}",
    },
    headerSubtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Fill your details to receive the offer.",
    },
    previewSection: {
        type: ControlType.String,
        title: "Section",
        defaultValue: "Artificial Intelligence",
    },
    previewCourseTitle: {
        type: ControlType.String,
        title: "Course",
        defaultValue: "AI for Executives: Strategy and Practical Adoption",
    },
    previewDuration: {
        type: ControlType.String,
        title: "Duration",
        defaultValue: "6-12 Training Hours",
    },
    previewCourseType: {
        type: ControlType.String,
        title: "Type",
        defaultValue: "Workshop",
    },
    previewTargetAudience: {
        type: ControlType.String,
        title: "Audience",
        defaultValue: "Executives",
    },
    previewDescription: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "Executive-level overview of AI applications, risks, and adoption strategy.",
    },
    previewPdfRecordId: {
        type: ControlType.String,
        title: "PDF Id",
        defaultValue: "",
    },
})
