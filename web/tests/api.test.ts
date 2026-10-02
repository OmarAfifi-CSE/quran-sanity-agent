import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/chat/route";
import { GET as health } from "../src/app/api/health/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}
test("API rejects malformed JSON and invalid question shapes", async () => {
  const badJson = await POST(
    new NextRequest("http://localhost/api/chat", { method: "POST", body: "{" }),
  );
  assert.equal(badJson.status, 400);
  for (const body of [
    null,
    {},
    [],
    { question: "" },
    { question: 42 },
    { question: "a".repeat(2001) },
    { question: "2:255", surahNumber: "2" },
    { question: "2:255", surahNumber: 1.5 },
    { question: "2:255", surahNumber: 115 },
    { messages: [{ role: "assistant", content: "2:255" }] },
  ])
    assert.equal((await POST(request(body))).status, 400);
});
test("API bounds request size", async () =>
  assert.equal(
    (await POST(request({ question: "x".repeat(17000) }))).status,
    413,
  ));
test('API rejects cross-origin browser calls before retrieving records',async()=>{
 const sameOrigin=await POST(new NextRequest('http://localhost:3000/api/chat',{method:'POST',headers:{Host:'127.0.0.1:3000',Origin:'http://127.0.0.1:3000','Content-Type':'application/json'},body:'{}'}));
 assert.equal(sameOrigin.status,400);
 const response=await POST(new NextRequest('http://localhost/api/chat',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({question:'2:255'})}));
 assert.equal(response.status,403);
});
test("API returns complete grounded content without a model key", async () => {
  process.env.QURAN_DATA_MODE = "local";
  const response = await POST(request({ question: "2:255" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const result = await response.json();
  assert.equal(result.origin, "local");
  assert.equal(result.citations[0].documentId, "ayah-2-255");
  assert.ok(result.text.length > 300);
});
test("configured live failure does not silently fall back to local data", async () => {
  const prior = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  process.env.QURAN_DATA_MODE = "live";
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "not a valid project";
  try {
    const result = await POST(request({ question: "2:255" }));
    assert.equal(result.status, 503);
    const json = await result.json();
    assert.ok(!json.citations);
    assert.ok(!json.error.includes("token"));
  } finally {
    process.env.QURAN_DATA_MODE = "local";
    if (prior) process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = prior;
    else delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  }
});
test("health reports usable claims and complete Context configuration", async () => {
  const previous = {
    mode: process.env.QURAN_DATA_MODE,
    endpoint: process.env.SANITY_CONTEXT_MCP_URL,
    token: process.env.SANITY_ORGANIZATION_TOKEN,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  process.env.QURAN_DATA_MODE = "local";
  delete process.env.SANITY_CONTEXT_MCP_URL;
  delete process.env.SANITY_ORGANIZATION_TOKEN;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const unconfigured = await (await health()).json();
    assert.equal(unconfigured.origin, "local");
    assert.equal(unconfigured.usableClaims, 12);
    assert.equal(unconfigured.contextConfigured, false);

    process.env.SANITY_CONTEXT_MCP_URL =
      "https://api.sanity.io/v1/context/organizations/test/mcp";
    process.env.SANITY_ORGANIZATION_TOKEN = "configured-for-test";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "configured-for-test";
    const configured = await (await health()).json();
    assert.equal(configured.contextConfigured, true);
  } finally {
    if (previous.mode === undefined) delete process.env.QURAN_DATA_MODE;
    else process.env.QURAN_DATA_MODE = previous.mode;
    if (previous.endpoint === undefined)
      delete process.env.SANITY_CONTEXT_MCP_URL;
    else process.env.SANITY_CONTEXT_MCP_URL = previous.endpoint;
    if (previous.token === undefined)
      delete process.env.SANITY_ORGANIZATION_TOKEN;
    else process.env.SANITY_ORGANIZATION_TOKEN = previous.token;
    if (previous.google === undefined)
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    else process.env.GOOGLE_GENERATIVE_AI_API_KEY = previous.google;
    if (previous.gemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous.gemini;
  }
});
