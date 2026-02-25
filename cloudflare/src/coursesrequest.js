/**
 * ============================================================
 * COURSES REQUEST WORKER
 * ============================================================
 * Handles:
 *   GET /courses
 *   GET /courses/{recordId}
 *
 * Reads from Airtable table: "CODED Course Catalog"
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
  CATALOG_SECTION_TABLE_ID: "tblxn1EKz7bp2R90r",
  CATALOG_SECTION_NAME_FIELD: "Name",

  FIELD_IDS: {
    courseTitle: "fldoP590TirEz6Cu4",
    seq: "fldUxky3kYJvEcWZZ",
    section: "fldGdGDXUDrb0EvyR",
    pdf: "",
    duration: "fld24qip9Ztq80BTa",
    courseType: "fldTfCVLrBtSQHqHJ",
    targetAudience: "fldafd4Ru78So4h1t",
    description: "fldruDxe0yXm3HGBj",
    tag: "fldlnpJ9zOjnzML4L",
    page: "fldEwEhKXXmHpwHMP",
    outline: "fldN5VUivnQa01WOk",
    methodology: "fldu7q13YUpZykZ78",
    reviewed: "fldldAOKklNOAnzVi",
  },

  FIELD_NAMES: {
    courseTitle: "Course Title",
    seq: "Seq",
    section: "Section",
    pdf: "PDF",
    duration: "Duration",
    courseType: "Course Type",
    targetAudience: "Target Audience",
    description: "Description",
    tag: "Tag",
    page: "Page",
    outline: "Outline",
    methodology: "Methodology",
    reviewed: "Reviewed",
  },
};

let fieldCache = null;
let fieldCacheAt = 0;
const FIELD_CACHE_TTL_MS = 5 * 60 * 1000;

export default {
  async fetch(req, env) {
    try {
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (req.method !== "GET") {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const url = new URL(req.url);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== "courses" || parts.length > 2) {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const fields = await resolveCourseFieldNames(env);

      if (parts.length === 2) {
        const recordId = decodeURIComponent(parts[1] || "").trim();
        if (!isRecordId(recordId)) {
          return json(
            { error: "course identifier must be a valid Airtable record id (rec...)" },
            400,
          );
        }
        return getCourseByRecordId(env, fields, recordId);
      }

      return listCourses(env, fields, url.searchParams);
    } catch (error) {
      return json(
        {
          error: "Failed to fetch courses data",
          details: error?.details || String(error?.message || error),
        },
        502,
      );
    }
  },
};

async function listCourses(env, fields, searchParams) {
  const limit = clampInt(searchParams.get("limit"), 100, 1, 300);
  const search = (searchParams.get("search") || "").trim();
  const courseType = (searchParams.get("courseType") || "").trim();
  const tag = (searchParams.get("tag") || "").trim();
  const duration = (searchParams.get("duration") || "").trim();

  const formulas = [];
  if (courseType) {
    formulas.push(`{${fields.courseType}}="${escapeFormulaValue(courseType)}"`);
  }
  if (tag) {
    formulas.push(`{${fields.tag}}="${escapeFormulaValue(tag)}"`);
  }
  if (duration) {
    formulas.push(`{${fields.duration}}="${escapeFormulaValue(duration)}"`);
  }
  if (search) {
    formulas.push(
      `FIND(LOWER("${escapeFormulaValue(search)}"), LOWER({${fields.courseTitle}}&" "&{${fields.description}}))>0`,
    );
  }

  let offset = (searchParams.get("offset") || "").trim() || null;
  const rawRecords = [];

  do {
    const remaining = Math.max(1, limit - rawRecords.length);
    const pageSize = Math.min(100, remaining);

    const qs = new URLSearchParams({
      pageSize: String(pageSize),
      "sort[0][field]": fields.courseTitle,
      "sort[0][direction]": "asc",
    });
    if (offset) qs.set("offset", offset);
    if (formulas.length === 1) qs.set("filterByFormula", formulas[0]);
    if (formulas.length > 1) qs.set("filterByFormula", `AND(${formulas.join(",")})`);

    const listUrl = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${encodeURIComponent(
      AIRTABLE.CATALOG_TABLE_NAME,
    )}?${qs.toString()}`;
    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });
    if (!res.ok) return airtableErrorResponse(res);

    const data = await res.json();
    const pageRecords = data?.records || [];
    rawRecords.push(...pageRecords);
    offset = data?.offset || null;
  } while (offset && rawRecords.length < limit);

  const sectionIds = unique(rawRecords.flatMap((record) => toArray(record?.fields?.[fields.section])));
  const sectionNamesById = await fetchSectionNamesMap(env, sectionIds);

  const courses = rawRecords.map((record) => courseDto(record, fields, sectionNamesById));
  const recordsForFramer = courses.map(courseToAirtableLikeRecord);

  return json({
    total: courses.length,
    nextOffset: offset || null,
    courses,
    records: recordsForFramer,
  });
}

async function getCourseByRecordId(env, fields, recordId) {
  const singleUrl = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${encodeURIComponent(
    AIRTABLE.CATALOG_TABLE_NAME,
  )}/${recordId}`;
  const res = await fetch(singleUrl, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
  });

  if (res.status === 404) {
    return json({ error: "Course not found", details: { recordId } }, 404);
  }
  if (!res.ok) return airtableErrorResponse(res);

  const record = await res.json();
  const sectionIds = toArray(record?.fields?.[fields.section]);
  const sectionNamesById = await fetchSectionNamesMap(env, sectionIds);
  const course = courseDto(record, fields, sectionNamesById);

  return json({
    course,
    record: courseToAirtableLikeRecord(course),
  });
}

function courseDto(record, fields, sectionNamesById = {}) {
  const f = record?.fields || {};
  const sectionIds = toArray(f[fields.section]);
  const sections = sectionIds
    .map((id) => sectionNamesById[id] || "")
    .filter(Boolean);

  const rank = toNumber(f.rank ?? f.Rank ?? f[fields.seq]);
  const pdfSource =
    f[fields.pdf] ??
    f.PDF ??
    f.Pdfs ??
    f.PDFs ??
    findPdfLikeFieldValue(f);
  return {
    recordId: record?.id || null,
    rank,
    seq: toNumber(f[fields.seq]),
    sectionIds,
    sections,
    pdfRecordIds: readLinkedRecordIds(pdfSource),
    courseTitle: toText(f[fields.courseTitle]),
    duration: toText(f[fields.duration]),
    courseType: toText(f[fields.courseType]),
    targetAudience: toArray(f[fields.targetAudience]),
    description: toText(f[fields.description]),
    tag: toText(f[fields.tag]),
    page: toText(f[fields.page]),
    outline: toText(f[fields.outline]),
    methodology: toText(f[fields.methodology]),
    reviewed: Boolean(f[fields.reviewed]),
  };
}

function courseToAirtableLikeRecord(course) {
  return {
    id: course.recordId,
    fields: {
      rank: course.rank,
      Seq: course.seq,
      Section: course.sections,
      SectionIds: course.sectionIds,
      PDF: course.pdfRecordIds,
      "Course Title": course.courseTitle,
      Duration: course.duration,
      "Course Type": course.courseType,
      "Target Audience": course.targetAudience,
      Description: course.description,
      Tag: course.tag,
      Page: course.page,
      Outline: course.outline,
      Methodology: course.methodology,
      Reviewed: course.reviewed,
    },
  };
}

async function resolveCourseFieldNames(env) {
  const now = Date.now();
  if (fieldCache && now - fieldCacheAt < FIELD_CACHE_TTL_MS) {
    return fieldCache;
  }

  const fallback = { ...AIRTABLE.FIELD_NAMES };
  const ids = AIRTABLE.FIELD_IDS;

  const hasIds = Object.values(ids)
    .filter(Boolean)
    .every((id) => id?.startsWith("fld"));
  if (!hasIds) return fallback;

  try {
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE.BASE_ID}/tables`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });
    if (!metaRes.ok) return fallback;

    const meta = await metaRes.json();
    const table = (meta?.tables || []).find((t) => t.name === AIRTABLE.CATALOG_TABLE_NAME);
    if (!table) return fallback;

    const fieldIdToName = {};
    for (const f of table.fields || []) fieldIdToName[f.id] = f.name;

    fieldCache = {
      courseTitle: fieldIdToName[ids.courseTitle] || fallback.courseTitle,
      seq: fieldIdToName[ids.seq] || fallback.seq,
      section: fieldIdToName[ids.section] || fallback.section,
      pdf: fieldIdToName[ids.pdf] || fallback.pdf,
      duration: fieldIdToName[ids.duration] || fallback.duration,
      courseType: fieldIdToName[ids.courseType] || fallback.courseType,
      targetAudience: fieldIdToName[ids.targetAudience] || fallback.targetAudience,
      description: fieldIdToName[ids.description] || fallback.description,
      tag: fieldIdToName[ids.tag] || fallback.tag,
      page: fieldIdToName[ids.page] || fallback.page,
      outline: fieldIdToName[ids.outline] || fallback.outline,
      methodology: fieldIdToName[ids.methodology] || fallback.methodology,
      reviewed: fieldIdToName[ids.reviewed] || fallback.reviewed,
    };
    fieldCacheAt = now;
    return fieldCache;
  } catch {
    return fallback;
  }
}

async function airtableErrorResponse(res) {
  let details = null;
  try {
    details = await res.json();
  } catch {
    details = await res.text();
  }
  return json({ error: "Airtable request failed", status: res.status, details }, 502);
}

async function fetchSectionNamesMap(env, sectionIds) {
  if (!sectionIds.length) return {};

  const byId = {};
  const chunks = chunk(sectionIds, 25);

  for (const ids of chunks) {
    const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const qs = new URLSearchParams({
      pageSize: "100",
      filterByFormula: formula,
    });

    const url = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${AIRTABLE.CATALOG_SECTION_TABLE_ID}?${qs.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });

    if (!res.ok) continue;

    const data = await res.json();
    for (const record of data?.records || []) {
      byId[record.id] = String(record?.fields?.[AIRTABLE.CATALOG_SECTION_NAME_FIELD] || "").trim();
    }
  }

  return byId;
}

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isRecordId(value) {
  return /^rec[a-zA-Z0-9]{14,}$/.test(value || "");
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean);
  }
  const one = toText(value);
  return one ? [one] : [];
}

function readLinkedRecordIds(value) {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const id = toText(item.id ?? item.recordId ?? item.value);
        return id;
      }
      return "";
    })
    .filter((id) => /^rec[a-zA-Z0-9]{14,}$/.test(id));
}

function findPdfLikeFieldValue(fields) {
  if (!fields || typeof fields !== "object") return null;
  for (const [key, value] of Object.entries(fields)) {
    if (/pdf/i.test(key)) return value;
  }
  return null;
}

function toNumber(value) {
  const n = Number(toText(value));
  return Number.isFinite(n) ? n : null;
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function toText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const s = value.trim();
    return s === "[object Object]" ? "" : s;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map((v) => toText(v)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const maybe =
      value.name ??
      value.label ??
      value.value ??
      value.text ??
      value.plainText ??
      value.content;
    if (Array.isArray(maybe)) {
      return maybe.map((v) => toText(v)).filter(Boolean).join(" ");
    }
    return toText(maybe);
  }
  return "";
}

function escapeFormulaValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}
