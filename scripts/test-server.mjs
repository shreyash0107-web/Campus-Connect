// TEST ONLY. Launched by Playwright, never by npm run dev/start.
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === "win32") {
      // Only processes started and still tracked by this launcher are targeted.
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      try { process.kill(-child.pid, "SIGTERM"); } catch { /* Child already stopped. */ }
    }
  }
  process.exitCode = code;
}

function launch(file, args, env) {
  const child = spawn(process.execPath, [file, ...args], {
    cwd: root, env, stdio: "inherit", detached: process.platform !== "win32",
    windowsHide: true,
  });
  children.add(child);
  child.on("error", () => { console.error("An isolated test subprocess could not start."); stop(1); });
  child.on("exit", (code) => {
    children.delete(child);
    if (!stopping) {
      console.error("An isolated test subprocess exited before the suite completed.");
      stop(code || 1);
    }
  });
  return child;
}

async function main() {
  if (process.env.CAMPUSCONNECT_E2E !== "1") {
    console.error("Refusing to launch isolated test servers without CAMPUSCONNECT_E2E=1.");
    process.exitCode = 1;
    return;
  }
  const env = {
    ...process.env,
    NODE_ENV: "development",
    CAMPUSCONNECT_E2E: "1",
    CAMPUSCONNECT_TEST_PASSWORD: process.env.CAMPUSCONNECT_TEST_PASSWORD || `${randomBytes(24).toString("base64url")}aA1!`,
    NEXT_TEST_DIST_DIR: ".next-test",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
    SUPABASE_URL: "http://127.0.0.1:54329",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_local_fixture",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_fixture",
    SEED_DEMO: "false",
    CHECK_BACKEND: "false",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  for (const key of Object.keys(env)) {
    if (/SERVICE_ROLE|SECRET_KEY|DEMO_SEED_PASSWORD|SUPABASE_ACCESS_TOKEN|DATABASE_URL/.test(key)) env[key] = "";
  }
  // Explicit empties also prevent Next's .env.local loader restoring these.
  env.SUPABASE_SERVICE_ROLE_KEY = "";
  env.DEMO_SEED_PASSWORD = "";
  env.SUPABASE_ACCESS_TOKEN = "";
  env.DATABASE_URL = "";
  const nextPath = require.resolve("next/dist/bin/next");
  launch(resolve(root, "tests/fixtures/supabase-server.mjs"), [], env);
  let ready = false;
  for (let attempt = 0; attempt < 80 && !stopping; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:54329/health", { signal: AbortSignal.timeout(1000) });
      const data = await response.json();
      if (response.ok && data.fixture === "campusconnect-test-only") { ready = true; break; }
    } catch { /* The fixture is still starting. */ }
    await new Promise((done) => setTimeout(done, 100));
  }
  if (!ready || stopping) throw new Error("The dedicated loopback fixture did not become ready.");
  launch(nextPath, ["dev", "--hostname", "127.0.0.1", "--port", "3101"], env);
  console.log("TEST ONLY: Next test server uses port 3101, .next-test, and the local UI fixture.");
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
process.on("exit", () => stop(process.exitCode || 0));
main().catch(() => {
  console.error("Isolated test-server startup failed. Check dependency installation and dedicated port availability.");
  stop(1);
});
