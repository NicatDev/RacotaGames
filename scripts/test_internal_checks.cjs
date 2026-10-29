const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { request, checkStack } = require("../deploy/internal-checks.cjs");

async function server(t, handler) {
  const instance = http.createServer(handler);
  instance.listen(0, "127.0.0.1");
  await once(instance, "listening");
  t.after(() => new Promise((resolve) => instance.close(resolve)));
  return `http://127.0.0.1:${instance.address().port}`;
}

test("internal requests preserve the public Host and HTTPS scheme", async (t) => {
  const base = await server(t, (req, res) =>
    res.end(
      JSON.stringify({
        host: req.headers.host,
        scheme: req.headers["x-forwarded-proto"],
      }),
    ),
  );
  const response = await request(base, "/api/games/", "app.racotagames.com");
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    host: "app.racotagames.com",
    scheme: "https",
  });
});

test("all stack checks use the correct vhost and secure host-only cookies", async (t) => {
  const seen = [];
  const base = await server(t, (req, res) => {
    seen.push([req.url, req.headers.host]);
    if (req.url.includes("session"))
      res.setHeader(
        "Set-Cookie",
        "csrftoken=test; Path=/; Secure; SameSite=Lax",
      );
    const bodies = {
      "/az": "https://racotagames.com/az",
      "/robots.txt": "Sitemap: https://racotagames.com/sitemap.xml",
      "/sitemap.xml": "https://racotagames.com/en/about",
    };
    res.end(bodies[req.url] || "{}");
  });
  await checkStack(base);
  assert.deepEqual(
    seen.filter(([path]) => path === "/api/games/"),
    [["/api/games/", "app.racotagames.com"]],
  );
  assert.equal(seen.length, 6);
});

test("a failed API reports both its hostname/path and status", async (t) => {
  const base = await server(t, (req, res) => {
    res.statusCode = req.url === "/api/games/" ? 400 : 200;
    res.end("https://racotagames.com/az");
  });
  await assert.rejects(
    checkStack(base),
    /app\.racotagames\.com\/api\/games\/: HTTP 400/,
  );
});
