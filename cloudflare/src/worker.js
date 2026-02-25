/**
 * ============================================================
 * MAIN ROUTER WORKER
 * ============================================================
 * This is the ONLY entry point (set in wrangler.toml as main).
 *
 * Routes:
 *   POST   /catalogrequest/*
 *   GET    /cohorts/*
 *   GET    /courses/*
 *   GET    /graduates/*
 *   GET    /listgraduate
 *   GET    /list-graduate
 *   POST   /companyrequestgraduate
 *   POST   /company-request-graduate
 *   POST   /workshop-recommend
 *   OPTIONS (CORS preflight) for all routes
 *
 * Files:
 *   ./catalogrequest.js
 *   ./cohortsrequest.js
 *   ./coursesrequest.js
 *   ./graduatesrequest.js
 *   ./listgraduate.js
 *   ./companyrequestgraduate.js
 *   ./workshoprecommend.js
 */

import catalogRequestWorker from "./catalogrequest.js";
import cohortsRequestWorker from "./cohortsrequest.js";
import coursesRequestWorker from "./coursesrequest.js";
import graduatesRequestWorker from "./graduatesrequest.js";
import listGraduateWorker from "./listgraduate.js";
import companyRequestGraduateWorker from "./companyrequestgraduate.js";
import workshopRecommendWorker from "./workshoprecommend.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname || "/";

    // Global CORS preflight (safe fallback)
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ---------- Route to catalogrequest ----------
    // Expected: POST /catalogrequest/{PDF_PARAM}
    if (path.startsWith("/catalogrequest/")) {
      return catalogRequestWorker.fetch(req, env, ctx);
    }

    // ---------- Route to cohorts ----------
    // Expected: GET /cohorts/{productname}
    if (path.startsWith("/cohorts/")) {
      return cohortsRequestWorker.fetch(req, env, ctx);
    }

    // ---------- Route to courses ----------
    // Expected:
    //   GET /courses
    //   GET /courses/{recordId}
    if (path === "/courses" || path.startsWith("/courses/")) {
      return coursesRequestWorker.fetch(req, env, ctx);
    }

    // ---------- Route to graduates ----------
    // Expected:
    //   GET /graduates
    //   GET /graduates/{recordId-or-slug}
    if (path === "/graduates" || path.startsWith("/graduates/")) {
      return graduatesRequestWorker.fetch(req, env, ctx);
    }

    // ---------- Route to list graduate ----------
    // Expected:
    //   GET /listgraduate
    //   GET /list-graduate
    if (path === "/listgraduate" || path === "/list-graduate") {
      return listGraduateWorker.fetch(req, env, ctx);
    }

    // ---------- Route to company request graduate ----------
    // Expected:
    //   POST /companyrequestgraduate
    //   POST /company-request-graduate
    if (
      path === "/companyrequestgraduate" ||
      path === "/company-request-graduate" ||
      path.startsWith("/companyrequestgraduate/") ||
      path.startsWith("/company-request-graduate/")
    ) {
      return companyRequestGraduateWorker.fetch(req, env, ctx);
    }

    // ---------- Route to workshop recommend ----------
    // Expected: POST /workshop-recommend
    if (path === "/workshop-recommend") {
      return workshopRecommendWorker.fetch(req, env, ctx);
    }

    // Health check (optional)
    if (path === "/" || path === "/health") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
