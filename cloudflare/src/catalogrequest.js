const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    REQUEST_TABLE_NAME: "FlyerRequest",
  
    FIELD_IDS: {
      name: "fldg2bNTy4IxLVnoL",
      email: "fldZYPtRILWVBtyRo",
      company: "fldUetAukTBgH0kD6",
      catalogPdf: "fldHludL9mHcHHvGp",
    },
  
    FIELD_NAMES: {
      name: "Name",
      email: "Email",
      company: "Company",
      catalogPdf: "CatalogPDF",
    },
  }
  
  // Linked table config (only used when URL param is NOT a rec... id)
  const PDF_TABLE = {
    NAME: "PDF",
    PRIMARY_FIELD_NAME: "Name",
  }
  
  export default {
    async fetch(req, env) {
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders })
      }
      if (req.method !== "POST") {
        return new Response("Not found", { status: 404, headers: corsHeaders })
      }
  
      const url = new URL(req.url)
      const parts = url.pathname.split("/").filter(Boolean)
  
      if (parts.length !== 2 || parts[0] !== "catalogrequest") {
        return new Response("Not found", { status: 404, headers: corsHeaders })
      }
  
      const pdfParam = decodeURIComponent(parts[1] || "").trim()
      if (!pdfParam) return json({ error: "Missing PDF_NAME in URL" }, 400)
  
      let payload
      try {
        payload = await req.json()
      } catch {
        return json({ error: "Invalid JSON body" }, 400)
      }
  
      const name = (payload?.name || "").trim()
      const email = (payload?.email || "").trim()
      const company = (payload?.company || "").trim()
      if (!name || !email) return json({ error: "Missing name/email" }, 400)
  
      // Resolve FlyerRequest field names (ID-first, fallback-to-name)
      const FIELD = await resolveRequestFieldNames(env)
  
      // ✅ IMPORTANT: Accept either record ID or human-readable name
      const pdfRecordId = isAirtableRecordId(pdfParam)
        ? pdfParam
        : await findPdfRecordIdByName(env, pdfParam)
  
      if (!pdfRecordId) {
        return json(
          {
            error: "PDF not found in linked table",
            details: {
              pdfParam,
              pdfTable: PDF_TABLE.NAME,
              matchField: PDF_TABLE.PRIMARY_FIELD_NAME,
              hint: "Pass a record ID (rec...) to skip lookup, or pass the exact PDF Name to lookup by Name field.",
            },
          },
          400
        )
      }
  
      const createUrl = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${encodeURIComponent(
        AIRTABLE.REQUEST_TABLE_NAME
      )}`
  
      const body = {
        records: [
          {
            fields: {
              [FIELD.name]: name,
              [FIELD.email]: email,
              [FIELD.company]: company,
  
              // Linked record expects an array of rec IDs
              [FIELD.catalogPdf]: [pdfRecordId],
            },
          },
        ],
      }
  
      const res = await fetch(createUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
  
      const text = await res.text()
      if (!res.ok) {
        return new Response(text, {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
  
      return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    },
  }
  
  function isAirtableRecordId(value) {
    // Airtable record IDs look like: recXXXXXXXXXXXXXX (usually 17 chars after "rec")
    return /^rec[a-zA-Z0-9]{14,}$/.test(value)
  }
  
  async function resolveRequestFieldNames(env) {
    const fallback = { ...AIRTABLE.FIELD_NAMES }
  
    try {
      const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE.BASE_ID}/tables`
      const metaRes = await fetch(metaUrl, {
        headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
      })
      if (!metaRes.ok) return fallback
  
      const meta = await metaRes.json()
      const table = (meta?.tables || []).find((t) => t.name === AIRTABLE.REQUEST_TABLE_NAME)
      if (!table) return fallback
  
      const fieldIdToName = {}
      for (const f of table.fields || []) fieldIdToName[f.id] = f.name
  
      return {
        name: fieldIdToName[AIRTABLE.FIELD_IDS.name] || fallback.name,
        email: fieldIdToName[AIRTABLE.FIELD_IDS.email] || fallback.email,
        company: fieldIdToName[AIRTABLE.FIELD_IDS.company] || fallback.company,
        catalogPdf: fieldIdToName[AIRTABLE.FIELD_IDS.catalogPdf] || fallback.catalogPdf,
      }
    } catch {
      return fallback
    }
  }
  
  async function findPdfRecordIdByName(env, pdfName) {
    const safeValue = pdfName.replace(/"/g, '\\"')
    const formula = `{${PDF_TABLE.PRIMARY_FIELD_NAME}}="${safeValue}"`
  
    const query = new URLSearchParams({
      maxRecords: "1",
      filterByFormula: formula,
    })
  
    const url = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${encodeURIComponent(
      PDF_TABLE.NAME
    )}?${query.toString()}`
  
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    })
    if (!res.ok) return null
  
    const data = await res.json()
    return data?.records?.[0]?.id || null
  }
  