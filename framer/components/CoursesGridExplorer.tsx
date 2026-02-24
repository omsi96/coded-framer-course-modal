import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { addPropertyControls, ControlType } from "framer"
import CourseRequestModal from "./CourseRequestModal"

interface Course {
    recordId: string
    courseTitle: string
    duration: string
    courseType: string
    targetAudience: string[]
    description: string
    rank: number | null
    sections: string[]
    pdfRecordIds: string[]
    sourceIndex: number
}

interface CoursesApiResponse {
    courses?: any[]
    records?: Array<{ id?: string; fields?: Record<string, any> }>
    nextOffset?: string | null
}

interface CoursesGridExplorerProps {
    workerUrl: string
    apiBaseUrl: string
    initialVisible: number
    loadMoreStep: number
    primaryColor: string
    modalHeaderTitle: string
    modalHeaderSubtitle: string
}

/**
 * Courses Grid (Hover + Modal)
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CoursesGridExplorer(props: CoursesGridExplorerProps) {
    const {
        workerUrl = "https://coded-landingpage.tools-c81.workers.dev",
        apiBaseUrl = "https://coded-landingpage.tools-c81.workers.dev",
        initialVisible = 4,
        loadMoreStep = 4,
        primaryColor = "#1996F0",
        modalHeaderTitle = "Request {{courseTitle}}",
        modalHeaderSubtitle = "Fill your details to receive the offer.",
    } = props

    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [query, setQuery] = useState("")
    const [showMoreFilters, setShowMoreFilters] = useState(false)
    const [selectedSection, setSelectedSection] = useState("all")
    const [selectedTargets, setSelectedTargets] = useState<string[]>([])
    const [maxHours, setMaxHours] = useState(300)

    const [visibleCount, setVisibleCount] = useState(initialVisible)
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    const [activeCourse, setActiveCourse] = useState<Course | null>(null)

    useEffect(() => {
        setVisibleCount(initialVisible)
    }, [initialVisible])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const base = workerUrl.trim().replace(/\/+$/, "")
                if (!base) throw new Error("Missing Worker URL")
                const rows = await fetchAllCourses(base)
                if (!cancelled) setCourses(rows)
            } catch (e: any) {
                if (!cancelled) {
                    setCourses([])
                    setError(String(e?.message || e || "Failed to load courses"))
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [workerUrl])

    const sectionOptions = useMemo(
        () => ["all", ...uniqueStrings(courses.flatMap((course) => course.sections))],
        [courses]
    )
    const targetOptions = useMemo(
        () => uniqueStrings(courses.flatMap((course) => course.targetAudience)),
        [courses]
    )
    const preHoursFilteredCourses = useMemo(() => {
        const tokens = normalize(query).split(/\s+/).filter(Boolean)

        return courses.filter((course) => {
            if (
                selectedSection !== "all" &&
                !course.sections.includes(selectedSection)
            ) {
                return false
            }

            if (selectedTargets.length > 0) {
                const hasTarget = selectedTargets.some((target) =>
                    course.targetAudience.includes(target)
                )
                if (!hasTarget) return false
            }

            if (!tokens.length) return true

            const haystack = normalize(
                [
                    course.courseTitle,
                    course.description,
                    course.sections.join(" "),
                    course.targetAudience.join(" "),
                    course.duration,
                ].join(" ")
            )
            return tokens.every((token) => haystack.includes(token))
        })
    }, [courses, query, selectedSection, selectedTargets])

    const hoursRange = useMemo(() => {
        const maxValues = preHoursFilteredCourses
            .map((course) => parseDurationHours(course.duration).max)
            .filter((value): value is number => Number.isFinite(value))
        if (!maxValues.length) return { min: 1, max: 1, available: false }
        const computedMax = maxValues.length ? Math.max(...maxValues) : 300
        const computedMin = maxValues.length ? Math.min(...maxValues) : 1
        return {
            min: Math.max(1, computedMin),
            max: Math.max(1, computedMax),
            available: true,
        }
    }, [preHoursFilteredCourses])

    useEffect(() => {
        setMaxHours((prev) => {
            if (!hoursRange.available) return prev
            if (prev < hoursRange.min) return hoursRange.min
            if (prev > hoursRange.max) return hoursRange.max
            return prev
        })
    }, [hoursRange.min, hoursRange.max, hoursRange.available])

    useEffect(() => {
        setVisibleCount(initialVisible)
    }, [query, selectedSection, selectedTargets, maxHours, initialVisible])

    const filtered = useMemo(() => {
        const items = preHoursFilteredCourses.filter((course) => {
            const hours = parseDurationHours(course.duration)
            // If parsing fails for this record, skip hour filtering for it.
            if (!Number.isFinite(hours.max)) return true
            return hours.max <= maxHours
        })

        return [...items].sort((a, b) => {
            const aHasRank = Number.isFinite(a.rank)
            const bHasRank = Number.isFinite(b.rank)

            if (aHasRank && bHasRank) return Number(a.rank) - Number(b.rank)
            if (aHasRank) return -1
            if (bHasRank) return 1
            return a.sourceIndex - b.sourceIndex
        })
    }, [preHoursFilteredCourses, maxHours])

    const visibleCourses = filtered.slice(0, visibleCount)
    const canLoadMore = visibleCount < filtered.length

    return (
        <div style={rootStyle}>
            <div style={searchRowStyle}>
                <div style={searchShellStyle}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search courses"
                        style={searchInputStyle}
                    />
                </div>
            </div>

            <div style={sectionTagsStyle}>
                {sectionOptions.map((section) => {
                    const active = section === selectedSection
                    return (
                        <button
                            key={section}
                            onClick={() => setSelectedSection(section)}
                            style={{
                                ...sectionTagStyle,
                                borderColor: active ? primaryColor : "#E7ECF3",
                                color: active ? primaryColor : "#667085",
                                background: active ? "#F4FAFF" : "#FFFFFF",
                            }}
                        >
                            {section === "all" ? "All Sections" : section}
                        </button>
                    )
                })}

                <button
                    onClick={() => setShowMoreFilters((prev) => !prev)}
                    style={{
                        ...moreFiltersButtonStyle,
                        color: showMoreFilters ? primaryColor : "inherit",
                    }}
                >
                    More filters{" "}
                    <ChevronDownIcon
                        size={14}
                        color={showMoreFilters ? primaryColor : "#667085"}
                    />
                </button>
            </div>

            {showMoreFilters && (
                <div style={filtersPanelStyle}>
                    <div style={hoursBlockStyle}>
                        <div style={filterLabelStyle}>
                            Max Hours: <strong>{maxHours}</strong>
                        </div>
                        {hoursRange.available ? (
                            <input
                                type="range"
                                min={hoursRange.min}
                                max={hoursRange.max}
                                step={1}
                                value={maxHours}
                                onChange={(e) => setMaxHours(Number(e.target.value))}
                                style={{ ...sliderStyle, accentColor: primaryColor }}
                            />
                        ) : (
                            <div style={filterLabelStyle}>
                                Hour filter unavailable for current selection.
                            </div>
                        )}
                    </div>

                    <div style={targetsBlockStyle}>
                        <div style={filterLabelStyle}>Target Audience</div>
                        <div style={targetChipsWrapStyle}>
                            {targetOptions.map((target) => {
                                const active = selectedTargets.includes(target)
                                return (
                                    <button
                                        key={target}
                                        onClick={() =>
                                            setSelectedTargets((prev) =>
                                                prev.includes(target)
                                                    ? prev.filter((item) => item !== target)
                                                    : [...prev, target]
                                            )
                                        }
                                        style={{
                                            ...targetChipButtonStyle,
                                            borderColor: active ? primaryColor : "#E7ECF3",
                                            color: active ? primaryColor : "#667085",
                                            background: active
                                                ? "#F4FAFF"
                                                : "#FFFFFF",
                                        }}
                                    >
                                        <UsersIcon
                                            size={13}
                                            color={active ? primaryColor : "#98A2B3"}
                                        />
                                        {target}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setQuery("")
                            setSelectedSection("all")
                            setSelectedTargets([])
                            if (hoursRange.available) setMaxHours(hoursRange.max)
                        }}
                        style={clearButtonStyle}
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {loading && <p style={metaTextStyle}>Loading courses...</p>}
            {error && <p style={{ ...metaTextStyle, color: "#B42318" }}>{error}</p>}

            {!loading && !error && (
                <>
                    <div style={metaTextStyle}>
                        Showing {Math.min(visibleCount, filtered.length)} of{" "}
                        {filtered.length}
                    </div>

                    <div style={gridStyle}>
                        {visibleCourses.map((course) => {
                            const hovered = hoveredId === course.recordId
                            const audienceLabel =
                                course.targetAudience[0] || "General Audience"

                            return (
                                <article
                                    key={course.recordId}
                                    onMouseEnter={() => setHoveredId(course.recordId)}
                                    onMouseLeave={() =>
                                        setHoveredId((prev) =>
                                            prev === course.recordId ? null : prev
                                        )
                                    }
                                    onClick={() => {
                                        setActiveCourse(course)
                                    }}
                                    style={cardStyle}
                                >
                                    {Number.isFinite(course.rank) && (
                                        <div style={{ ...rankStyle, color: primaryColor }}>
                                            #{course.rank}
                                        </div>
                                    )}

                                    <h3 style={cardTitleStyle}>{course.courseTitle}</h3>

                                    <div
                                        style={{
                                            ...hoverLayerStyle,
                                            opacity: hovered ? 1 : 0,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <div style={capsuleRowStyle}>
                                            {course.duration ? (
                                                <span style={capsuleStyle}>
                                                    <ClockIcon size={13} color={primaryColor} />
                                                    {course.duration}
                                                </span>
                                            ) : null}

                                            {audienceLabel ? (
                                                <span style={capsuleStyle}>
                                                    <UsersIcon size={13} color={primaryColor} />
                                                    {audienceLabel}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>

                    {canLoadMore && (
                        <div style={{ marginTop: 14, textAlign: "center" }}>
                            <button
                                onClick={() =>
                                    setVisibleCount((prev) =>
                                        Math.min(prev + loadMoreStep, filtered.length)
                                    )
                                }
                                style={{
                                    ...loadMoreButtonStyle,
                                    color: primaryColor,
                                }}
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </>
            )}

            <CourseRequestModal
                isOpen={Boolean(activeCourse)}
                course={activeCourse}
                onClose={() => setActiveCourse(null)}
                apiBaseUrl={apiBaseUrl}
                primaryColor={primaryColor}
                headerTitle={modalHeaderTitle}
                headerSubtitle={modalHeaderSubtitle}
            />
        </div>
    )
}

function fetchSvg(
    path: string,
    size: number,
    color: string,
    stroke = false
) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={stroke ? "none" : color}
            stroke={stroke ? color : "none"}
            strokeWidth={stroke ? 2 : 0}
            strokeLinecap="round"
            strokeLinejoin="round"
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

function ChevronDownIcon({ size, color }: { size: number; color: string }) {
    return fetchSvg("M6 9l6 6 6-6", size, color, true)
}

const rootStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    background: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "inherit",
}

const searchRowStyle: CSSProperties = {
    display: "block",
}

const searchShellStyle: CSSProperties = {
    minHeight: 46,
    padding: "0 2px",
    display: "flex",
    alignItems: "center",
    background: "transparent",
    borderBottom: "1px solid #D0D5DD",
}

const searchInputStyle: CSSProperties = {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    fontSize: "1em",
}

const moreFiltersButtonStyle: CSSProperties = {
    minHeight: 40,
    borderRadius: 0,
    padding: "0 2px",
    border: "none",
    background: "transparent",
    font: "inherit",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
}

const sectionTagsStyle: CSSProperties = {
    marginTop: 10,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
}

const sectionTagStyle: CSSProperties = {
    border: "1px solid #E7ECF3",
    background: "#FFFFFF",
    borderRadius: 999,
    padding: "6px 12px",
    font: "inherit",
    fontSize: "0.95em",
    lineHeight: 1.1,
    cursor: "pointer",
}

const filtersPanelStyle: CSSProperties = {
    marginTop: 10,
    marginBottom: 8,
    padding: 0,
    display: "grid",
    gap: 10,
}

const hoursBlockStyle: CSSProperties = {
    display: "grid",
    gap: 8,
}

const targetsBlockStyle: CSSProperties = {
    display: "grid",
    gap: 8,
}

const targetChipsWrapStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
}

const targetChipButtonStyle: CSSProperties = {
    border: "1px solid #E7ECF3",
    background: "#FFFFFF",
    borderRadius: 999,
    padding: "6px 10px",
    font: "inherit",
    fontSize: ".92em",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
}

const filterLabelStyle: CSSProperties = {
    color: "#667085",
    fontSize: ".95em",
}

const sliderStyle: CSSProperties = {
    width: "100%",
}

const clearButtonStyle: CSSProperties = {
    justifySelf: "start",
    border: "none",
    background: "transparent",
    borderRadius: 0,
    padding: "4px 0",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
    color: "#667085",
}

const metaTextStyle: CSSProperties = {
    margin: "8px 0 10px",
    color: "#667085",
}

const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
}

const cardStyle: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    minHeight: 220,
    borderRadius: 18,
    border: "1px solid #E7ECF3",
    background: "#FFFFFF",
    padding: 16,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    cursor: "pointer",
}

const rankStyle: CSSProperties = {
    position: "absolute",
    top: 10,
    right: 12,
    fontSize: ".88em",
    fontWeight: 700,
}

const cardTitleStyle: CSSProperties = {
    margin: 0,
    font: "inherit",
    fontWeight: 700,
    fontSize: "2em",
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
}

const hoverLayerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    boxSizing: "border-box",
    background:
        "linear-gradient(160deg, rgba(255,255,255,.96) 0%, rgba(244,249,255,.98) 100%)",
    transition: "opacity .18s ease",
}

const capsuleRowStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
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

const loadMoreButtonStyle: CSSProperties = {
    minHeight: 30,
    border: "none",
    borderRadius: 0,
    background: "transparent",
    color: "#1996F0",
    font: "inherit",
    fontWeight: 700,
    padding: "0 2px",
    cursor: "pointer",
}

async function fetchAllCourses(workerUrl: string): Promise<Course[]> {
    const all: Course[] = []
    let offset: string | null = null
    let safety = 0

    while (safety < 20) {
        safety += 1

        const qs = new URLSearchParams({ limit: "100" })
        if (offset) qs.set("offset", offset)

        const res = await fetch(`${workerUrl}/courses?${qs.toString()}`)
        if (!res.ok) throw new Error(`Courses request failed (${res.status})`)

        const data: CoursesApiResponse = await res.json()
        const batch = normalizeCourses(data, all.length)
        all.push(...batch)

        offset = data.nextOffset || null
        if (!offset) break
    }

    return all
}

function normalizeCourses(data: CoursesApiResponse, baseIndex: number): Course[] {
    if (Array.isArray(data.courses)) {
        return data.courses.map((row, i) => ({
            recordId: normalizeValue(row.recordId || row.id),
            courseTitle: normalizeValue(row.courseTitle),
            duration: normalizeValue(row.duration),
            courseType: normalizeValue(row.courseType),
            targetAudience: normalizeArray(row.targetAudience),
            description: normalizeValue(row.description),
            rank: readRank(row.rank, row.Rank, row.seq, row.Seq),
            sections: normalizeArray(row.sections || row.Section),
            pdfRecordIds: normalizeRecordIds(row.pdfRecordIds || row.PDF),
            sourceIndex: baseIndex + i,
        }))
    }

    if (!Array.isArray(data.records)) return []

    return data.records.map((record, i) => {
        const f = record.fields || {}
        return {
            recordId: normalizeValue(record.id),
            courseTitle: normalizeValue(f["Course Title"]),
            duration: normalizeValue(f.Duration),
            courseType: normalizeValue(f["Course Type"]),
            targetAudience: normalizeArray(f["Target Audience"]),
            description: normalizeValue(f.Description),
            rank: readRank(f.rank, f.Rank, f.Seq, f.seq),
            sections: normalizeArray(f.Section || f.Sections || f["Catalog Section"]),
            pdfRecordIds: normalizeRecordIds(f.PDF || f.Pdfs || f.PDFs),
            sourceIndex: baseIndex + i,
        }
    })
}

function normalizeValue(value: any): string {
    if (value === null || value === undefined) return ""
    if (typeof value === "string") {
        const s = value.trim()
        return s === "[object Object]" ? "" : s
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value).trim()
    }
    if (typeof value === "object") {
        if (typeof value.name === "string") return value.name.trim()
        if (typeof value.label === "string") return value.label.trim()
        if (typeof value.value === "string") return value.value.trim()
        return ""
    }
    return ""
}

function normalizeArray(value: any): string[] {
    if (!Array.isArray(value)) {
        const single = normalizeValue(value)
        return single ? [single] : []
    }
    return value.map((item) => normalizeValue(item)).filter(Boolean)
}

function normalizeRecordIds(value: any): string[] {
    if (!Array.isArray(value)) {
        const single = normalizeValue(value)
        return /^rec[a-zA-Z0-9]{14,}$/.test(single) ? [single] : []
    }

    return value
        .map((item) => {
            if (typeof item === "string") return item.trim()
            if (item && typeof item === "object") {
                return normalizeValue(item.id ?? item.recordId ?? item.value)
            }
            return normalizeValue(item)
        })
        .filter((id) => /^rec[a-zA-Z0-9]{14,}$/.test(id))
}

function readRank(...values: any[]): number | null {
    for (const value of values) {
        const n = Number(normalizeValue(value))
        if (Number.isFinite(n)) return n
    }
    return null
}

function uniqueStrings(values: string[]): string[] {
    return Array.from(
        new Set(values.map((value) => normalizeValue(value)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))
}

function normalize(value: string): string {
    return normalizeValue(value).toLowerCase()
}

function parseDurationHours(duration: string): { min: number; max: number } {
    const text = normalizeValue(duration)
    const numbers = text.match(/\d+/g)?.map((n) => Number(n)) || []
    if (!numbers.length) return { min: 0, max: Number.POSITIVE_INFINITY }
    if (numbers.length === 1) return { min: numbers[0], max: numbers[0] }
    const sorted = [...numbers].sort((a, b) => a - b)
    return { min: sorted[0], max: sorted[sorted.length - 1] }
}

addPropertyControls(CoursesGridExplorer, {
    workerUrl: {
        type: ControlType.String,
        title: "Worker URL",
        defaultValue: "https://coded-landingpage.tools-c81.workers.dev",
    },
    apiBaseUrl: {
        type: ControlType.String,
        title: "API Base",
        defaultValue: "https://coded-landingpage.tools-c81.workers.dev",
    },
    initialVisible: {
        type: ControlType.Number,
        title: "Top",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
    },
    loadMoreStep: {
        type: ControlType.Number,
        title: "Load +",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#1996F0",
    },
    modalHeaderTitle: {
        type: ControlType.String,
        title: "Modal Title",
        defaultValue: "Request {{courseTitle}}",
    },
    modalHeaderSubtitle: {
        type: ControlType.String,
        title: "Modal Sub",
        defaultValue: "Fill your details to receive the offer.",
    },
})
