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
  GRADUATES_TABLE_ID: "tbluIOzmqFs40t4tv",
  PROJECTS_TABLE_ID: "tbluXHyoUjdKYfmrA",

  GRADUATES_FIELD_IDS: {
    name: "fld6QljW1mWzByMkz",
    title: "fldDOY35vk0nSoJW3",
    email: "fldvDvW1VrHyXsboT",
    linkedin: "fldHOjt177qxittes",
    speciality: "fldccvrtoYucTTilB",
    projects: "fldjHvOwbdXkHfH0n",
    preference: "fldiKmJ2EVUgy66EK",
    yearsOfExperience: "fld4XanmSbj9yLm9S",
    attachments: "fldfDFb1kXIIOzqqd",
    status: "fldPpbjjtVb3UbWVE",
    calculation: "flds3eefSSwNfEZ4I",
  },

  GRADUATES_FIELD_NAMES: {
    name: "Name",
    title: "Title",
    email: "Email",
    linkedin: "Linkedin",
    speciality: "Speciality",
    projects: "Graduates Projects",
    preference: "Graduate Preference",
    yearsOfExperience: "Years of experience",
    attachments: "Attachments",
    status: "Status",
    calculation: "Calculation",
  },

  PROJECTS_FIELD_IDS: {
    name: "fldHm9zKYMT9TyBWn",
    notes: "flduGP7KvjET0rMbq",
    type: "fldiGJ3o0HZSZwH8A",
    attachments: "fld6Dl9gVJ7rOdN0Q",
    student: "fldncobE6IxHgIBaI",
    status: "fldqFQVm8cm30s89X",
  },

  PROJECTS_FIELD_NAMES: {
    name: "Name",
    notes: "Notes",
    type: "Type",
    attachments: "Attachments",
    student: "Student",
    status: "Status",
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
      if (parts[0] !== "graduates" || parts.length > 2) {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const fields = await resolveFieldNames(env);
      const includeProjects = parseBoolean(url.searchParams.get("includeProjects"), true);

      if (parts.length === 1) {
        return listGraduates(env, fields, url.searchParams, includeProjects);
      }

      const recordOrSlug = decodeURIComponent(parts[1] || "").trim();
      if (!recordOrSlug) return json({ error: "Missing graduate identifier in URL" }, 400);

      return getGraduateDetails(env, fields, recordOrSlug, includeProjects);
    } catch (error) {
      return json(
        {
          error: "Failed to fetch graduates data",
          details: error?.details || String(error?.message || error),
        },
        502,
      );
    }
  },
};

