// The `api` service: answers what it is, and keeps the calls the
// platform made to it (crons, Queue messages) since this instance
// started, newest last. `GET /greeting` answers the secret GREETING and
// writes a small object to the Bucket bound as FILES.
import { createServer } from "node:http";

const calls = [];

async function greeting() {
  const key = `greetings/${process.env.MH_DEPLOYMENT ?? "local"}.txt`;
  const body = `greeting=${process.env.GREETING ?? ""} at ${new Date().toISOString()}\n`;
  let wrote;
  try {
    const res = await fetch(`${process.env.MH_BINDINGS_URL}/buckets/FILES/objects/${key}`, {
      method: "PUT",
      headers: { "mh-bindings": "1", "content-type": "text/plain", "content-length": String(Buffer.byteLength(body)) },
      body,
    });
    wrote = { status: res.status, key, error: res.ok ? null : await res.text() };
  } catch (err) {
    wrote = { status: 0, key, error: String(err) };
  }
  return { greeting: process.env.GREETING ?? null, wrote };
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://worker");
  if (req.method === "POST") {
    const call = {
      path: url.pathname,
      schedule: req.headers["x-mh-schedule"] ?? null,
      queue: req.headers["x-mh-queue"] ?? null,
      attempt: req.headers["x-mh-attempt"] ?? null,
      at: new Date().toISOString(),
    };
    calls.push(call);
    if (calls.length > 50) calls.shift();
    console.log("cron", JSON.stringify(call));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  if (url.pathname === "/greeting") {
    res.end(JSON.stringify({ service: "api", deployment: process.env.MH_DEPLOYMENT ?? null, ...(await greeting()) }));
    return;
  }
  res.end(
    JSON.stringify({
      service: "api", proof: "pr-3",
      deployment: process.env.MH_DEPLOYMENT ?? null,
      calls,
    }),
  );
}).listen(process.env.PORT ?? 8080);
