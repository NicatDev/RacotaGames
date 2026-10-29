const assert = require("node:assert/strict");
const http = require("node:http");

// http.request preserves Host; recent Node fetch implementations replace it.
function request(base, path, host) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      new URL(path, base),
      {
        headers: { Host: host, "X-Forwarded-Proto": "https" },
        timeout: 10000,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("error", reject);
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("timeout", () =>
      req.destroy(new Error(`${host}${path}: request timed out`)),
    );
    req.on("error", reject);
  });
}

async function checkStack(base = "http://racota-gateway:8080") {
  for (const [path, host] of [
    ["/az", "racotagames.com"],
    ["/api/games/", "app.racotagames.com"],
    ["/api/backend/auth/session/", "racotagames.com"],
    ["/healthz", "app.racotagames.com"],
  ]) {
    const response = await request(base, path, host);
    assert.equal(
      response.status,
      200,
      `${host}${path}: HTTP ${response.status}, expected 200`,
    );
    if (path === "/az") {
      assert(
        response.body.includes("https://racotagames.com/az"),
        "Home canonical must use the public domain",
      );
      assert(
        !response.body.includes("http://backend:8000/media/"),
        "Home must not expose Docker media URLs",
      );
    }
    if (path.endsWith("session/")) {
      const cookie = (response.headers["set-cookie"] || []).join("; ");
      assert(
        cookie.includes("Secure"),
        "CSRF cookie must be Secure behind HTTPS",
      );
      assert(!cookie.includes("Domain="), "Cookies must be host-only");
    }
    console.log(`OK ${host}${path}`);
  }
  const robots = await request(base, "/robots.txt", "racotagames.com");
  assert.equal(robots.status, 200, "robots.txt must return 200");
  assert(robots.body.includes("https://racotagames.com/sitemap.xml"));
  const sitemap = await request(base, "/sitemap.xml", "racotagames.com");
  assert.equal(sitemap.status, 200, "sitemap.xml must return 200");
  assert(sitemap.body.includes("https://racotagames.com/en/about"));
  console.log(
    "Internal gateway, domains, cookies, API, sitemap and robots verified.",
  );
}

module.exports = { request, checkStack };
if (require.main === module || process.argv[1] === undefined) {
  checkStack().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
