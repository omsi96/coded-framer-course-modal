// API Card List Component - Fetches data from Cloudflare Worker and displays it as cards
import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type FormEvent,
} from "react"
import { addPropertyControls, ControlType } from "framer"

interface CardData {
    id: string
    title: string
    description: string
    image?: string | null
    speciality?: string
    rawFields?: Record<string, any>
}

type AnyRecord = Record<string, any>

interface AttachmentItem {
    url: string
    name: string
    type?: string
    thumbnail?: string
}

type MediaKind = "image" | "video" | "pdf" | "file"

interface GalleryItem extends AttachmentItem {
    mediaKind: MediaKind
    projectName?: string
}

interface APICardListProps {
    workerApiUrl: string
    // legacy fallback (previous config key)
    airtableBaseId?: string
    connectApiBaseUrl?: string
    titleKey: string
    descriptionKey: string
    titleDataType: "string" | "number" | "boolean" | "json" | "image"
    descriptionDataType: "string" | "number" | "boolean" | "json" | "image"
    imageKey: string
    imageDataType: "string" | "number" | "boolean" | "json" | "image"
    specialityKey: string
    showImage: boolean
    showRawData: boolean
    showFilters: boolean
    maxItems: number
    backgroundColor: string
    cardBackground: string
    titleColor: string
    descriptionColor: string
    filterBackgroundColor: string
    filterActiveColor: string
    filterTextColor: string
    filterActiveTextColor: string
    titleFont: any
    descriptionFont: any
    cardRadius: number
    cardGap: number
    cardPadding: number
    showShadow: boolean
    columns: number
    minCardWidth: number
    tabletBreakpoint: number
    mobileBreakpoint: number
    placeholderImage: string
    bannerImage: string
    aboutMeKey: string
    demoVideoKey: string
    attachmentsKey: string
    alumniPromoEnabled: boolean
    alumniPromoClicks: number
    alumniInviteWebhook: string
    cardVariant: "default" | "profile"
    profileImageRadius: number
    onCardClick?: (cardData: CardData) => void
    style?: CSSProperties
}

// Filter options
const FILTER_OPTIONS = [
    { label: "All", value: "all" },
    { label: "Full-Stack", value: "Full-Stack" },
    { label: "Data-Science", value: "Data-Science" },
    { label: "Cybersecurity", value: "Cybersecurity" },
]

