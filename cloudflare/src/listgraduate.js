const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

import graduatesRequestWorker from "./graduatesrequest.js";

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "GET") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = (url.pathname || "").replace(/\/+$/, "");

    if (path !== "/listgraduate" && path !== "/list-graduate") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    // Reuse the graduates listing implementation to keep response shape consistent.
    const proxyUrl = new URL(req.url);
    proxyUrl.pathname = "/graduates";
    const proxyRequest = new Request(proxyUrl.toString(), req);

    return graduatesRequestWorker.fetch(proxyRequest, env, ctx);
  },
};
