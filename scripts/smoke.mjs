import { spawn } from "node:child_process";

const PREFERRED_BASES = ["http://127.0.0.1:3000", "http://127.0.0.1:3100"];

const routes = [
  "/",
  "/onboarding",
  "/patient",
  "/patient/symptom-checker",
  "/patient/scanners",
  "/patient/care-finder",
  "/patient/health-card",
  "/doctor",
  "/doctor/patients/pat_1",
  "/provider/verification",
];

const apiRoutes = ["/api/health"];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetries(url, attempts = 5) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(url);
    } catch (err) {
      lastError = err;
      await wait(400 * (i + 1));
    }
  }
  throw lastError;
}

async function findRunningBase() {
  for (const base of PREFERRED_BASES) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return base;
    } catch {
      // ignore
    }
  }
  return null;
}

async function assertStatus(url, expected = 200) {
  const res = await fetchWithRetries(url);
  if (!res || res.status !== expected) {
    throw new Error(`${url} -> expected ${expected}, got ${res?.status}`);
  }
}

async function main() {
  let base = await findRunningBase();
  let child = null;

  if (!base) {
    base = "http://127.0.0.1:3100";
    child = spawn("npm", ["run", "dev", "--", "--port", "3100"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let ready = false;
    child.stdout.on("data", (d) => {
      if (d.toString().includes("Ready")) ready = true;
    });
    child.stderr.on("data", (d) => {
      if (d.toString().includes("Ready")) ready = true;
    });

    const start = Date.now();
    while (!ready && Date.now() - start < 60_000) {
      await wait(500);
    }
    if (!ready) {
      child.kill("SIGTERM");
      throw new Error("Next.js dev server did not become ready");
    }
  }

  // Wait until the app is actually accepting requests.
  await assertStatus(`${base}/api/health`);

  const health = await (await fetch(`${base}/api/health`)).json();
  const supabaseConfigured = Boolean(health?.supabaseConfigured);
  if (supabaseConfigured) {
    apiRoutes.push("/api/patients", "/api/doctors", "/api/appointments", "/api/patients/pat_1");
  }

  for (const route of routes) {
    await assertStatus(`${base}${route}`);
    console.log(`ok page ${route}`);
  }

  for (const route of apiRoutes) {
    await assertStatus(`${base}${route}`);
    console.log(`ok api ${route}`);
  }

  if (child) child.kill("SIGTERM");
  console.log("smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

