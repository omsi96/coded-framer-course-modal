/**
 * ============================================================
 * WORKSHOP RECOMMEND WORKER
 * ============================================================
 * POST /workshop-recommend
 *
 * Accepts training requirements, fetches the CODED Course Catalog
 * from Airtable, then uses Claude AI to recommend the best courses.
 *
 * Request body:
 *   {
 *     duration:           "1 Day" | "< 3 Days" | "< 3 Weeks" | "> 5 Weeks"
 *     teamSize:           "< 8" | "12-15" | "> 25"
 *     multipleIterations: boolean (only when teamSize > 25)
 *     location:           "Our Campus" | "Your Office"
 *     audience:           string[]  e.g. ["Technical Teams", "Executives"]
 *     companyName:        string (optional)
 *     freeText:           string (optional – user's own description)
 *   }
 *
 * Env secrets:
 *   AIRTABLE_TOKEN   – existing
 *   ANTHROPIC_API_KEY – new (set via wrangler secret put ANTHROPIC_API_KEY)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const AIRTABLE = {
  BASE_ID: "appauC0auHC017I1X",
  CATALOG_TABLE_NAME: "CODED Course Catalog",

  FIELD_IDS: {
    courseTitle: "fldoP590TirEz6Cu4",
    duration: "fld24qip9Ztq80BTa",
    courseType: "fldTfCVLrBtSQHqHJ",
    targetAudience: "fldafd4Ru78So4h1t",
    description: "fldruDxe0yXm3HGBj",
    tag: "fldlnpJ9zOjnzML4L",
    page: "fldEwEhKXXmHpwHMP",
    outline: "fldN5VUivnQa01WOk",
    methodology: "fldu7q13YUpZykZ78",
  },

  FIELD_NAMES: {
    courseTitle: "Course Title",
    duration: "Duration",
    courseType: "Course Type",
    targetAudience: "Target Audience",
    description: "Description",
    tag: "Tag",
    page: "Page",
    outline: "Outline",
    methodology: "Methodology",
  },
};

// Duration mapping: user selection → compatible Airtable duration values
const DURATION_MAP = {
  "1 Day": ["4-6 Training Hours", "6-8 Training Hours", "6-12 Training Hours"],
  "< 3 Days": [
    "4-6 Training Hours",
    "6-8 Training Hours",
    "6-12 Training Hours",
    "18-30 Training Hours",
  ],
  "< 3 Weeks": [
    "18-30 Training Hours",
    "30-50 Training Hours",
    "30-60 Training Hours",
    "48-60 Training Hours",
    "70-90 Training Hours",
    "80-100 Training Hours",
  ],
  "> 5 Weeks": [
    "80-100 Training Hours",
    "100-130 Training Hours",
    "100 - 220 Training Hours",
    "100 - 300 Training Hours",
    "120 - 200 Training Hours",
    "150-250 Training Hours",
    "200 - 300 Training Hours",
  ],
};

// Audience mapping: user-friendly label → Airtable values
const AUDIENCE_MAP = {
  "Fresh Graduates": ["Participants", "Everyone", "Employees"],
  "Technical Teams": [
    "IT background",
    "IT Professionals",
    "Participants",
    "Everyone",
  ],
  Executives: ["Executives", "Seniors", "Leaders", "Non Technical"],
  Mix: ["Everyone", "Participants", "Employees"],
};

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    let payload;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const {
      duration = "",
      teamSize = "",
      multipleIterations = false,
      location = "",
      audience = [],
      companyName = "",
      freeText = "",
    } = payload;

    if (!duration || !teamSize || !audience.length) {
      return json(
        { error: "Missing required fields: duration, teamSize, audience" },
        400,
      );
    }

    // ── 1. Fetch course catalog from Airtable ─────────────────
    const FIELD = await resolveFieldNames(env);
    const courses = await fetchAllCourses(env, FIELD);

    if (!courses.length) {
      return json({ error: "No courses found in catalog" }, 502);
    }

    // ── 2. Build Claude prompt ────────────────────────────────
    const catalogText = courses
      .map((c, i) => {
        const parts = [
          `${i + 1}. "${c.courseTitle}"`,
          c.courseType ? `   Type: ${c.courseType}` : null,
          c.duration ? `   Duration: ${c.duration}` : null,
          c.tag ? `   Tag: ${c.tag}` : null,
          c.page ? `   Category: ${c.page}` : null,
          c.targetAudience ? `   Audience: ${c.targetAudience}` : null,
          c.methodology ? `   Methodology: ${c.methodology}` : null,
          c.description ? `   Description: ${c.description}` : null,
        ];
        return parts.filter(Boolean).join("\n");
      })
      .join("\n\n");

    const userRequirements = [
      `Duration preference: ${duration}`,
      `Team size: ${teamSize}${multipleIterations ? " (multiple iterations needed)" : ""}`,
      `Location: ${location}`,
      `Target audience: ${audience.join(", ")}`,
      companyName ? `Company: ${companyName}` : null,
      freeText ? `Additional context: ${freeText}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are CODED's training advisor. CODED is a technology education company that offers workshops, courses, and bootcamps for companies.

Your job is to recommend the top 2-3 courses from the catalog that best match the client's training requirements.

Rules:
- Only recommend courses that exist in the catalog provided
- Match duration to the client's time budget
- Match audience type to who will attend
- For small teams (< 8), prefer workshops. For larger teams, mid courses or bootcamps may be better.
- If multiple iterations are needed (>25 people), note that in your recommendation
- Consider the location preference when describing logistics
- Be concise, warm, and professional
- If the company name is provided, address them naturally

Respond with ONLY valid JSON in this exact format:
{
  "greeting": "A short personalized greeting (1 sentence)",
  "recommendations": [
    {
      "courseTitle": "Exact title from catalog",
      "courseType": "Workshop | Mid Course | Bootcamp",
      "duration": "Duration from catalog",
      "tag": "Topic tag",
      "whyThisFits": "1-2 sentences explaining why this is a great match for their needs",
      "description": "The course description from catalog"
    }
  ],
  "note": "Optional 1-sentence note about logistics, iterations, or next steps"
}`;

    const userMessage = `Here is our full course catalog:\n\n${catalogText}\n\n---\n\nClient requirements:\n${userRequirements}\n\nPlease recommend the best 2-3 courses.`;

    // ── 3. Call Claude API ─────────────────────────────────────
    let aiResponse;
    try {
      aiResponse = await callClaude(env, systemPrompt, userMessage);
    } catch (err) {
      return json(
        { error: "AI recommendation failed", details: err.message },
        502,
      );
    }

    // ── 4. Parse and return ───────────────────────────────────
    let parsed;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = aiResponse;
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return raw text
      return json({
        greeting: "Here are my recommendations:",
        recommendations: [],
        rawResponse: aiResponse,
        note: "Could not parse structured recommendations. Please try again.",
      });
    }

    return json({
      ...parsed,
      meta: {
        catalogSize: courses.length,
        inputDuration: duration,
        inputTeamSize: teamSize,
        inputAudience: audience,
      },
    });
  },
};

// ── Airtable helpers ──────────────────────────────────────────

async function resolveFieldNames(env) {
  const fallback = { ...AIRTABLE.FIELD_NAMES };

  const ids = AIRTABLE.FIELD_IDS;
  const hasIds = Object.values(ids).every((id) => id.startsWith("fld"));
  if (!hasIds) return fallback;

  try {
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE.BASE_ID}/tables`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });
    if (!metaRes.ok) return fallback;

    const meta = await metaRes.json();
    const table = (meta?.tables || []).find(
      (t) => t.name === AIRTABLE.CATALOG_TABLE_NAME,
    );
    if (!table) return fallback;

    const fieldIdToName = {};
    for (const f of table.fields || []) fieldIdToName[f.id] = f.name;

    const resolved = {};
    for (const [key, id] of Object.entries(ids)) {
      resolved[key] = fieldIdToName[id] || fallback[key];
    }
    return resolved;
  } catch {
    return fallback;
  }
}

async function fetchAllCourses(env, FIELD) {
  const courses = [];
  let offset = null;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const url = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${encodeURIComponent(
      AIRTABLE.CATALOG_TABLE_NAME,
    )}?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    offset = data.offset || null;

    for (const r of data.records || []) {
      const f = r.fields || {};
      courses.push({
        recordId: r.id,
        courseTitle: f[FIELD.courseTitle] || "",
        duration: f[FIELD.duration] || "",
        courseType: f[FIELD.courseType] || "",
        targetAudience: Array.isArray(f[FIELD.targetAudience])
          ? f[FIELD.targetAudience].join(", ")
          : f[FIELD.targetAudience] || "",
        description: f[FIELD.description] || "",
        tag: f[FIELD.tag] || "",
        page: f[FIELD.page] || "",
        outline: f[FIELD.outline] || "",
        methodology: f[FIELD.methodology] || "",
      });
    }
  } while (offset);

  return courses;
}

// ── Claude API ────────────────────────────────────────────────

async function callClaude(env, systemPrompt, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text in Claude response");

  return textBlock.text;
}
