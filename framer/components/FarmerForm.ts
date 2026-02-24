import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type Props = {
    apiUrl: string
    style?: React.CSSProperties
}

export default function FarmerForm(props: Props) {
    const { apiUrl, style } = props

    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [status, setStatus] = React.useState<
        "idle" | "submitting" | "success" | "error"
    >("idle")
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmedApiUrl = apiUrl.trim()
        if (!trimmedApiUrl) {
            setStatus("error")
            setErrorMessage("Set an API URL in the component properties.")
            return
        }

        setStatus("submitting")
        setErrorMessage(null)

        try {
            const response = await fetch(trimmedApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            })

            if (!response.ok) {
                const text = await response.text().catch(() => "")
                throw new Error(
                    text || `Request failed with status ${response.status}`
                )
            }

            setStatus("success")
        } catch (error) {
            setStatus("error")
            setErrorMessage(
                error instanceof Error ? error.message : "Request failed"
            )
        }
    }

    const disabled = status === "submitting" || status === "success"

    return (
        <div
            style={{
                ...style,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                width: "100%",
                height: "100%",
            }}
        >
            <form
                onSubmit={submit}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: 16,
                    boxSizing: "border-box",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "rgba(255,255,255,0.9)",
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
                }}
            >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Name</span>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Omar"
                        disabled={disabled}
                        required
                        style={{
                            height: 40,
                            padding: "0 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.18)",
                            outline: "none",
                            fontSize: 14,
                        }}
                    />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>Email</span>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="omar@joincoded.com"
                        disabled={disabled}
                        required
                        type="email"
                        style={{
                            height: 40,
                            padding: "0 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.18)",
                            outline: "none",
                            fontSize: 14,
                        }}
                    />
                </label>

                <button
                    type="submit"
                    disabled={disabled}
                    style={{
                        height: 40,
                        borderRadius: 10,
                        border: "none",
                        background:
                            status === "success" ? "#16a34a" : "rgba(0,0,0,0.88)",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: status === "submitting" ? "wait" : "pointer",
                    }}
                >
                    {status === "submitting"
                        ? "Submitting…"
                        : status === "success"
                          ? "Submitted"
                          : "Submit"}
                </button>

                {status === "error" && (
                    <div style={{ fontSize: 12, color: "#b91c1c" }}>
                        {errorMessage || "Something went wrong."}
                    </div>
                )}

                {status === "success" && (
                    <div style={{ fontSize: 12, color: "#166534" }}>
                        Thanks! We received your info.
                    </div>
                )}
            </form>
        </div>
    )
}

FarmerForm.defaultProps = {
    apiUrl: "",
}

addPropertyControls(FarmerForm, {
    apiUrl: {
        type: ControlType.String,
        title: "API URL",
        placeholder: "https://example.com/api",
    },
})