async function listGraduates(env, fields, searchParams, includeProjects) {
  const limit = clampInt(searchParams.get("limit"), 50, 1, 100);
  const speciality = (searchParams.get("speciality") || "").trim();
  const search = (searchParams.get("search") || "").trim();
  const openTo = (searchParams.get("openTo") || "").trim();

  const formulas = [];
  if (speciality) {
    formulas.push(`{${fields.graduates.speciality}}="${escapeFormulaValue(speciality)}"`);
  }
  if (search) {
    formulas.push(
      `FIND(LOWER("${escapeFormulaValue(search)}"), LOWER({${fields.graduates.name}}&" "&{${fields.graduates.title}}))>0`,
    );
  }
  if (openTo) {
    formulas.push(
      `FIND("${escapeFormulaValue(openTo)}", ARRAYJOIN({${fields.graduates.preference}}, ","))>0`,
    );
  }

  const qs = new URLSearchParams({
    pageSize: String(limit),
    "sort[0][field]": fields.graduates.name,
    "sort[0][direction]": "asc",
  });
  if (formulas.length === 1) qs.set("filterByFormula", formulas[0]);
  if (formulas.length > 1) qs.set("filterByFormula", `AND(${formulas.join(",")})`);

  const listUrl = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${AIRTABLE.GRADUATES_TABLE_ID}?${qs.toString()}`;
  const res = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
  });
  if (!res.ok) return airtableErrorResponse(res);

  const data = await res.json();
  const records = data?.records || [];

  let projectMap = {};
  if (includeProjects) {
    const projectIds = unique(
      records.flatMap((r) => toArray(r?.fields?.[fields.graduates.projects])),
    );
    projectMap = await fetchProjectsMap(env, fields, projectIds);
  }

  const graduates = records.map((record) =>
    graduateDto(record, fields, includeProjects, projectMap),
  );
  const recordsForFramer = graduates.map(graduateToAirtableLikeRecord);

  return json({
    total: graduates.length,
    includeProjects,
    graduates,
    records: recordsForFramer,
  });
}

async function getGraduateDetails(env, fields, recordOrSlug, includeProjects) {
  const record = isRecordId(recordOrSlug)
    ? await getGraduateByRecordId(env, recordOrSlug)
    : await getGraduateBySlugOrName(env, fields, recordOrSlug);

  if (!record) {
    return json(
      { error: "Graduate not found", details: { graduate: recordOrSlug } },
      404,
    );
  }

  let projectMap = {};
  if (includeProjects) {
    const projectIds = unique(toArray(record?.fields?.[fields.graduates.projects]));
    projectMap = await fetchProjectsMap(env, fields, projectIds);
  }

  const graduate = graduateDto(record, fields, includeProjects, projectMap);
  return json({
    includeProjects,
    graduate,
    record: graduateToAirtableLikeRecord(graduate),
  });
}

async function getGraduateByRecordId(env, recordId) {
  const singleUrl = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${AIRTABLE.GRADUATES_TABLE_ID}/${recordId}`;
  const res = await fetch(singleUrl, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await airtableError(res);
  return res.json();
}

async function getGraduateBySlugOrName(env, fields, value) {
  const safe = escapeFormulaValue(value);
  const formula = `OR({${fields.graduates.calculation}}="${safe}", {${fields.graduates.name}}="${safe}")`;
  const qs = new URLSearchParams({ maxRecords: "1", filterByFormula: formula });
  const url = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${AIRTABLE.GRADUATES_TABLE_ID}?${qs.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
  });
  if (!res.ok) throw await airtableError(res);
  const data = await res.json();
  return data?.records?.[0] || null;
}