/**
 * API Card List
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function APICardList(props: APICardListProps) {
    const {
        workerApiUrl = "",
        airtableBaseId = "",
        connectApiBaseUrl = "https://coded-landingpage.tools-c81.workers.dev",
        titleKey = "title",
        descriptionKey = "body",
        titleDataType = "string",
        descriptionDataType = "string",
        imageKey = "image",
        imageDataType = "image",
        specialityKey = "Speciality",
        showImage = false,
        showRawData = false,
        showFilters = true,
        maxItems = 10,
        backgroundColor = "#F5F5F5",
        cardBackground = "#FFFFFF",
        titleColor = "#000000",
        descriptionColor = "#666666",
        filterBackgroundColor = "#E7E7E8",
        filterActiveColor = "#000000",
        filterTextColor = "#666666",
        filterActiveTextColor = "#FFFFFF",
        titleFont,
        descriptionFont,
        cardRadius = 12,
        cardGap = 16,
        cardPadding = 20,
        showShadow = true,
        columns = 2,
        minCardWidth = 220,
        tabletBreakpoint = 900,
        mobileBreakpoint = 640,
        placeholderImage = "",
        bannerImage = "",
        aboutMeKey = "about",
        demoVideoKey = "demoVideo",
        attachmentsKey = "attachments",
        alumniPromoEnabled = true,
        alumniPromoClicks = 2,
        alumniInviteWebhook = "",
        cardVariant = "default",
        profileImageRadius = 28,
        onCardClick,
        style,
    } = props

    const [cards, setCards] = useState<CardData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [rawData, setRawData] = useState<any>(null)
    const [containerWidth, setContainerWidth] = useState(0)
    const [activeFilter, setActiveFilter] = useState<string>("all")
    const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
    const [peekReady, setPeekReady] = useState(false)
    const [videoOpen, setVideoOpen] = useState(false)
    const [isRtl, setIsRtl] = useState(false)
    const [promoOpen, setPromoOpen] = useState(false)
    const [promoReady, setPromoReady] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteStatus, setInviteStatus] = useState<
        "idle" | "sending" | "sent" | "error"
    >("idle")
    const [connectOpen, setConnectOpen] = useState(false)
    const [connectReady, setConnectReady] = useState(false)
    const [connectCompanyName, setConnectCompanyName] = useState("")
    const [connectContactName, setConnectContactName] = useState("")
    const [connectEmail, setConnectEmail] = useState("")
    const [connectPhone, setConnectPhone] = useState("")
    const [connectWebsite, setConnectWebsite] = useState("")
    const [connectRoleType, setConnectRoleType] = useState("")
    const [connectMessage, setConnectMessage] = useState("")
    const [connectStatus, setConnectStatus] = useState<
        "idle" | "sending" | "sent" | "error"
    >("idle")
    const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const closeTimerRef = useRef<number | null>(null)
    const promoSeenRef = useRef(false)
    const promoClickCountRef = useRef(0)
    const lastCardClickRef = useRef<{ id: string; ts: number } | null>(null)
    const promoStorageKey = "coded_alumni_promo_seen"

    useEffect(() => {
        if (!selectedCard) {
            setPeekReady(false)
            setVideoOpen(false)
            return
        }

        const raf = requestAnimationFrame(() => setPeekReady(true))
        return () => cancelAnimationFrame(raf)
    }, [selectedCard])

    useEffect(() => {
        if (typeof window === "undefined") return
        promoSeenRef.current =
            window.sessionStorage.getItem(promoStorageKey) === "1"
    }, [promoStorageKey])

    useEffect(() => {
        if (!promoOpen) {
            setPromoReady(false)
            setInviteOpen(false)
            setInviteEmail("")
            setInviteStatus("idle")
            return
        }
        const raf = requestAnimationFrame(() => setPromoReady(true))
        return () => cancelAnimationFrame(raf)
    }, [promoOpen])

    useEffect(() => {
        if (!connectOpen) {
            setConnectReady(false)
            return
        }
        const raf = requestAnimationFrame(() => setConnectReady(true))
        return () => cancelAnimationFrame(raf)
    }, [connectOpen])

    useEffect(() => {
        if (typeof document === "undefined") return

        const root = document.documentElement
        const body = document.body

        const updateDir = () => {
            const attrDir =
                root.getAttribute("dir") || body?.getAttribute("dir") || ""
            if (attrDir) {
                setIsRtl(attrDir.toLowerCase() === "rtl")
                return
            }

            const computedDir =
                window.getComputedStyle(root).direction ||
                (body ? window.getComputedStyle(body).direction : "")
            setIsRtl(computedDir === "rtl")
        }

        updateDir()

        const observer = new MutationObserver(updateDir)
        observer.observe(root, { attributes: true, attributeFilter: ["dir"] })
        if (body) {
            observer.observe(body, { attributes: true, attributeFilter: ["dir"] })
        }

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        return () => {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current)
            }
        }
    }, [])

    const shouldLockScroll =
        Boolean(selectedCard) ||
        promoOpen ||
        connectOpen ||
        activeMediaIndex !== null

    useEffect(() => {
        if (!shouldLockScroll || typeof document === "undefined") return

        const root = document.documentElement
        const body = document.body
        const prevBodyOverflow = body.style.overflow
        const prevRootOverflow = root.style.overflow
        const prevBodyPaddingRight = body.style.paddingRight
        const scrollBarWidth = window.innerWidth - root.clientWidth

        body.style.overflow = "hidden"
        root.style.overflow = "hidden"
        if (scrollBarWidth > 0) {
            body.style.paddingRight = `${scrollBarWidth}px`
        }

        return () => {
            body.style.overflow = prevBodyOverflow
            root.style.overflow = prevRootOverflow
            body.style.paddingRight = prevBodyPaddingRight
        }
    }, [shouldLockScroll])

    useEffect(() => {
        if (typeof window === "undefined") return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return
            if (activeMediaIndex !== null) {
                setActiveMediaIndex(null)
                return
            }
            if (connectOpen) {
                setConnectOpen(false)
                setConnectStatus("idle")
                return
            }
            if (selectedCard) {
                setPeekReady(false)
                setSelectedCard(null)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [activeMediaIndex, connectOpen, selectedCard])

    // Helper function to convert value based on data type
    const convertValue = (value: any, dataType: string): string => {
        if (value === null || value === undefined) {
            if (dataType === "image") return ""
            return dataType === "string" ? "No Data" : String(value)
        }

        switch (dataType) {
            case "string":
                return String(value)
            case "number": {
                const num = Number(value)
                return isNaN(num) ? String(value) : String(num)
            }
            case "boolean": {
                if (typeof value === "boolean") return String(value)
                if (typeof value === "number") return String(value !== 0)
                if (typeof value === "string") {
                    const v = value.trim().toLowerCase()
                    if (["false", "0", "no", "n", "off"].includes(v))
                        return "false"
                    if (["true", "1", "yes", "y", "on"].includes(v))
                        return "true"
                    return String(value)
                }
                return String(Boolean(value))
            }
            case "json":
                return typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value)
            case "image": {
                if (Array.isArray(value)) {
                    if (typeof value[0] === "string") {
                        return String(value[0] || "")
                    }
                    const first = value[0] as AnyRecord | undefined
                    if (first && typeof first === "object") {
                        const urlValue = first.url || first.thumbnail?.url
                        return urlValue ? String(urlValue) : ""
                    }
                }
                if (typeof value === "object" && value !== null) {
                    const v: AnyRecord = value
                    const urlValue =
                        v.url ||
                        v.src ||
                        v.href ||
                        v.link ||
                        v.image ||
                        v.thumbnail ||
                        v.photo ||
                        v.picture
                    return urlValue ? String(urlValue) : ""
                }
                return String(value)
            }
            default:
                return String(value)
        }
    }

    const getByPath = (obj: any, path: string): any => {
        if (!path) return obj
        return path
            .split(".")
            .filter(Boolean)
            .reduce((acc, key) => {
                if (acc === null || acc === undefined) return undefined
                const index = Number(key)
                if (Number.isInteger(index) && Array.isArray(acc))
                    return acc[index]
                return acc[key]
            }, obj)
    }

    const extractYouTubeId = (value: string): string | null => {
        if (!value) return null
        const trimmed = value.trim()
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
        try {
            const url = new URL(trimmed)
            if (url.hostname.includes("youtu.be")) {
                const id = url.pathname.split("/")[1]
                return id || null
            }
            if (url.hostname.includes("youtube.com")) {
                const v = url.searchParams.get("v")
                if (v) return v
                if (url.pathname.startsWith("/embed/")) {
                    return url.pathname.split("/")[2] || null
                }
                if (url.pathname.startsWith("/shorts/")) {
                    return url.pathname.split("/")[2] || null
                }
            }
        } catch {
            // ignore malformed URL
        }
        const match = trimmed.match(
            /(?:v=|\/)([a-zA-Z0-9_-]{11})(?:\?|&|$)/
        )
        return match ? match[1] : null
    }

    const normalizeAttachments = (value: any): AttachmentItem[] => {
        if (!value) return []
        const items = Array.isArray(value) ? value : [value]
        return items
            .map((item) => {
                if (!item) return null
                if (typeof item === "string") {
                    const parts = item.split("/")
                    const name = decodeURIComponent(parts[parts.length - 1] || "")
                    return { url: item, name: name || "Attachment" }
                }
                if (typeof item === "object") {
                    const url = item.url || item.href || item.link
                    if (!url) return null
                    const name =
                        item.filename ||
                        item.name ||
                        item.title ||
                        decodeURIComponent(
                            String(url).split("/").slice(-1)[0] || ""
                        ) ||
                        "Attachment"
                    const thumbnail =
                        item.thumbnails?.large?.url ||
                        item.thumbnails?.small?.url ||
                        item.thumbnail?.url ||
                        item.preview?.url
                    const type = item.type || item.mimeType || item.mimetype
                    return { url: String(url), name: String(name), type, thumbnail }
                }
                return null
            })
            .filter(Boolean) as AttachmentItem[]
    }

    const detectMediaKind = (item: AttachmentItem): MediaKind => {
        const mime = String(item.type || "").toLowerCase()
        if (mime.startsWith("image/")) return "image"
        if (mime.startsWith("video/")) return "video"
        if (mime.includes("pdf")) return "pdf"

        const lowerUrl = String(item.url || "").toLowerCase()
        const lowerName = String(item.name || "").toLowerCase()
        const target = `${lowerName} ${lowerUrl}`

        if (
            /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?|$)/i.test(target)
        ) {
            return "image"
        }
        if (/\.(mp4|mov|webm|ogg|m4v)(\?|$)/i.test(target)) return "video"
        if (/\.pdf(\?|$)/i.test(target)) return "pdf"
        return "file"
    }

    const buildProjectGalleryItems = (rawFields: any): GalleryItem[] => {
        const items: GalleryItem[] = []
        const projects = Array.isArray(rawFields?.projects) ? rawFields.projects : []

        for (const project of projects) {
            const projectName =
                typeof project?.name === "string" && project.name.trim()
                    ? project.name.trim()
                    : "Project Attachment"
            const attachments = normalizeAttachments(
                project?.attachmentItems || project?.attachmentUrls || []
            )
            for (const attachment of attachments) {
                items.push({
                    ...attachment,
                    name: projectName,
                    projectName,
                    mediaKind: detectMediaKind(attachment),
                })
            }
        }

        if (items.length > 0) return items

        const fallback = normalizeAttachments(getByPath(rawFields, attachmentsKey))
        return fallback.map((item) => ({
            ...item,
            mediaKind: detectMediaKind(item),
        }))
    }

    const coerceString = (value: any): string => {
        if (value === null || value === undefined) return ""
        if (typeof value === "string") return value
        if (typeof value === "number" || typeof value === "boolean")
            return String(value)
        if (Array.isArray(value)) return coerceString(value[0])
        if (typeof value === "object") {
            return (
                value.url ||
                value.href ||
                value.link ||
                value.value ||
                ""
            )
        }
        return String(value)
    }

    const buildWorkerUrl = (): string => {
        const source = (workerApiUrl || airtableBaseId || "").trim()
        if (!source) return ""

        // If only host-like value is provided, normalize to https URL
        const normalizedSource =
            /^https?:\/\//i.test(source) ? source : `https://${source}`

        const workerUrl = new URL(normalizedSource)
        if (
            !workerUrl.pathname ||
            workerUrl.pathname === "/" ||
            workerUrl.pathname === ""
        ) {
            workerUrl.pathname = "/graduates"
        }

        const pageSize = Math.min(Math.max(maxItems, 1), 100)
        workerUrl.searchParams.set("limit", String(pageSize))
        workerUrl.searchParams.set("includeProjects", "true")
        return workerUrl.toString()
    }

    const normalizeWorkerGraduateToRecord = (graduate: AnyRecord): AnyRecord => {
        const profileImageUrls = Array.isArray(graduate?.profileImageUrls)
            ? graduate.profileImageUrls.filter(Boolean)
            : []
        const projectAttachments = Array.isArray(graduate?.attachments)
            ? graduate.attachments.filter(Boolean)
            : []
        const fallbackImage = profileImageUrls[0] || ""

        return {
            id: graduate?.recordId || graduate?.id,
            fields: {
                title: graduate?.name || "",
                body: graduate?.title || graduate?.about || "",
                image: graduate?.image || fallbackImage,
                Speciality: graduate?.speciality || "",
                about: graduate?.about || graduate?.title || "",
                demoVideo: graduate?.demoVideo || "",
                attachments: projectAttachments,

                // Aliases
                speciality: graduate?.speciality || "",
                name: graduate?.name || "",

                // Airtable-like field names
                Name: graduate?.name || "",
                Title: graduate?.title || "",
                Email: graduate?.email || "",
                Linkedin: graduate?.linkedin || "",
                Status: graduate?.status || "",
                "Years of experience": graduate?.yearsOfExperience || "",
                "Graduate Preference": graduate?.preferences || [],
                "Graduates Projects": graduate?.graduateProjectRecordIds || [],
                Attachments: profileImageUrls.map((url: string, index: number) => ({
                    url,
                    name: `Profile ${index + 1}`,
                    type: "url",
                })),

                projects: graduate?.projects || [],
                profileImageUrls,
                rawGraduate: graduate,
            },
        }
    }

    useEffect(() => {
        if (typeof window === "undefined") return

        const controller = new AbortController()

        const fetchData = async () => {
            try {
                startTransition(() => {
                    setLoading(true)
                    setError(null)
                })

                const hasWorkerConfig = Boolean(
                    (workerApiUrl || airtableBaseId || "").trim()
                )

                if (!hasWorkerConfig) {
                    startTransition(() => {
                        setCards([])
                        setRawData(null)
                        setLoading(false)
                    })
                    return
                }

                const response = await fetch(buildWorkerUrl(), {
                    signal: controller.signal,
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()

                startTransition(() => {
                    setRawData(data)
                })

                const normalizedRecords: AnyRecord[] = Array.isArray(data?.records)
                    ? data.records
                    : Array.isArray(data?.graduates)
                      ? data.graduates.map(normalizeWorkerGraduateToRecord)
                      : data?.graduate && typeof data.graduate === "object"
                        ? [normalizeWorkerGraduateToRecord(data.graduate)]
                        : []

                const items = normalizedRecords
                    .map((record: AnyRecord) => ({
                          id: record?.id,
                          ...record?.fields,
                      }))

                const mappedCards: CardData[] = items
                    .map((item) => ({
                        id:
                            item.id ||
                            `card-${Math.random().toString(36).substr(2, 9)}`,
                        title: convertValue(
                            getByPath(item, titleKey),
                            titleDataType
                        ),
                        description: convertValue(
                            getByPath(item, descriptionKey),
                            descriptionDataType
                        ),
                        image: showImage
                            ? convertValue(
                                  getByPath(item, imageKey),
                                  imageDataType
                              )
                            : undefined,
                        speciality: getByPath(item, specialityKey) || "",
                        rawFields: item,
                    }))
                    .slice(0, maxItems)

                startTransition(() => {
                    setCards(mappedCards)
                    setLoading(false)
                })
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError")
                    return

                startTransition(() => {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to fetch data"
                    )
                    setLoading(false)
                })
            }
        }

        fetchData()

        return () => {
            controller.abort()
        }
    }, [
        workerApiUrl,
        airtableBaseId,
        titleKey,
        descriptionKey,
        imageKey,
        showImage,
        titleDataType,
        descriptionDataType,
        imageDataType,
        specialityKey,
        maxItems,
    ])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) setContainerWidth(entry.contentRect.width)
        })

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [])

    // Filter cards based on active filter
    const filteredCards = cards.filter((card) => {
        if (activeFilter === "all") return true
        return card.speciality?.toLowerCase() === activeFilter.toLowerCase()
    })

    const triggerPromo = () => {
        if (!alumniPromoEnabled || promoOpen || promoSeenRef.current) return
        setPromoOpen(true)
        promoSeenRef.current = true
        if (typeof window !== "undefined") {
            window.sessionStorage.setItem(promoStorageKey, "1")
        }
    }

    // Handle card click
    const handleCardClick = (card: CardData) => {
        const now = Date.now()
        const lastClick = lastCardClickRef.current
        const isDoubleProfileClick =
            !!lastClick &&
            lastClick.id === card.id &&
            now - lastClick.ts <= 500

        lastCardClickRef.current = { id: card.id, ts: now }

        if (isDoubleProfileClick) {
            openConnectModal(card)
            return
        }

        if (onCardClick) {
            onCardClick(card)
        } else {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current)
                closeTimerRef.current = null
            }
            setSelectedCard(card)
        }
        if (alumniPromoEnabled && !promoOpen && !promoSeenRef.current) {
            const nextCount = promoClickCountRef.current + 1
            promoClickCountRef.current = nextCount
            if (nextCount >= Math.max(1, alumniPromoClicks)) {
                triggerPromo()
            }
        }
    }

    const openConnectModal = (card: CardData) => {
        setSelectedCard(card)
        if (!connectMessage.trim()) {
            setConnectMessage(
                `I'd like to connect regarding ${card.title || "this graduate"}.`
            )
        }
        setConnectStatus("idle")
        setConnectOpen(true)
    }

    const handleCardDoubleClick = (card: CardData) => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
        }
        openConnectModal(card)
    }

    // Close detail view
    const handleCloseDetail = () => {
        if (!selectedCard) return
        setPeekReady(false)
        setConnectOpen(false)
        setActiveMediaIndex(null)
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current)
        }
        closeTimerRef.current = window.setTimeout(() => {
            setSelectedCard(null)
            closeTimerRef.current = null
        }, 260)
    }

    const handlePromoDismiss = () => {
        setPromoOpen(false)
        setInviteOpen(false)
        setInviteEmail("")
        setInviteStatus("idle")
    }

    const handleConnectDismiss = () => {
        setConnectOpen(false)
        setConnectStatus("idle")
    }

    const clearConnectForm = () => {
        setConnectCompanyName("")
        setConnectContactName("")
        setConnectEmail("")
        setConnectPhone("")
        setConnectWebsite("")
        setConnectRoleType("")
        setConnectMessage("")
    }

    const emailIsValid = /^\S+@\S+\.\S+$/.test(inviteEmail.trim())

    const handleInviteSubmit = async (event: FormEvent) => {
        event.preventDefault()
        if (!emailIsValid || inviteStatus === "sending") return
        if (!alumniInviteWebhook) {
            setInviteStatus("error")
            return
        }
        setInviteStatus("sending")
        try {
            const response = await fetch(alumniInviteWebhook, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: inviteEmail.trim(),
                    source: "APICardList",
                    platform: "CODED Alumni Network",
                    cardId: selectedCard?.id || null,
                    cardTitle: selectedCard?.title || null,
                    timestamp: new Date().toISOString(),
                }),
            })
            if (!response.ok) throw new Error("Request failed")
            setInviteStatus("sent")
        } catch {
            setInviteStatus("error")
        }
    }

    const connectEmailIsValid =
        !connectEmail.trim() || /^\S+@\S+\.\S+$/.test(connectEmail.trim())

    const postConnectRequest = async (overrides?: Partial<AnyRecord>) => {
        if (!selectedCard) throw new Error("No selected card")
        const endpoint = `${connectApiBaseUrl.replace(/\/+$/, "")}/companyrequestgraduate`
        const payload = {
            companyName: connectCompanyName || "Unknown Company",
            contactName: connectContactName || "",
            companyEmail: connectEmail || "",
            phone: connectPhone || "",
            companyWebsite: connectWebsite || "",
            roleType: connectRoleType || "",
            message:
                connectMessage ||
                `Request to connect with ${selectedCard.title || "graduate"}`,
            graduateName: selectedCard.title || "",
            graduateRecordId:
                selectedCard.id?.startsWith("rec") ? selectedCard.id : "",
            source: "Framer-Connect-Modal",
            ...(overrides || {}),
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error("Request failed")
    }

    const handleQuickConnect = async (card: CardData) => {
        setSelectedCard(card)
        setConnectStatus("sending")
        setConnectOpen(true)
        try {
            await postConnectRequest({
                graduateName: card.title || "",
                graduateRecordId: card.id?.startsWith("rec") ? card.id : "",
                message:
                    connectMessage ||
                    `Quick connect request from profile click for ${card.title || "graduate"}.`,
                source: "Framer-Connect-Button",
            })
            clearConnectForm()
            setConnectStatus("idle")
            setConnectOpen(false)
        } catch {
            setConnectStatus("error")
        }
    }

    const handleConnectSubmit = async (event: FormEvent) => {
        event.preventDefault()
        if (!selectedCard || connectStatus === "sending") return
        if (!connectEmailIsValid) {
            setConnectStatus("error")
            return
        }

        setConnectStatus("sending")
        try {
            await postConnectRequest()
            clearConnectForm()
            setConnectStatus("idle")
            setConnectOpen(false)
        } catch {
            setConnectStatus("error")
        }
    }

    const containerStyle: CSSProperties = {
        ...style,
        width: "100%",
        height: "100%",
        backgroundColor,
        padding: cardGap,
        overflow: shouldLockScroll ? "hidden" : "auto",
        position: "relative",
    }

    const filterContainerStyle: CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: cardGap,
        justifyContent: "center",
    }

    const filterButtonStyle = (isActive: boolean): CSSProperties => ({
        padding: "10px 20px",
        borderRadius: 999,
        border: "none",
        backgroundColor: isActive ? filterActiveColor : filterBackgroundColor,
        color: isActive ? filterActiveTextColor : filterTextColor,
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        outline: "none",
    })

    const gridStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns:
            containerWidth <= mobileBreakpoint
                ? "1fr"
                : containerWidth <= tabletBreakpoint
                  ? `repeat(${columns}, minmax(0, 1fr))`
                  : `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`,
        gap: cardGap,
        width: "100%",
    }

    const isProfileVariant = cardVariant === "profile"
    const isNarrow =
        (containerWidth > 0 && containerWidth <= mobileBreakpoint) ||
        (typeof window !== "undefined" &&
            window.innerWidth <= mobileBreakpoint)
    const peekAvatarSize = isNarrow ? 72 : 88
    const bannerHeight = isNarrow ? 140 : 170

    const cardStyle: CSSProperties = {
        backgroundColor: cardBackground,
        borderRadius: cardRadius,
        padding: isProfileVariant ? 0 : cardPadding,
        border: isProfileVariant ? "none" : "1px solid #E7E7E8",
        boxShadow: showShadow ? "0 10px 30px rgba(0, 0, 0, 0.08)" : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: isProfileVariant ? "stretch" : "center",
        textAlign: "center",
        gap: isProfileVariant ? 0 : 12,
        overflow: isProfileVariant ? "hidden" : "visible",
        cursor: "pointer",
    }

    const profileContentStyle: CSSProperties = {
        padding: `${cardPadding + 6}px ${cardPadding + 4}px ${
            cardPadding + 8
        }px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
    }

    const titleStyle: CSSProperties = {
        ...titleFont,
        color: titleColor,
        margin: 0,
        marginTop: isProfileVariant ? 6 : 4,
        fontSize: isProfileVariant ? "22px" : titleFont?.fontSize,
        fontWeight: isProfileVariant ? 600 : titleFont?.fontWeight,
    }

    const descriptionStyle: CSSProperties = isProfileVariant
        ? {
              ...descriptionFont,
              color: descriptionColor,
              margin: 0,
              fontSize: "14px",
              lineHeight: "1.4em",
          }
        : {
              ...descriptionFont,
              color: descriptionColor,
              margin: 0,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid rgba(0, 0, 0, 0.1)",
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              fontSize: "12px",
          }

    const specialityBadgeStyle: CSSProperties = {
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 999,
        backgroundColor: "rgba(116, 107, 255, 0.1)",
        color: "#746BFF",
        fontSize: "12px",
        fontWeight: 500,
        marginTop: 8,
    }

    const avatarStyle: CSSProperties = {
        width: 72,
        height: 72,
        borderRadius: "50%",
        objectFit: "cover",
        backgroundColor: "#F0F0F0",
    }

    const profileImageStyle: CSSProperties = {
        width: "100%",
        height: 260,
        objectFit: "cover",
        borderRadius: `${profileImageRadius}px ${profileImageRadius}px ${profileImageRadius}px ${profileImageRadius}px`,
        backgroundColor: "#746BFF",
        display: "block",
    }

    // Detail overlay styles
    const overlayStyle: CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 15, 15, 0.35)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
        zIndex: 1000,
        overflow: "hidden",
    }

    const detailCardStyle: CSSProperties = {
        backgroundColor: cardBackground,
        borderRadius: 0,
        padding: 0,
        width: isNarrow ? "100%" : "45%",
        height: "100%",
        maxHeight: "100%",
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        position: "relative",
        boxShadow: isRtl
            ? "20px 0 60px rgba(0, 0, 0, 0.25)"
            : "-20px 0 60px rgba(0, 0, 0, 0.25)",
        borderLeft:
            !isRtl && !isNarrow ? "1px solid rgba(0, 0, 0, 0.08)" : "none",
        borderRight:
            isRtl && !isNarrow ? "1px solid rgba(0, 0, 0, 0.08)" : "none",
        display: "flex",
        flexDirection: "column",
        transform: peekReady
            ? "translateX(0)"
            : isRtl
              ? "translateX(-100%)"
              : "translateX(100%)",
        transition: "transform 260ms ease",
        willChange: "transform",
    }

    const promoOverlayStyle: CSSProperties = {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(7, 10, 16, 0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        opacity: promoReady ? 1 : 0,
        transition: "opacity 520ms ease",
        zIndex: 2200,
    }

    const promoCardStyle: CSSProperties = {
        width: "100%",
        maxWidth: isNarrow ? "94vw" : "560px",
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 40px 90px rgba(0, 0, 0, 0.45)",
        position: "relative",
        transform: promoReady ? "translateY(0)" : "translateY(14px)",
        opacity: promoReady ? 1 : 0,
        transition: "opacity 320ms ease 120ms, transform 320ms ease 120ms",
    }

    const promoHeroStyle: CSSProperties = {
        padding: "24px 24px 18px",
        background:
            "linear-gradient(135deg, rgba(7, 31, 64, 0.98) 0%, rgba(15, 98, 254, 0.95) 100%)",
        color: "#FFFFFF",
    }

    const promoTagStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        backgroundColor: "rgba(255, 255, 255, 0.18)",
    }

    const promoTitleStyle: CSSProperties = {
        margin: "12px 0 8px",
        fontSize: isNarrow ? "22px" : "26px",
        fontWeight: 700,
        lineHeight: "1.2em",
    }

    const promoSubtitleStyle: CSSProperties = {
        margin: 0,
        fontSize: "14px",
        lineHeight: "1.5em",
        color: "rgba(255, 255, 255, 0.85)",
    }

    const promoBodyStyle: CSSProperties = {
        padding: "20px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
    }

    const promoFeatureGridStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
        gap: 12,
    }

    const promoFeatureCardStyle: CSSProperties = {
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#F3F6FB",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    }

    const promoFeatureTitleStyle: CSSProperties = {
        fontSize: "13px",
        fontWeight: 700,
        color: "#0F1E32",
    }

    const promoFeatureCopyStyle: CSSProperties = {
        fontSize: "12px",
        color: "#52606D",
        lineHeight: "1.4em",
        margin: 0,
    }

    const promoActionsStyle: CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
    }

    const promoPrimaryButtonStyle: CSSProperties = {
        padding: "12px 18px",
        borderRadius: 999,
        border: "none",
        backgroundColor: "#0A66C2",
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    }

    const promoSecondaryButtonStyle: CSSProperties = {
        padding: "12px 18px",
        borderRadius: 999,
        border: "1px solid rgba(0, 0, 0, 0.12)",
        backgroundColor: "#FFFFFF",
        color: "#1F2A37",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    }

    const promoDismissStyle: CSSProperties = {
        fontSize: "12px",
        color: "#64748B",
    }

    const promoFormStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: 12,
    }

    const promoInputStyle: CSSProperties = {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid rgba(0, 0, 0, 0.12)",
        fontSize: "14px",
        outline: "none",
    }

    const promoInputHintStyle: CSSProperties = {
        fontSize: "12px",
        color: inviteStatus === "error" ? "#D14343" : "#64748B",
        margin: 0,
    }

    const promoCloseStyle: CSSProperties = {
        position: "absolute",
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 10,
        border: "1px solid rgba(255, 255, 255, 0.4)",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        color: "#FFFFFF",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
    }

    const closeButtonStyle: CSSProperties = {
        position: "absolute",
        top: 12,
        right: isRtl ? "auto" : 12,
        left: isRtl ? 12 : "auto",
        width: 34,
        height: 34,
        borderRadius: 10,
        border: "1px solid rgba(0, 0, 0, 0.08)",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        color: "#4A4A4A",
        fontSize: "18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 3,
    }

    const peekHeaderStyle: CSSProperties = {
        position: "relative",
        height: bannerHeight,
        background:
            "linear-gradient(135deg, rgba(238, 242, 247, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
        overflow: "visible",
    }

    const peekCoverImageStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    }

    const peekHeaderOverlayStyle: CSSProperties = {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -peekAvatarSize / 2,
        padding: `0 ${cardPadding * 1.5}px`,
        display: "flex",
        justifyContent: isRtl ? "flex-end" : "flex-start",
        zIndex: 2,
        pointerEvents: "none",
    }

    const peekContentStyle: CSSProperties = {
        padding: `${cardPadding * 1.5 + peekAvatarSize / 2}px ${
            cardPadding * 1.5
        }px ${cardPadding * 1.5}px`,
        display: "flex",
        flexDirection: "column",
        gap: 18,
    }

    const peekIdentityRowStyle: CSSProperties = {
        display: "flex",
        gap: 16,
        alignItems: "flex-end",
    }

    const peekAvatarStyle: CSSProperties = {
        width: peekAvatarSize,
        height: peekAvatarSize,
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #FFFFFF",
        backgroundColor: "#F0F2F5",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.18)",
        flexShrink: 0,
    }

    const peekInitialsStyle: CSSProperties = {
        width: peekAvatarSize,
        height: peekAvatarSize,
        borderRadius: "50%",
        border: "3px solid #FFFFFF",
        backgroundColor: "#DDE3EA",
        color: "#445065",
        fontSize: isNarrow ? "22px" : "24px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.18)",
        flexShrink: 0,
        textTransform: "uppercase",
    }

    const peekIntroStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        textAlign: isRtl ? "right" : "left",
        alignItems: isRtl ? "flex-end" : "flex-start",
    }

    const peekNameStyle: CSSProperties = {
        ...titleFont,
        color: titleColor,
        margin: 0,
        fontSize: isNarrow ? "22px" : "26px",
        fontWeight: 600,
    }

    const peekHeadlineStyle: CSSProperties = {
        ...descriptionFont,
        color: descriptionColor,
        margin: 0,
        fontSize: "15px",
        lineHeight: "1.4em",
    }

    const peekSummaryStyle: CSSProperties = {
        ...descriptionFont,
        color: descriptionColor,
        margin: 0,
        fontSize: "14px",
        lineHeight: "1.5em",
        opacity: 0.9,
    }

    const peekActionRowStyle: CSSProperties = {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: isRtl ? "flex-end" : "flex-start",
    }

    const peekPrimaryActionStyle: CSSProperties = {
        padding: "10px 16px",
        borderRadius: 20,
        border: "none",
        backgroundColor: "#0A66C2",
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    }

    const peekSecondaryActionStyle: CSSProperties = {
        padding: "10px 16px",
        borderRadius: 20,
        border: "1px solid rgba(0, 0, 0, 0.12)",
        backgroundColor: "#FFFFFF",
        color: "#1F2A37",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    }

    const peekSectionStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    }

    const peekSectionTitleStyle: CSSProperties = {
        color: "#1F2A37",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
    }

    const peekSectionCardStyle: CSSProperties = {
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#FFFFFF",
    }

    const videoCardStyle: CSSProperties = {
        ...peekSectionCardStyle,
        padding: 0,
        overflow: "hidden",
    }

    const videoMediaStyle: CSSProperties = {
        width: "100%",
        aspectRatio: "16 / 9",
        display: "block",
        backgroundColor: "#EEF2F6",
        objectFit: "cover",
    }

    const videoPlayStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "linear-gradient(0deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 60%)",
    }

    const videoPlayButtonStyle: CSSProperties = {
        width: 56,
        height: 56,
        borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        color: "#1F2A37",
        fontSize: "18px",
        fontWeight: 700,
    }

    const attachmentCardStyle: CSSProperties = {
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(0, 0, 0, 0.08)",
        textDecoration: "none",
        color: "inherit",
        backgroundColor: "#FFFFFF",
    }

    const attachmentThumbStyle: CSSProperties = {
        width: 56,
        height: 56,
        borderRadius: 10,
        backgroundColor: "#EDF1F6",
        objectFit: "cover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 700,
        color: "#4B5563",
        flexShrink: 0,
    }

    const attachmentMetaStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 0,
    }

    const attachmentNameStyle: CSSProperties = {
        fontSize: "14px",
        fontWeight: 600,
        color: "#1F2A37",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    }

    const attachmentHintStyle: CSSProperties = {
        fontSize: "12px",
        color: "#6B7280",
    }

    const attachmentCarouselStyle: CSSProperties = {
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 6,
        scrollSnapType: "x mandatory",
    }

    const attachmentSlideStyle: CSSProperties = {
        minWidth: isNarrow ? "220px" : "280px",
        maxWidth: isNarrow ? "220px" : "280px",
        borderRadius: 12,
        border: "1px solid rgba(0, 0, 0, 0.08)",
        backgroundColor: "#FFFFFF",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "zoom-in",
        scrollSnapAlign: "start",
        flexShrink: 0,
    }

    const attachmentPreviewStyle: CSSProperties = {
        width: "100%",
        height: 160,
        borderRadius: 10,
        backgroundColor: "#EEF2F6",
        objectFit: "cover",
        display: "block",
    }

    const attachmentPdfFrameStyle: CSSProperties = {
        width: "100%",
        height: 160,
        border: "none",
        borderRadius: 10,
        backgroundColor: "#EEF2F6",
    }

    const attachmentCaptionStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: 2,
    }

    const attachmentProjectStyle: CSSProperties = {
        fontSize: "14px",
        fontWeight: 600,
        color: "#1F2A37",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    }

    const attachmentTypeStyle: CSSProperties = {
        fontSize: "12px",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    }

    const mediaOverlayStyle: CSSProperties = {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: isNarrow ? 16 : 24,
    }

    const mediaModalStyle: CSSProperties = {
        width: "min(960px, 100%)",
        maxHeight: "90vh",
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
    }

    const mediaContentStyle: CSSProperties = {
        width: "100%",
        maxHeight: "70vh",
        borderRadius: 12,
        backgroundColor: "#0F172A",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    const mediaActionRowStyle: CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    }

    const mediaNavButtonStyle: CSSProperties = {
        ...peekSecondaryActionStyle,
        padding: "8px 12px",
    }

    const connectOverlayStyle: CSSProperties = {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        padding: isNarrow ? 16 : 24,
    }

    const connectCardStyle: CSSProperties = {
        width: "min(560px, 100%)",
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
        overflow: "hidden",
        transform: connectReady ? "translateY(0)" : "translateY(14px)",
        opacity: connectReady ? 1 : 0.85,
        transition: "transform 0.2s ease, opacity 0.2s ease",
    }

    const connectHeaderStyle: CSSProperties = {
        padding: "18px 20px",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
    }

    const connectFormStyle: CSSProperties = {
        padding: 20,
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
        gap: 10,
    }

    const connectInputStyle: CSSProperties = {
        width: "100%",
        borderRadius: 10,
        border: "1px solid rgba(15, 23, 42, 0.14)",
        backgroundColor: "#FFFFFF",
        padding: "10px 12px",
        fontSize: "14px",
        color: "#1F2A37",
        outline: "none",
    }

    const connectTextAreaStyle: CSSProperties = {
        ...connectInputStyle,
        minHeight: 86,
        resize: "vertical",
    }

    const peekDetailItemStyle: CSSProperties = {
        padding: "12px 0",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
    }

    const peekDetailLabelStyle: CSSProperties = {
        color: "#52606D",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 6,
    }

    const peekDetailValueStyle: CSSProperties = {
        color: descriptionColor,
        fontSize: "14px",
        margin: 0,
        lineHeight: "1.5em",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
    }

    const toDetailText = (value: any): string => {
        if (value === null || value === undefined) return "-"
        if (typeof value === "string") return value
        if (typeof value === "number" || typeof value === "boolean")
            return String(value)
        if (Array.isArray(value)) {
            if (value.length === 0) return "[]"
            if (value.every((item) => typeof item === "string")) {
                return value.join(", ")
            }
            return `${value.length} item(s)`
        }
        if (typeof value === "object") {
            const text = JSON.stringify(value)
            if (!text) return "-"
            return text.length > 300 ? `${text.slice(0, 300)}...` : text
        }
        return String(value)
    }

    const normalizeFieldKey = (value: string): string =>
        String(value || "")
            .trim()
            .toLowerCase()

    const isEmptyDetailValue = (value: any): boolean => {
        if (value === null || value === undefined) return true
        if (typeof value === "string") return value.trim() === ""
        if (Array.isArray(value)) return value.length === 0
        if (typeof value === "object") return Object.keys(value).length === 0
        return false
    }

    const shouldHideDetailField = (key: string, value: any): boolean => {
        if (isEmptyDetailValue(value)) return true

        const normalizedKey = normalizeFieldKey(key)
        const configuredCoreKeys = new Set(
            [
                titleKey,
                descriptionKey,
                imageKey,
                specialityKey,
                aboutMeKey,
                demoVideoKey,
                attachmentsKey,
            ].map(normalizeFieldKey)
        )

        if (configuredCoreKeys.has(normalizedKey)) return true

        const internalKeys = new Set([
            "id",
            "title",
            "body",
            "image",
            "speciality",
            "name",
            "about",
            "demovideo",
            "attachments",
            "rawgraduate",
            "profileimageurls",
            "projects",
            "rawfields",
            "recordid",
        ])

        return internalKeys.has(normalizedKey)
    }

    const skeletonCount = Math.min(Math.max(maxItems, 4), 8)
    const skeletonBaseStyle: CSSProperties = {
        backgroundImage:
            "linear-gradient(90deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.12) 50%, rgba(0, 0, 0, 0.06) 100%)",
        backgroundSize: "200% 100%",
        animation: "apicardlist-shimmer 1.4s ease-in-out infinite",
    }
    const skeletonCardStyle: CSSProperties = {
        ...skeletonBaseStyle,
        height: isProfileVariant ? 260 : 180,
        borderRadius: cardRadius,
        border: "1px solid rgba(0, 0, 0, 0.08)",
    }
    const skeletonPillStyle: CSSProperties = {
        ...skeletonBaseStyle,
        height: 36,
        borderRadius: 999,
        width: 110,
    }

    const defaultPlaceholderImage =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23f0f0f0' width='400' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage not found%3C/text%3E%3C/svg%3E"
    const fallbackImage = placeholderImage || defaultPlaceholderImage
    const selectedInitials = selectedCard
        ? selectedCard.title
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("")
        : ""
    const aboutText = selectedCard
        ? coerceString(getByPath(selectedCard.rawFields, aboutMeKey))
        : ""
    const videoUrl = selectedCard
        ? coerceString(getByPath(selectedCard.rawFields, demoVideoKey))
        : ""
    const videoId = videoUrl ? extractYouTubeId(videoUrl) : null
    const videoThumb = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : ""
    const galleryItems: GalleryItem[] = selectedCard
        ? buildProjectGalleryItems(selectedCard.rawFields)
        : []
    const activeMedia =
        activeMediaIndex !== null &&
        activeMediaIndex >= 0 &&
        activeMediaIndex < galleryItems.length
            ? galleryItems[activeMediaIndex]
            : null

    if (typeof window === "undefined") {
        return (
            <div style={containerStyle} ref={containerRef}>
                <div style={{ textAlign: "center", padding: 40 }}>
                    Loading...
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div style={containerStyle} ref={containerRef}>
                <style>{`
                    @keyframes apicardlist-shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 10,
                        marginBottom: cardGap,
                    }}
                >
                    {showFilters &&
                        FILTER_OPTIONS.map((filter) => (
                            <div key={filter.value} style={skeletonPillStyle} />
                        ))}
                </div>
                <div style={gridStyle}>
                    {Array.from({ length: skeletonCount }).map((_, index) => (
                        <div key={index} style={skeletonCardStyle} />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={containerStyle} ref={containerRef}>
                <div
                    style={{
                        textAlign: "center",
                        padding: 40,
                        ...titleFont,
                        color: "#FF5588",
                    }}
                >
                    Error: {error}
                </div>
            </div>
        )
    }

    if (showRawData && rawData) {
        return (
            <div style={containerStyle} ref={containerRef}>
                <div
                    style={{
                        backgroundColor: "#1E1E1E",
                        color: "#D4D4D4",
                        padding: 20,
                        borderRadius: cardRadius,
                        fontFamily: "monospace",
                        fontSize: 12,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {JSON.stringify(rawData, null, 2)}
                </div>
            </div>
        )
    }

    if (cards.length === 0) {
        return (
            <div style={containerStyle} ref={containerRef}>
                <div
                    style={{
                        textAlign: "center",
                        padding: 40,
                        ...titleFont,
                        color: titleColor,
                    }}
                >
                    No data found
                </div>
            </div>
        )
    }

    return (
        <div style={containerStyle} ref={containerRef}>
            {/* Filter Buttons */}
            {showFilters && (
                <div style={filterContainerStyle}>
                    {FILTER_OPTIONS.map((filter) => (
                        <button
                            key={filter.value}
                            style={filterButtonStyle(
                                activeFilter === filter.value
                            )}
                            onClick={() => setActiveFilter(filter.value)}
                            onMouseEnter={(e) => {
                                if (activeFilter !== filter.value) {
                                    e.currentTarget.style.backgroundColor =
                                        "#D0D0D0"
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFilter !== filter.value) {
                                    e.currentTarget.style.backgroundColor =
                                        filterBackgroundColor
                                }
                            }}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Cards Grid */}
            <div style={gridStyle}>
                {filteredCards.map((card, index) => (
                    <div
                        key={card.id || index}
                        style={cardStyle}
                        onClick={() => handleCardClick(card)}
                        onDoubleClick={() => handleCardDoubleClick(card)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)"
                            if (showShadow) {
                                e.currentTarget.style.boxShadow =
                                    "0 15px 40px rgba(0, 0, 0, 0.15)"
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)"
                            e.currentTarget.style.boxShadow = showShadow
                                ? "0 10px 30px rgba(0, 0, 0, 0.08)"
                                : "none"
                        }}
                    >
                        {showImage && isProfileVariant && (
                            <img
                                src={card.image || fallbackImage}
                                alt={card.title}
                                style={profileImageStyle}
                                onError={(e) => {
                                    if (e.currentTarget.src !== fallbackImage) {
                                        e.currentTarget.src = fallbackImage
                                        e.currentTarget.style.backgroundColor =
                                            "#f0f0f0"
                                    }
                                }}
                            />
                        )}
                        <div
                            style={
                                isProfileVariant
                                    ? profileContentStyle
                                    : undefined
                            }
                        >
                            {showImage && !isProfileVariant && (
                                <img
                                    src={card.image || fallbackImage}
                                    alt={card.title}
                                    style={{
                                        ...avatarStyle,
                                    }}
                                    onError={(e) => {
                                        if (
                                            e.currentTarget.src !==
                                            fallbackImage
                                        ) {
                                            e.currentTarget.src = fallbackImage
                                            e.currentTarget.style.backgroundColor =
                                                "#f0f0f0"
                                        }
                                    }}
                                />
                            )}
                            {titleDataType === "image" ? (
                                <img
                                    src={card.title || fallbackImage}
                                    alt="Title image"
                                    style={{
                                        width: "100%",
                                        height: "150px",
                                        objectFit: "cover",
                                        borderRadius: cardRadius / 2,
                                        marginBottom: 12,
                                    }}
                                    onError={(e) => {
                                        if (
                                            e.currentTarget.src !==
                                            fallbackImage
                                        ) {
                                            e.currentTarget.src = fallbackImage
                                            e.currentTarget.style.backgroundColor =
                                                "#f0f0f0"
                                        }
                                    }}
                                />
                            ) : (
                                <h3 style={titleStyle}>{card.title}</h3>
                            )}
                            {descriptionDataType === "image" ? (
                                <img
                                    src={card.description || fallbackImage}
                                    alt="Description image"
                                    style={{
                                        width: "100%",
                                        height: "150px",
                                        objectFit: "cover",
                                        borderRadius: cardRadius / 2,
                                    }}
                                    onError={(e) => {
                                        if (
                                            e.currentTarget.src !==
                                            fallbackImage
                                        ) {
                                            e.currentTarget.src = fallbackImage
                                            e.currentTarget.style.backgroundColor =
                                                "#f0f0f0"
                                        }
                                    }}
                                />
                            ) : (
                                <p style={descriptionStyle}>
                                    {card.description}
                                </p>
                            )}
                            {/* Speciality Badge */}
                            {card.speciality && (
                                <span style={specialityBadgeStyle}>
                                    {card.speciality}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* No Results Message */}
            {filteredCards.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: 40,
                        ...titleFont,
                        color: descriptionColor,
                    }}
                >
                    No results found for "{activeFilter}"
                </div>
            )}

            {/* Detail Overlay */}
            {selectedCard && (
                <div style={overlayStyle} onClick={handleCloseDetail}>
                    <div
                        style={detailCardStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={peekHeaderStyle}>
                            {(bannerImage ||
                                (showImage && selectedCard.image)) && (
                                <img
                                    src={
                                        bannerImage ||
                                        selectedCard.image ||
                                        fallbackImage
                                    }
                                    alt={selectedCard.title}
                                    style={peekCoverImageStyle}
                                    onError={(e) => {
                                        if (
                                            e.currentTarget.src !==
                                            fallbackImage
                                        ) {
                                            e.currentTarget.src = fallbackImage
                                        }
                                    }}
                                />
                            )}
                            <div style={peekHeaderOverlayStyle}>
                                <div style={peekIdentityRowStyle}>
                                    {showImage && selectedCard.image ? (
                                        <img
                                            src={
                                                selectedCard.image ||
                                                fallbackImage
                                            }
                                            alt={selectedCard.title}
                                            style={peekAvatarStyle}
                                            onError={(e) => {
                                                if (
                                                    e.currentTarget.src !==
                                                    fallbackImage
                                                ) {
                                                    e.currentTarget.src =
                                                        fallbackImage
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div style={peekInitialsStyle}>
                                            {selectedInitials || "?"}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                style={closeButtonStyle}
                                onClick={handleCloseDetail}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "rgba(255, 255, 255, 1)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "rgba(255, 255, 255, 0.9)"
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={peekContentStyle}>
                            <div style={peekIntroStyle}>
                                <h2 style={peekNameStyle}>
                                    {selectedCard.title}
                                </h2>
                                {selectedCard.speciality && (
                                    <p style={peekHeadlineStyle}>
                                        {selectedCard.speciality}
                                    </p>
                                )}
                            </div>

                            <div style={peekActionRowStyle}>
                                <button
                                    style={peekPrimaryActionStyle}
                                    onClick={() =>
                                        void handleQuickConnect(selectedCard)
                                    }
                                >
                                    {connectStatus === "sent"
                                        ? "Requested"
                                        : "Connect"}
                                </button>
                                <button
                                    style={peekSecondaryActionStyle}
                                    onClick={() => {
                                        setConnectRoleType((value) =>
                                            value || "Message"
                                        )
                                        openConnectModal(selectedCard)
                                    }}
                                >
                                    Message
                                </button>
                            </div>

                            {(aboutText || selectedCard.description) && (
                                <div style={peekSectionStyle}>
                                    <div style={peekSectionTitleStyle}>
                                        About Me
                                    </div>
                                    <div style={peekSectionCardStyle}>
                                        <p style={peekSummaryStyle}>
                                            {aboutText ||
                                                selectedCard.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(videoId || videoUrl) && (
                                <div style={peekSectionStyle}>
                                    <div style={peekSectionTitleStyle}>
                                        Demo Video
                                    </div>
                                    {videoId ? (
                                        <div
                                            style={{
                                                ...videoCardStyle,
                                                cursor: videoOpen
                                                    ? "auto"
                                                    : "pointer",
                                            }}
                                            onClick={() => {
                                                if (!videoOpen)
                                                    setVideoOpen(true)
                                            }}
                                        >
                                            {videoOpen ? (
                                                <iframe
                                                    title="Demo video"
                                                    src={`https://www.youtube.com/embed/${videoId}`}
                                                    style={videoMediaStyle}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        position: "relative",
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            videoThumb ||
                                                            fallbackImage
                                                        }
                                                        alt="Demo video thumbnail"
                                                        style={videoMediaStyle}
                                                    />
                                                    <div
                                                        style={
                                                            videoPlayStyle
                                                        }
                                                    >
                                                        <div
                                                            style={
                                                                videoPlayButtonStyle
                                                            }
                                                        >
                                                            ▶
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <a
                                            href={videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={attachmentCardStyle}
                                        >
                                            <div style={attachmentThumbStyle}>
                                                ▶
                                            </div>
                                            <div style={attachmentMetaStyle}>
                                                <div
                                                    style={
                                                        attachmentNameStyle
                                                    }
                                                >
                                                    Watch video
                                                </div>
                                                <div
                                                    style={
                                                        attachmentHintStyle
                                                    }
                                                >
                                                    Open in browser
                                                </div>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            )}

                            {galleryItems.length > 0 && (
                                <div style={peekSectionStyle}>
                                    <div style={peekSectionTitleStyle}>
                                        Attachments
                                    </div>
                                    <div style={attachmentCarouselStyle}>
                                        {galleryItems.map((file, index) => (
                                            <button
                                                key={`${file.url}-${index}`}
                                                type="button"
                                                style={attachmentSlideStyle}
                                                onClick={() =>
                                                    setActiveMediaIndex(index)
                                                }
                                            >
                                                {file.mediaKind === "image" ? (
                                                    <img
                                                        src={
                                                            file.thumbnail ||
                                                            file.url
                                                        }
                                                        alt={file.name}
                                                        style={
                                                            attachmentPreviewStyle
                                                        }
                                                    />
                                                ) : file.mediaKind ===
                                                  "video" ? (
                                                    <video
                                                        src={file.url}
                                                        style={
                                                            attachmentPreviewStyle
                                                        }
                                                        muted
                                                        playsInline
                                                    />
                                                ) : file.mediaKind === "pdf" ? (
                                                    <iframe
                                                        title={file.name}
                                                        src={file.url}
                                                        style={
                                                            attachmentPdfFrameStyle
                                                        }
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            ...attachmentPreviewStyle,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent:
                                                                "center",
                                                            fontWeight: 700,
                                                            color: "#475569",
                                                        }}
                                                    >
                                                        FILE
                                                    </div>
                                                )}
                                                <div
                                                    style={
                                                        attachmentCaptionStyle
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            attachmentProjectStyle
                                                        }
                                                    >
                                                        {file.projectName ||
                                                            file.name}
                                                    </div>
                                                    <div
                                                        style={
                                                            attachmentTypeStyle
                                                        }
                                                    >
                                                        {file.mediaKind}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedCard.rawFields && (
                                <div style={peekSectionStyle}>
                                    <div style={peekSectionTitleStyle}>
                                        Details
                                    </div>
                                    {Object.entries(selectedCard.rawFields)
                                        .filter(([key, value]) =>
                                            !shouldHideDetailField(key, value)
                                        )
                                        .map(([key, value]) => (
                                            <div
                                                key={key}
                                                style={peekDetailItemStyle}
                                            >
                                                <div
                                                    style={peekDetailLabelStyle}
                                                >
                                                    {key}
                                                </div>
                                                <p
                                                    style={peekDetailValueStyle}
                                                >
                                                    {toDetailText(value)}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeMedia && (
                <div
                    style={mediaOverlayStyle}
                    onClick={() => setActiveMediaIndex(null)}
                >
                    <div
                        style={mediaModalStyle}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={mediaContentStyle}>
                            {activeMedia.mediaKind === "image" ? (
                                <img
                                    src={activeMedia.url}
                                    alt={activeMedia.name}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "70vh",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : activeMedia.mediaKind === "video" ? (
                                <video
                                    src={activeMedia.url}
                                    controls
                                    autoPlay
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "70vh",
                                        backgroundColor: "#000",
                                    }}
                                />
                            ) : activeMedia.mediaKind === "pdf" ? (
                                <iframe
                                    title={activeMedia.name}
                                    src={activeMedia.url}
                                    style={{
                                        width: "100%",
                                        height: "70vh",
                                        border: "none",
                                        backgroundColor: "#FFF",
                                    }}
                                />
                            ) : (
                                <a
                                    href={activeMedia.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: "#FFFFFF",
                                        textDecoration: "underline",
                                        fontSize: "16px",
                                    }}
                                >
                                    Open file
                                </a>
                            )}
                        </div>
                        <div style={mediaActionRowStyle}>
                            <button
                                type="button"
                                style={mediaNavButtonStyle}
                                onClick={() =>
                                    setActiveMediaIndex((index) =>
                                        index === null
                                            ? null
                                            : (index - 1 + galleryItems.length) %
                                              galleryItems.length
                                    )
                                }
                                disabled={galleryItems.length <= 1}
                            >
                                Previous
                            </button>
                            <div style={attachmentHintStyle}>
                                {activeMedia.projectName || activeMedia.name}
                            </div>
                            <button
                                type="button"
                                style={mediaNavButtonStyle}
                                onClick={() =>
                                    setActiveMediaIndex((index) =>
                                        index === null
                                            ? null
                                            : (index + 1) % galleryItems.length
                                    )
                                }
                                disabled={galleryItems.length <= 1}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {connectOpen && selectedCard && (
                <div style={connectOverlayStyle} onClick={handleConnectDismiss}>
                    <div
                        style={connectCardStyle}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={connectHeaderStyle}>
                            <div style={promoTagStyle}>Connect Request</div>
                            <h3 style={{ margin: 0, ...titleFont, color: titleColor }}>
                                Connect with {selectedCard.title}
                            </h3>
                            <p style={{ margin: 0, ...descriptionFont, color: descriptionColor }}>
                                Fill the details to send a request.
                            </p>
                        </div>
                        <form style={connectFormStyle} onSubmit={handleConnectSubmit}>
                            <input
                                type="text"
                                placeholder="Company name"
                                style={connectInputStyle}
                                value={connectCompanyName}
                                onChange={(event) =>
                                    setConnectCompanyName(event.currentTarget.value)
                                }
                            />
                            <input
                                type="text"
                                placeholder="Contact name"
                                style={connectInputStyle}
                                value={connectContactName}
                                onChange={(event) =>
                                    setConnectContactName(event.currentTarget.value)
                                }
                            />
                            <input
                                type="email"
                                placeholder="Work email"
                                style={connectInputStyle}
                                value={connectEmail}
                                onChange={(event) =>
                                    setConnectEmail(event.currentTarget.value)
                                }
                            />
                            <input
                                type="text"
                                placeholder="Phone"
                                style={connectInputStyle}
                                value={connectPhone}
                                onChange={(event) =>
                                    setConnectPhone(event.currentTarget.value)
                                }
                            />
                            <input
                                type="text"
                                placeholder="Company website"
                                style={connectInputStyle}
                                value={connectWebsite}
                                onChange={(event) =>
                                    setConnectWebsite(event.currentTarget.value)
                                }
                            />
                            <input
                                type="text"
                                placeholder="Role type"
                                style={connectInputStyle}
                                value={connectRoleType}
                                onChange={(event) =>
                                    setConnectRoleType(event.currentTarget.value)
                                }
                            />
                            <textarea
                                placeholder="Message"
                                style={{
                                    ...connectTextAreaStyle,
                                    gridColumn: "1 / -1",
                                }}
                                value={connectMessage}
                                onChange={(event) =>
                                    setConnectMessage(event.currentTarget.value)
                                }
                            />
                            <div
                                style={{
                                    gridColumn: "1 / -1",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <div style={attachmentHintStyle}>
                                    {connectStatus === "error"
                                          ? "Unable to submit request."
                                          : "Request will be sent to CODED."}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        type="button"
                                        style={promoSecondaryButtonStyle}
                                        onClick={handleConnectDismiss}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        style={promoPrimaryButtonStyle}
                                        disabled={
                                            connectStatus === "sending" ||
                                            !connectEmailIsValid
                                        }
                                    >
                                        {connectStatus === "sending"
                                            ? "Sending..."
                                            : "Send"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {promoOpen && (
                <div style={promoOverlayStyle} onClick={handlePromoDismiss}>
                    <div
                        style={promoCardStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {inviteOpen ? (
                            <>
                                <div style={promoHeroStyle}>
                                    <div style={promoTagStyle}>
                                        Request Invitation
                                    </div>
                                    <h2 style={promoTitleStyle}>
                                        Join the CODED Alumni Network
                                    </h2>
                                    <p style={promoSubtitleStyle}>
                                        Share your email and we will send you
                                        access details to the private platform
                                        for alumni and hiring partners.
                                    </p>
                                    <button
                                        style={promoCloseStyle}
                                        onClick={handlePromoDismiss}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div style={promoBodyStyle}>
                                    <form
                                        style={promoFormStyle}
                                        onSubmit={handleInviteSubmit}
                                    >
                                        <input
                                            type="email"
                                            placeholder="you@email.com"
                                            style={promoInputStyle}
                                            value={inviteEmail}
                                            onChange={(event) =>
                                                setInviteEmail(
                                                    event.currentTarget.value
                                                )
                                            }
                                        />
                                        {inviteStatus === "sent" ? (
                                            <p style={promoInputHintStyle}>
                                                Thanks! Your request has been
                                                submitted.
                                            </p>
                                        ) : inviteStatus === "error" ? (
                                            <p style={promoInputHintStyle}>
                                                Unable to submit right now.
                                                Please try again.
                                            </p>
                                        ) : (
                                            <p style={promoInputHintStyle}>
                                                We will only use your email to
                                                send the invitation.
                                            </p>
                                        )}
                                        <div style={promoActionsStyle}>
                                            <button
                                                type="submit"
                                                style={promoPrimaryButtonStyle}
                                                disabled={
                                                    !emailIsValid ||
                                                    inviteStatus === "sending"
                                                }
                                            >
                                                {inviteStatus === "sending"
                                                    ? "Sending..."
                                                    : inviteStatus === "sent"
                                                      ? "Sent"
                                                      : "Send request"}
                                            </button>
                                            <button
                                                type="button"
                                                style={promoSecondaryButtonStyle}
                                                onClick={() =>
                                                    setInviteOpen(false)
                                                }
                                            >
                                                Back
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={promoHeroStyle}>
                                    <div style={promoTagStyle}>
                                        CODED Alumni Network
                                    </div>
                                    <h2 style={promoTitleStyle}>
                                        A private platform connecting CODED
                                        alumni with hiring partners.
                                    </h2>
                                    <p style={promoSubtitleStyle}>
                                        Showcase your availability and skills
                                        while companies discover the best-fit
                                        talent faster.
                                    </p>
                                    <button
                                        style={promoCloseStyle}
                                        onClick={handlePromoDismiss}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div style={promoBodyStyle}>
                                    <div style={promoFeatureGridStyle}>
                                        <div style={promoFeatureCardStyle}>
                                            <div
                                                style={promoFeatureTitleStyle}
                                            >
                                                Alumni profiles
                                            </div>
                                            <p style={promoFeatureCopyStyle}>
                                                Highlight full-time, part-time,
                                                or freelance availability and
                                                showcase projects.
                                            </p>
                                        </div>
                                        <div style={promoFeatureCardStyle}>
                                            <div
                                                style={promoFeatureTitleStyle}
                                            >
                                                Company matchmaking
                                            </div>
                                            <p style={promoFeatureCopyStyle}>
                                                Hiring teams browse verified
                                                alumni to find their best fit.
                                            </p>
                                        </div>
                                        <div style={promoFeatureCardStyle}>
                                            <div
                                                style={promoFeatureTitleStyle}
                                            >
                                                Trusted network
                                            </div>
                                            <p style={promoFeatureCopyStyle}>
                                                Curated access for CODED alumni
                                                and vetted hiring partners.
                                            </p>
                                        </div>
                                        <div style={promoFeatureCardStyle}>
                                            <div
                                                style={promoFeatureTitleStyle}
                                            >
                                                Fast connections
                                            </div>
                                            <p style={promoFeatureCopyStyle}>
                                                Reach the right people without
                                                the noise of public platforms.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={promoActionsStyle}>
                                        <button
                                            style={promoPrimaryButtonStyle}
                                            onClick={() =>
                                                setInviteOpen(true)
                                            }
                                        >
                                            Request an invitation
                                        </button>
                                        <button
                                            style={promoSecondaryButtonStyle}
                                            onClick={handlePromoDismiss}
                                        >
                                            Maybe later
                                        </button>
                                    </div>
                                    <div style={promoDismissStyle}>
                                        Invitations are reviewed by CODED.
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(APICardList, {
    workerApiUrl: {
        type: ControlType.String,
        title: "Worker API URL",
        defaultValue: "",
        placeholder: "https://<your-worker-domain>/graduates",
    },
    connectApiBaseUrl: {
        type: ControlType.String,
        title: "Connect API Base",
        defaultValue: "https://coded-landingpage.tools-c81.workers.dev",
        placeholder: "https://<your-worker-domain>",
    },
    airtableBaseId: {
        type: ControlType.String,
        title: "Legacy API URL",
        defaultValue: "",
        placeholder: "Deprecated (legacy fallback)",
        hidden: () => true,
    },
    showRawData: {
        type: ControlType.Boolean,
        title: "Show Raw Data",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showFilters: {
        type: ControlType.Boolean,
        title: "Show Filters",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    maxItems: {
        type: ControlType.Number,
        title: "Max Items",
        defaultValue: 10,
        min: 1,
        max: 100,
        step: 1,
        displayStepper: true,
        hidden: ({ showRawData }) => showRawData,
    },
    titleKey: {
        type: ControlType.String,
        title: "Title Key",
        defaultValue: "title",
        placeholder: "e.g., title, name, fields.title",
        hidden: ({ showRawData }) => showRawData,
    },
    titleDataType: {
        type: ControlType.Enum,
        title: "Title Type",
        options: ["string", "number", "boolean", "json", "image"],
        optionTitles: ["String", "Number", "Boolean", "JSON", "Image"],
        defaultValue: "string",
        hidden: ({ showRawData }) => showRawData,
    },
    descriptionKey: {
        type: ControlType.String,
        title: "Description Key",
        defaultValue: "body",
        placeholder: "e.g., body, description, fields.desc",
        hidden: ({ showRawData }) => showRawData,
    },
    descriptionDataType: {
        type: ControlType.Enum,
        title: "Description Type",
        options: ["string", "number", "boolean", "json", "image"],
        optionTitles: ["String", "Number", "Boolean", "JSON", "Image"],
        defaultValue: "string",
        hidden: ({ showRawData }) => showRawData,
    },
    aboutMeKey: {
        type: ControlType.String,
        title: "About Key",
        defaultValue: "about",
        placeholder: "e.g., about, bio, fields.about",
        hidden: ({ showRawData }) => showRawData,
    },
    demoVideoKey: {
        type: ControlType.String,
        title: "Video Key",
        defaultValue: "demoVideo",
        placeholder: "e.g., youtube, videoUrl",
        hidden: ({ showRawData }) => showRawData,
    },
    attachmentsKey: {
        type: ControlType.String,
        title: "Attachments",
        defaultValue: "attachments",
        placeholder: "e.g., attachments, files",
        hidden: ({ showRawData }) => showRawData,
    },
    alumniPromoEnabled: {
        type: ControlType.Boolean,
        title: "Promo Modal",
        defaultValue: true,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    alumniPromoClicks: {
        type: ControlType.Number,
        title: "Promo Clicks",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
        hidden: ({ alumniPromoEnabled }) => !alumniPromoEnabled,
    },
    alumniInviteWebhook: {
        type: ControlType.String,
        title: "Invite Webhook",
        defaultValue: "",
        placeholder: "https://...",
        hidden: ({ alumniPromoEnabled }) => !alumniPromoEnabled,
    },
    specialityKey: {
        type: ControlType.String,
        title: "Speciality Key",
        defaultValue: "Speciality",
        placeholder: "e.g., Speciality, category",
        hidden: ({ showRawData }) => showRawData,
    },
    showImage: {
        type: ControlType.Boolean,
        title: "Show Image",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showRawData }) => showRawData,
    },
    imageKey: {
        type: ControlType.String,
        title: "Image Key",
        defaultValue: "image",
        placeholder: "e.g., Attachments.0.url",
        hidden: ({ showRawData, showImage }) => showRawData || !showImage,
    },
    imageDataType: {
        type: ControlType.Enum,
        title: "Image Type",
        options: ["string", "number", "boolean", "json", "image"],
        optionTitles: ["String", "Number", "Boolean", "JSON", "Image"],
        defaultValue: "image",
        hidden: ({ showRawData, showImage }) => showRawData || !showImage,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
        hidden: ({ showRawData }) => showRawData,
    },
    minCardWidth: {
        type: ControlType.Number,
        title: "Min Card Width",
        defaultValue: 220,
        min: 140,
        max: 400,
        step: 10,
        unit: "px",
        hidden: ({ showRawData }) => showRawData,
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Breakpoint",
        defaultValue: 900,
        min: 480,
        max: 1200,
        step: 20,
        unit: "px",
        hidden: ({ showRawData }) => showRawData,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 640,
        min: 320,
        max: 900,
        step: 20,
        unit: "px",
        hidden: ({ showRawData }) => showRawData,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
        hidden: ({ showRawData }) => showRawData,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
        hidden: ({ showRawData }) => showRawData,
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "#666666",
        hidden: ({ showRawData }) => showRawData,
    },
    filterBackgroundColor: {
        type: ControlType.Color,
        title: "Filter Background",
        defaultValue: "#E7E7E8",
        hidden: ({ showRawData, showFilters }) => showRawData || !showFilters,
    },
    filterActiveColor: {
        type: ControlType.Color,
        title: "Filter Active Color",
        defaultValue: "#000000",
        hidden: ({ showRawData, showFilters }) => showRawData || !showFilters,
    },
    filterTextColor: {
        type: ControlType.Color,
        title: "Filter Text Color",
        defaultValue: "#666666",
        hidden: ({ showRawData, showFilters }) => showRawData || !showFilters,
    },
    filterActiveTextColor: {
        type: ControlType.Color,
        title: "Filter Active Text",
        defaultValue: "#FFFFFF",
        hidden: ({ showRawData, showFilters }) => showRawData || !showFilters,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        hidden: ({ showRawData }) => showRawData,
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
        hidden: ({ showRawData }) => showRawData,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
        hidden: ({ showRawData }) => showRawData,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        defaultValue: 20,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
        hidden: ({ showRawData }) => showRawData,
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showRawData }) => showRawData,
    },
    placeholderImage: {
        type: ControlType.Image,
        title: "Placeholder Image",
    },
    bannerImage: {
        type: ControlType.Image,
        title: "Banner Image",
    },
    cardVariant: {
        type: ControlType.Enum,
        title: "Card Variant",
        options: ["default", "profile"],
        optionTitles: ["Default", "Profile"],
        defaultValue: "default",
        hidden: ({ showRawData }) => showRawData,
    },
    profileImageRadius: {
        type: ControlType.Number,
        title: "Profile Image Radius",
        defaultValue: 28,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        hidden: ({ showRawData, cardVariant }) =>
            showRawData || cardVariant !== "profile",
    },
    onCardClick: {
        type: ControlType.EventHandler,
    },
})
