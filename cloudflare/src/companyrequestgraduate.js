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
  REQUEST_TABLE_ID: "tblNMyPuXlftz0TAL",

  FIELD_IDS: {
    name: "fldRYl5OkRv9Hocsc",
    notes: "fldNtcwUkg0AkGrbz",
    companyName: "fldm7bUtR56aZQKee",
    contactName: "fldAGQR6FkiytLchs",
    companyEmail: "fldKKrLdBXAJvW1wz",
    phone: "fld45NXAGfAJH5zzL",
    companyWebsite: "fldZAwTMyX8pQCjZZ",
    roleType: "fldsVcagbh7JSK3AF",
    graduateName: "fldAhaddUTjqcXbnz",
    graduateRecordId: "flda6k6SRYbvh7Kud",
    requestMessage: "fldBGGCgcvpQ4DDKx",
    requestSource: "fldtMjlfumOlNqPZO",
    submittedAt: "fldLCBUyaFuxOeJMe",
  },

  FIELD_NAMES: {
    name: "Name",
    notes: "Notes",
    companyName: "Company Name",
    contactName: "Contact Name",
    companyEmail: "Company Email",
    phone: "Phone",
    companyWebsite: "Company Website",
    roleType: "Role Type",
    graduateName: "Graduate Name",
    graduateRecordId: "Graduate Record Id",
    requestMessage: "Request Message",
    requestSource: "Request Source",
    submittedAt: "Submitted At",
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
      if (req.method !== "POST") {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      const url = new URL(req.url);
      const path = (url.pathname || "").replace(/\/+$/, "");
      if (path !== "/companyrequestgraduate" && path !== "/company-request-graduate") {
        return new Response("Not found", { status: 404, headers: corsHeaders });
      }

      let payload;
      try {
        payload = await req.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }

      const companyName = normalizeText(
        pick(payload, [
          "companyName",
          "company_name",
          "company",
          "organization",
          "organizationName",
          "platform",
          "sourceCompany",
        ]) || "Unknown Company",
      );
      const graduateName = normalizeText(
        pick(payload, [
          "graduateName",
          "graduate_name",
          "studentName",
          "student_name",
          "cardTitle",
        ]),
      );
      const graduateRecordId = normalizeText(
        pick(payload, ["graduateRecordId", "graduate_record_id", "studentRecordId"]),
      );
      const companyEmail = normalizeText(
        pick(payload, ["companyEmail", "company_email", "email", "contactEmail"]),
      );
      const companyWebsite = normalizeText(
        pick(payload, ["companyWebsite", "company_website", "website", "url"]),
      );
      const roleType = normalizeText(
        pick(payload, ["roleType", "role_type", "jobType", "role"]),
      );
      const message = normalizeText(
        pick(payload, ["message", "requestMessage", "request_message", "notes", "reason"]),
      );
      const contactName = normalizeText(
        pick(payload, ["contactName", "contact_name", "name", "contact"]),
      );
      const phone = normalizeText(pick(payload, ["phone", "phoneNumber", "phone_number"]));
      const source = normalizeText(
        pick(payload, ["source", "requestSource", "request_source"]) || "Cloudflare Worker",
      );

      if (graduateRecordId && !isRecordId(graduateRecordId)) {
        return json({ error: "graduateRecordId must be a valid Airtable record id (rec...)" }, 400);
      }

      const fieldNames = await resolveRequestFieldNames(env);
      const now = new Date().toISOString();

      const requestName = truncate(
        `${companyName} requesting ${graduateName || graduateRecordId || "graduate"}`,
        120,
      );

      const notes = [
        `Request source: ${source || "Cloudflare Worker"}`,
        `Created at (UTC): ${now}`,
        `Company: ${companyName}`,
        `Contact name: ${contactName || "-"}`,
        `Contact email: ${companyEmail || "-"}`,
        `Contact phone: ${phone || "-"}`,
        `Company website: ${companyWebsite || "-"}`,
        `Role type: ${roleType || "-"}`,
        `Graduate name: ${graduateName || "-"}`,
        `Graduate record id: ${graduateRecordId || "-"}`,
        "",
        "Message:",
        message || "-",
      ].join("\n");

      const createUrl = `https://api.airtable.com/v0/${AIRTABLE.BASE_ID}/${AIRTABLE.REQUEST_TABLE_ID}`;
      const fields = {
        [fieldNames.name]: requestName,
        [fieldNames.notes]: notes,
        [fieldNames.companyName]: companyName,
        [fieldNames.requestSource]: source || "Cloudflare Worker",
        [fieldNames.submittedAt]: now,
      };
      setIfValue(fields, fieldNames.contactName, contactName);
      setIfValue(fields, fieldNames.companyEmail, companyEmail);
      setIfValue(fields, fieldNames.phone, phone);
      setIfValue(fields, fieldNames.companyWebsite, companyWebsite);
      setIfValue(fields, fieldNames.roleType, roleType);
      setIfValue(fields, fieldNames.graduateName, graduateName);
      setIfValue(fields, fieldNames.graduateRecordId, graduateRecordId);
      setIfValue(fields, fieldNames.requestMessage, message);

      const body = {
        records: [
          {
            fields,
          },
        ],
      };

      const res = await fetch(createUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      if (!res.ok) {
        return new Response(responseText, {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let created;
      try {
        created = JSON.parse(responseText);
      } catch {
        created = null;
      }

      return json(
        {
          ok: true,
          message:
            "Request record created in Airtable table 'Company Requesting Graduate'. Any Airtable automation on create should now run.",
          createdRecordId: created?.records?.[0]?.id || null,
          createdRecord: created?.records?.[0] || null,
        },
        200,
      );
    } catch (error) {
      return json(
        {
          error: "Failed to create request record",
          details: String(error?.message || error),
        },
        502,
      );
    }
  },
};

async function resolveRequestFieldNames(env) {
  if (fieldCache && Date.now() - fieldCacheAt < FIELD_CACHE_TTL_MS) return fieldCache;

  const fallback = { ...AIRTABLE.FIELD_NAMES };
  try {
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE.BASE_ID}/tables`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
    });
    if (!metaRes.ok) return fallback;

    const meta = await metaRes.json();
    const table = (meta?.tables || []).find((t) => t.id === AIRTABLE.REQUEST_TABLE_ID);
    if (!table) return fallback;

    const fieldIdToName = {};
    for (const field of table.fields || []) fieldIdToName[field.id] = field.name;

    const resolved = {
      name: fieldIdToName[AIRTABLE.FIELD_IDS.name] || fallback.name,
      notes: fieldIdToName[AIRTABLE.FIELD_IDS.notes] || fallback.notes,
      companyName:
        fieldIdToName[AIRTABLE.FIELD_IDS.companyName] || fallback.companyName,
      contactName:
        fieldIdToName[AIRTABLE.FIELD_IDS.contactName] || fallback.contactName,
      companyEmail:
        fieldIdToName[AIRTABLE.FIELD_IDS.companyEmail] || fallback.companyEmail,
      phone: fieldIdToName[AIRTABLE.FIELD_IDS.phone] || fallback.phone,
      companyWebsite:
        fieldIdToName[AIRTABLE.FIELD_IDS.companyWebsite] ||
        fallback.companyWebsite,
      roleType: fieldIdToName[AIRTABLE.FIELD_IDS.roleType] || fallback.roleType,
      graduateName:
        fieldIdToName[AIRTABLE.FIELD_IDS.graduateName] || fallback.graduateName,
      graduateRecordId:
        fieldIdToName[AIRTABLE.FIELD_IDS.graduateRecordId] ||
        fallback.graduateRecordId,
      requestMessage:
        fieldIdToName[AIRTABLE.FIELD_IDS.requestMessage] ||
        fallback.requestMessage,
      requestSource:
        fieldIdToName[AIRTABLE.FIELD_IDS.requestSource] ||
        fallback.requestSource,
      submittedAt:
        fieldIdToName[AIRTABLE.FIELD_IDS.submittedAt] || fallback.submittedAt,
    };

    fieldCache = resolved;
    fieldCacheAt = Date.now();
    return resolved;
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function pick(payload, keys) {
  for (const key of keys) {
    if (payload?.[key] !== undefined && payload?.[key] !== null) return payload[key];
  }
  return undefined;
}

function setIfValue(fields, key, value) {
  const normalized = normalizeText(value);
  if (!normalized) return;
  fields[key] = normalized;
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function isRecordId(value) {
  return /^rec[a-zA-Z0-9]{14,}$/.test(value);
}
