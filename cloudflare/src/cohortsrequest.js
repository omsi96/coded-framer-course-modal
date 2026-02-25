const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

const AIRTABLE = {
  BASE_ID: "appauC0auHC017I1X",
  COHORTS_TABLE_NAME: "🔐 Cohorts",

  FIELD_IDS: {
    productAbbr: "", // optional
    isoStartEnd: "", // optional
    applyLink: "",   // optional
  },

  FIELD_NAMES: {
    productAbbr: "Product Abbr",
    isoStartEnd: "ISO Start|End Dates",
    applyLink: "Apply Link",
  },
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders })
    if (req.method !== "GET") return new Response("Not found", { status: 404, headers: corsHeaders })

    const url = new URL(req.url)
    const parts = url.pathname.split("/").filter(Boolean)

    if (parts.length !== 2 || parts[0] !== "cohorts") {
      return new Response("Not found", { status: 404, headers: corsHeaders })
    }

    const productName = decodeURIComponent(parts[1] || "").trim()
    if (!productName) return json({ error: "Missing productname in URL" }, 400)

    const FIELD = await resolveCohortsFieldNames(env)

    const safeValue = productName.replace(/"/g, '\\"')
    const filterByFormula = `{${FIELD.productAbbr}}="${safeValue}"`

    const qs = new URLSearchParams({
      filterByFormula,
      pageSize: "100",
      "sort[0][field]": FIELD.isoStartEnd,
      "sort[0][direction]": "asc",
    })

    const listUrl = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${encodeURIComponent(
      AIRTABLE.COHORTS_TABLE_NAME
    )}?${qs.toString()}`

    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    })

    const text = await res.text()
    if (!res.ok) {
      return new Response(text, {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      return json({ error: "Invalid JSON returned from Airtable" }, 502)
    }

    const records = data?.records || []
    if (!records.length) {
      return json({ error: "No cohorts found for product", details: { productName } }, 404)
    }

    // Normalize
    const batches = records
      .map((r) => {
        const f = r.fields || {}
        const iso = String(f[FIELD.isoStartEnd] || "").trim()
        const applyLink = String(f[FIELD.applyLink] || "").trim()

        const { startDate, endDate } = parseIsoRange(iso)
        return {
          recordId: r.id,
          startDate,
          endDate,
          applyLink: applyLink || null,
        }
      })
      .filter((b) => b.startDate && b.endDate)

    if (!batches.length) {
      return json(
        {
          error: "Cohorts found but ISO Start|End Dates are missing/invalid",
          details: { productName, expectedFormat: "YYYY-MM-DD|YYYY-MM-DD", field: FIELD.isoStartEnd },
        },
        502
      )
    }

    // Sort by earliest
    batches.sort((a, b) => a.startDate.localeCompare(b.startDate))

    const today = todayISODate()

    // All upcoming batches (including today)
    const nextBatches = batches.filter((b) => b.startDate >= today)

    // Closest upcoming, else fallback to earliest overall
    const nextBatch = nextBatches[0] || batches[0]

    return json({
      product: productName,
      today,
      nextBatch,     // closest
      nextBatches,   // ALL upcoming
      allBatches: batches, // optional: keep/remove as you prefer
    })
  },
}

async function resolveCohortsFieldNames(env) {
  const fallback = { ...AIRTABLE.FIELD_NAMES }

  const ids = AIRTABLE.FIELD_IDS
  const hasAllIds =
    ids.productAbbr?.startsWith("fld") &&
    ids.isoStartEnd?.startsWith("fld") &&
    ids.applyLink?.startsWith("fld")

  if (!hasAllIds) return fallback

  try {
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE.BASE_ID}/tables`
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    })
    if (!metaRes.ok) return fallback

    const meta = await metaRes.json()
    const table = (meta?.tables || []).find((t) => t.name === AIRTABLE.COHORTS_TABLE_NAME)
    if (!table) return fallback

    const fieldIdToName = {}
    for (const f of table.fields || []) fieldIdToName[f.id] = f.name

    return {
      productAbbr: fieldIdToName[ids.productAbbr] || fallback.productAbbr,
      isoStartEnd: fieldIdToName[ids.isoStartEnd] || fallback.isoStartEnd,
      applyLink: fieldIdToName[ids.applyLink] || fallback.applyLink,
    }
  } catch {
    return fallback
  }
}

function parseIsoRange(value) {
  if (!value || typeof value !== "string") return { startDate: null, endDate: null }
  const parts = value.split("|").map((x) => x.trim())
  if (parts.length !== 2) return { startDate: null, endDate: null }

  const [startDate, endDate] = parts
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return { startDate: null, endDate: null }

  return { startDate, endDate }
}

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

// Returns YYYY-MM-DD based on UTC date (string compare works)
function todayISODate() {
  const d = new Date()
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}