async function fetchProjectsMap(env, fields, ids) {
  if (!ids.length) return {};

  const idChunks = chunk(ids, 25);
  const byId = {};

  for (const currentIds of idChunks) {
    const formula = `OR(${currentIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const qs = new URLSearchParams({ pageSize: "100", filterByFormula: formula });
    const url = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${AIRTABLE.PROJECTS_TABLE_ID}?${qs.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });
    if (!res.ok) throw await airtableError(res);

    const data = await res.json();
    for (const record of data?.records || []) {
      byId[record.id] = projectDto(record, fields);
    }
  }

  return byId;
}

function graduateDto(record, fields, includeProjects, projectsById) {
  const f = record?.fields || {};
  const projectIds = unique(toArray(f[fields.graduates.projects]));
  const profileAttachmentItems = toArray(f[fields.graduates.attachments])
    .filter((attachment) => attachment?.url)
    .map((attachment) => ({
      url: attachment.url,
      filename: attachment.filename || null,
      type: attachment.type || null,
      thumbnails: attachment.thumbnails || null,
      thumbnail:
        attachment?.thumbnails?.large?.url ||
        attachment?.thumbnails?.small?.url ||
        null,
    }));
  const attachmentUrls = profileAttachmentItems.map((attachment) => attachment.url);
  const projects = includeProjects
    ? projectIds.map((id) => projectsById[id]).filter(Boolean)
    : [];
  const projectAttachments = collectProjectAttachments(projects);
  const demoVideo = extractDemoVideo(projects);
  const about = [f[fields.graduates.title], f[fields.graduates.speciality]]
    .filter(Boolean)
    .join(" | ");

  return {
    recordId: record.id,
    name: f[fields.graduates.name] || null,
    title: f[fields.graduates.title] || null,
    email: f[fields.graduates.email] || null,
    linkedin: f[fields.graduates.linkedin] || null,
    speciality: f[fields.graduates.speciality] || null,
    yearsOfExperience: f[fields.graduates.yearsOfExperience] || null,
    status: f[fields.graduates.status] || null,
    preferences: toArray(f[fields.graduates.preference]),
    profileAttachments: profileAttachmentItems,
    profileImageUrls: attachmentUrls,
    calculation: f[fields.graduates.calculation] || null,
    graduateProjectRecordIds: projectIds,
    projects: includeProjects ? projects : undefined,
    image: pickPrimaryImage(profileAttachmentItems),
    about: about || null,
    demoVideo,
    attachments: projectAttachments,
  };
}

function projectDto(record, fields) {
  const f = record?.fields || {};
  const attachmentItems = toArray(f[fields.projects.attachments])
    .filter((attachment) => attachment?.url)
    .map((attachment) => ({
      url: attachment.url,
      filename: attachment.filename || null,
      type: attachment.type || null,
      thumbnail:
        attachment?.thumbnails?.large?.url ||
        attachment?.thumbnails?.small?.url ||
        null,
    }));
  const attachmentUrls = attachmentItems.map((attachment) => attachment.url);
  return {
    recordId: record.id,
    name: f[fields.projects.name] || null,
    notes: f[fields.projects.notes] || null,
    type: f[fields.projects.type] || null,
    status: f[fields.projects.status] || null,
    attachmentItems,
    attachmentUrls,
    studentRecordIds: toArray(f[fields.projects.student]),
  };
}

function graduateToAirtableLikeRecord(graduate) {
  const attachmentObjects = toAttachmentObjects(graduate.profileAttachments, "Profile");
  return {
    id: graduate.recordId,
    fields: {
      // Framer default keys
      title: graduate.name || "",
      body: graduate.title || graduate.about || "",
      image: graduate.image || "",
      Speciality: graduate.speciality || "",
      about: graduate.about || graduate.title || "",
      demoVideo: graduate.demoVideo || "",
      attachments: graduate.attachments || [],

      // Helpful aliases
      speciality: graduate.speciality || "",
      name: graduate.name || "",

      // Airtable-like field names
      Name: graduate.name || "",
      Title: graduate.title || "",
      Email: graduate.email || "",
      Linkedin: graduate.linkedin || "",
      Status: graduate.status || "",
      "Years of experience": graduate.yearsOfExperience || "",
      "Graduate Preference": graduate.preferences || [],
      "Graduates Projects": graduate.graduateProjectRecordIds || [],
      Attachments: attachmentObjects,
      Calculation: graduate.calculation || "",

      // Keep normalized objects for advanced paths
      projects: graduate.projects || [],
      profileAttachments: graduate.profileAttachments || [],
      profileImageUrls: graduate.profileImageUrls || [],
    },
  };
}

function toAttachmentObjects(items, prefix) {
  return toArray(items)
    .filter((item) => item?.url)
    .map((item, index) => {
      const fallbackName = `${prefix} ${index + 1}`;
      const thumbnails = item?.thumbnails || null;
      return {
        url: item.url,
        filename: item?.filename || fallbackName,
        name: item?.filename || fallbackName,
        type: item?.type || "application/octet-stream",
        thumbnails,
        thumbnail:
          item?.thumbnail ||
          thumbnails?.large?.url ||
          thumbnails?.small?.url ||
          null,
      };
    });
}

function pickPrimaryImage(items) {
  const first = toArray(items)[0];
  if (!first) return null;
  return (
    first?.thumbnails?.large?.url ||
    first?.thumbnails?.small?.url ||
    first?.thumbnail ||
    first?.url ||
    null
  );
}

function collectProjectAttachments(projects) {
  const attachments = [];
  for (const project of toArray(projects)) {
    const name = project?.name || "Project Attachment";
    const fallbackType = project?.type || "Projects Attachments";
    for (const item of toArray(project?.attachmentItems)) {
      const url = item?.url;
      if (!url) continue;
      attachments.push({
        url,
        name: item?.filename || name,
        type: item?.type || fallbackType,
        thumbnail: item?.thumbnail || null,
        projectName: name,
      });
    }
  }
  return attachments;
}

function extractDemoVideo(projects) {
  const urlRegex = /(https?:\/\/[^\s]+)/i;
  for (const project of toArray(projects)) {
    const type = String(project?.type || "").toLowerCase();
    const notes = String(project?.notes || "");
    const noteUrl = notes.match(urlRegex)?.[1] || null;
    const firstAttachment = toArray(project?.attachmentUrls)[0] || null;
    if (type.includes("youtube") || type.includes("demo link")) {
      return noteUrl || firstAttachment || null;
    }
  }
  for (const project of toArray(projects)) {
    const notes = String(project?.notes || "");
    const noteUrl = notes.match(urlRegex)?.[1] || null;
    if (noteUrl) return noteUrl;
  }
  return null;
}

async function resolveFieldNames(env) {
  if (fieldCache && Date.now() - fieldCacheAt < FIELD_CACHE_TTL_MS) return fieldCache;

  const fallback = {
    graduates: { ...AIRTABLE.GRADUATES_FIELD_NAMES },
    projects: { ...AIRTABLE.PROJECTS_FIELD_NAMES },
  };

  try {
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE.BASE_ID}/tables`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });
    if (!metaRes.ok) return fallback;

    const meta = await metaRes.json();
    const tables = meta?.tables || [];
    const graduatesTable = tables.find((t) => t.id === AIRTABLE.GRADUATES_TABLE_ID);
    const projectsTable = tables.find((t) => t.id === AIRTABLE.PROJECTS_TABLE_ID);

    const graduatesNameById = indexFieldNames(graduatesTable?.fields || []);
    const projectsNameById = indexFieldNames(projectsTable?.fields || []);

    const resolved = {
      graduates: {
        name: graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.name] || fallback.graduates.name,
        title: graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.title] || fallback.graduates.title,
        email: graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.email] || fallback.graduates.email,
        linkedin:
          graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.linkedin] || fallback.graduates.linkedin,
        speciality:
          graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.speciality] || fallback.graduates.speciality,
        projects:
          graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.projects] || fallback.graduates.projects,
        preference:
          graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.preference] || fallback.graduates.preference,
        yearsOfExperience:
          graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.yearsOfExperience] ||
          fallback.graduates.yearsOfExperience,
        attachments:
          graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.attachments] || fallback.graduates.attachments,
        status: graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.status] || fallback.graduates.status,
        calculation:
          graduatesNameById[AIRTABLE.GRADUATES_FIELD_IDS.calculation] || fallback.graduates.calculation,
      },
      projects: {
        name: projectsNameById[AIRTABLE.PROJECTS_FIELD_IDS.name] || fallback.projects.name,
        notes: projectsNameById[AIRTABLE.PROJECTS_FIELD_IDS.notes] || fallback.projects.notes,
        type: projectsNameById[AIRTABLE.PROJECTS_FIELD_IDS.type] || fallback.projects.type,
        attachments:
          projectsNameById[AIRTABLE.PROJECTS_FIELD_IDS.attachments] || fallback.projects.attachments,
        student: projectsNameById[AIRTABLE.PROJECTS_FIELD_IDS.student] || fallback.projects.student,
        status: projectsNameById[AIRTABLE.PROJECTS_FIELD_IDS.status] || fallback.projects.status,
      },
    };

    fieldCache = resolved;
    fieldCacheAt = Date.now();
    return resolved;
  } catch {
    return fallback;
  }
}

function indexFieldNames(fields) {
  const out = {};
  for (const field of fields) out[field.id] = field.name;
  return out;
}

async function airtableErrorResponse(res) {
  const body = await res.text();
  return new Response(body, {
    status: 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function airtableError(res) {
  let details;
  try {
    details = await res.json();
  } catch {
    details = await res.text();
  }
  const error = new Error("Airtable request failed");
  error.details = details;
  error.status = res.status;
  return error;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(arr) {
  return [...new Set(arr)];
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function escapeFormulaValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  const normalized = String(value).toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function isRecordId(value) {
  return /^rec[a-zA-Z0-9]{14,}$/.test(value);
}
