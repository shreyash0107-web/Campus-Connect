// TEST ONLY. This is a UI fixture, not Supabase and not an RLS/security test.
// Never import this module from app/, lib/, proxy.ts, or production code.
import { createServer } from "node:http";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const FIXTURE_PORT = 54329;
export const FIXTURE_PUBLIC_KEY = "sb_publishable_local_fixture";
export const ALICE_ID = "11111111-1111-4111-8111-111111111111";
export const BOB_ID = "22222222-2222-4222-8222-222222222222";
export const BOB_POST_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const categories = ["Project", "Study Partner", "Skill Sharing", "Other"];
const profileKeys = ["full_name", "branch", "year", "bio", "skills", "interests", "avatar_url"];
const postKeys = ["title", "description", "category", "skills_required"];
const loopbacks = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
const allowedOrigins = ["http://127.0.0.1:3101", "http://localhost:3101"];

class FixtureError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const deny = () => { throw new FixtureError(403, "42501", "Fixture permission denied."); };
const clone = (value) => structuredClone(value);
const length = (value) => [...value].length;
const now = () => new Date().toISOString();

export function parseTextArray(input) {
  if (!input.startsWith("{") || !input.endsWith("}")) throw new FixtureError(400, "22P02", "Malformed fixture array.");
  if (input === "{}") return [];
  const values = [];
  let current = "", quoted = false, escaped = false, wasQuoted = false;
  for (const char of input.slice(1, -1)) {
    if (escaped) { current += char; escaped = false; }
    else if (char === "\\") escaped = true;
    else if (char === '"') { quoted = !quoted; wasQuoted = true; }
    else if (char === "," && !quoted) {
      values.push(!wasQuoted && current.trim().toUpperCase() === "NULL" ? null : wasQuoted ? current : current.trim());
      current = ""; wasQuoted = false;
    } else current += char;
  }
  if (quoted || escaped) throw new FixtureError(400, "22P02", "Malformed fixture array.");
  values.push(!wasQuoted && current.trim().toUpperCase() === "NULL" ? null : wasQuoted ? current : current.trim());
  return values;
}

export function ilikeMatches(value, pattern) {
  const literal = (char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let expression = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\") {
      index += 1;
      if (index >= pattern.length) throw new FixtureError(400, "22025", "Invalid fixture LIKE escape.");
      expression += literal(pattern[index]);
    } else if (char === "%" || char === "*") expression += ".*";
    else if (char === "_") expression += ".";
    else expression += literal(char);
  }
  return new RegExp(`^${expression}$`, "isu").test(String(value ?? ""));
}

function generated(table, row) {
  row.search_text = table === "profiles"
    ? [row.full_name, ...row.skills, ...row.interests].join(" ")
    : [row.title, row.description, ...row.skills_required].join(" ");
  return row;
}

function validate(table, row) {
  const text = (key, min, max) => typeof row[key] === "string" && length(row[key].trim()) >= min && length(row[key]) <= max;
  const tags = (key) => Array.isArray(row[key]) && row[key].length <= 12
    && row[key].every((tag) => typeof tag === "string" && tag.trim() && length(tag) <= 32);
  const valid = table === "profiles"
    ? text("full_name", 2, 80) && text("branch", 2, 100) && Number.isInteger(row.year) && row.year >= 1 && row.year <= 6
      && text("bio", 0, 500) && tags("skills") && tags("interests")
      && (row.avatar_url === null || (typeof row.avatar_url === "string" && length(row.avatar_url) <= 500))
    : text("title", 8, 120) && text("description", 30, 3000) && categories.includes(row.category) && tags("skills_required");
  if (!valid) throw new FixtureError(400, "23514", "Fixture field constraint failed.");
}

function makeProfile(id, email, metadata = {}) {
  const bounded = (value, max, fallback) => {
    const candidate = typeof value === "string" ? [...value.trim()].slice(0, max).join("").trim() : "";
    return length(candidate) >= 2 ? candidate : fallback;
  };
  return generated("profiles", {
    id, email,
    full_name: bounded(metadata.full_name, 80, "New student"),
    branch: bounded(metadata.branch, 100, "Undeclared"),
    year: /^[1-6]$/.test(String(metadata.year)) ? Number(metadata.year) : 1,
    bio: "", skills: [], interests: [], avatar_url: null, created_at: now(), updated_at: now(),
  });
}

function makeUser(id, email, metadata) {
  return {
    id, aud: "authenticated", role: "authenticated", email,
    email_confirmed_at: now(), confirmed_at: now(), created_at: now(), updated_at: now(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: metadata, identities: [], is_anonymous: false,
  };
}

function createState(password) {
  const users = new Map(), profiles = new Map(), posts = new Map(), sessions = new Map();
  const definitions = [
    [ALICE_ID, "alice@fixture.example.edu", "Alice Fixture", "Computer Science", 3, ["React", "TypeScript"], ["Accessibility"]],
    [BOB_ID, "bob@fixture.example.edu", "Bob Robotics", "Electronics & Communication", 2, ["Python", "Arduino"], ["Robotics"]],
    ["33333333-3333-4333-8333-333333333333", "carol@fixture.example.edu", "Carol Designer", "Design", 4, ["Figma", "UI, Design"], ["Photography"]],
    ["44444444-4444-4444-8444-444444444444", "dana@fixture.example.edu", "Dana Statistics", "Sciences", 1, ["Statistics"], ["Data Science"]],
  ];
  for (const [id, email, full_name, branch, year, skills, interests] of definitions) {
    const metadata = { full_name, branch, year };
    users.set(id, { user: makeUser(id, email, metadata), password });
    const profile = makeProfile(id, email, metadata);
    Object.assign(profile, { bio: "An explicitly fictional student used only in automated browser journeys.", skills, interests });
    profiles.set(id, generated("profiles", profile));
  }
  const definitionsPosts = [
    ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", ALICE_ID, "Accessible campus map project", "Project", ["React", "TypeScript"]],
    [BOB_POST_ID, BOB_ID, "Robotics study circle", "Study Partner", ["Python", "Arduino"]],
    ["cccccccc-cccc-4ccc-8ccc-cccccccccccc", "33333333-3333-4333-8333-333333333333", "Design exchange workshop", "Skill Sharing", ["Figma", "UI, Design"]],
    ["dddddddd-dddd-4ddd-8ddd-dddddddddddd", ALICE_ID, "Community meetup volunteers", "Other", ["Public Speaking"]],
  ];
  for (const [id, user_id, title, category, skills_required] of definitionsPosts) {
    posts.set(id, generated("posts", {
      id, user_id, title, category, skills_required,
      description: "A fictional collaboration opportunity for browser journey testing. No real campus or student records are used.",
      created_at: now(), updated_at: now(),
    }));
  }
  return { users, profiles, posts, sessions, controls: [] };
}

function matches(row, url) {
  for (const [key, expression] of url.searchParams) {
    if (["select", "order", "limit", "offset", "columns"].includes(key)) continue;
    if (!(key in row)) throw new FixtureError(400, "42703", "Unknown fixture column.");
    const dot = expression.indexOf(".");
    const operator = expression.slice(0, dot), value = expression.slice(dot + 1);
    if (operator === "eq" || operator === "neq") {
      if (typeof row[key] === "number" && !/^-?\d+$/.test(value)) throw new FixtureError(400, "22P02", "Invalid integer filter.");
      const equal = String(row[key]) === value;
      if ((operator === "eq" && !equal) || (operator === "neq" && equal)) return false;
    } else if (operator === "in") {
      const list = parseTextArray(`{${value.slice(1, -1)}}`);
      if (!list.includes(String(row[key]))) return false;
    } else if (operator === "ilike") {
      if (!ilikeMatches(row[key], value)) return false;
    } else if (operator === "cs") {
      if (!Array.isArray(row[key]) || !parseTextArray(value).every((tag) => row[key].includes(tag))) return false;
    } else if (operator === "is") {
      if (value === "null" ? row[key] !== null : String(row[key]) !== value) return false;
    } else throw new FixtureError(400, "PGRST100", "Unsupported fixture filter.");
  }
  return true;
}

async function readBody(request) {
  let content = "";
  for await (const chunk of request) {
    content += chunk;
    if (content.length > 1_000_000) throw new FixtureError(413, "fixture_limit", "Fixture body limit exceeded.");
  }
  if (!content) return {};
  try { return JSON.parse(content); } catch { throw new FixtureError(400, "invalid_json", "Invalid fixture JSON."); }
}

function send(response, status, body, extraHeaders = {}, method = "GET") {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders });
  response.end(status === 204 || method === "HEAD" ? undefined : JSON.stringify(body));
}

export function createFixtureServer({ password, jwtSecret = randomBytes(32).toString("hex") }) {
  if (!password || password.length < 12) throw new Error("An ephemeral test password is required.");
  let state = createState(password);
  const session = (user) => {
    const issued = Math.floor(Date.now() / 1000), expires = issued + 3600;
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
      iss: `http://127.0.0.1:${FIXTURE_PORT}/auth/v1`, sub: user.id, aud: "authenticated",
      role: "authenticated", email: user.email, iat: issued, exp: expires,
      app_metadata: user.app_metadata, user_metadata: user.user_metadata, aal: "aal1",
    })}`;
    const access_token = `${unsigned}.${createHmac("sha256", jwtSecret).update(unsigned).digest("base64url")}`;
    const refresh_token = randomBytes(32).toString("base64url");
    state.sessions.set(refresh_token, user.id);
    return { access_token, token_type: "bearer", expires_in: 3600, expires_at: expires, refresh_token, user: clone(user) };
  };
  const identity = (request) => {
    const token = String(request.headers.authorization || "").replace(/^Bearer /i, "");
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
      const signature = createHmac("sha256", jwtSecret).update(`${parts[0]}.${parts[1]}`).digest();
      const supplied = Buffer.from(parts[2], "base64url");
      if (signature.length !== supplied.length || !timingSafeEqual(signature, supplied)) return null;
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      if (payload.exp <= Date.now() / 1000) return null;
      return state.users.get(payload.sub)?.user ?? null;
    } catch { return null; }
  };

  return createServer(async (request, response) => {
    try {
      if (!loopbacks.includes(request.socket.remoteAddress)) deny();
      if (![ `127.0.0.1:${FIXTURE_PORT}`, `localhost:${FIXTURE_PORT}` ].includes(request.headers.host)) deny();
      const origin = request.headers.origin;
      if (origin && !allowedOrigins.includes(origin)) deny();
      if (origin) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Vary", "Origin");
      }
      response.setHeader("Access-Control-Allow-Headers", "authorization,apikey,content-type,x-client-info,prefer,range,range-unit,accept-profile,content-profile,x-retry-count,x-supabase-api-version");
      response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS");
      response.setHeader("Access-Control-Expose-Headers", "content-range");
      if (request.method === "OPTIONS") return send(response, 204, null);
      const url = new URL(request.url, `http://127.0.0.1:${FIXTURE_PORT}`);
      if (url.pathname === "/health") return send(response, 200, { fixture: "campusconnect-test-only" });

      if (url.pathname === "/__control") {
        if (request.method === "GET") {
          return send(response, 200, {
            usersCount: state.users.size,
            profiles: [...state.profiles.values()].map((profile) => {
              const result = clone(profile);
              delete result.email;
              return result;
            }),
            posts: [...state.posts.values()],
          });
        }
        if (request.method !== "POST") throw new FixtureError(405, "fixture_method", "Use POST for fixture controls.");
        const command = await readBody(request);
        if (command.action === "reset") state = createState(password);
        else if (["fail", "delay"].includes(command.action) && typeof command.path === "string" && command.path.startsWith("/rest/v1/")) {
          state.controls.push({
            action: command.action, path: command.path, method: command.method || "GET",
            query: command.query || {}, remaining: Math.min(20, Math.max(1, Number(command.times) || 1)),
            ms: Math.min(10_000, Math.max(0, Number(command.ms) || 1000)),
            status: [400, 403, 404, 409, 422, 429, 500, 503].includes(command.status) ? command.status : 500,
          });
        } else throw new FixtureError(400, "fixture_control", "Unsupported fixture control.");
        return send(response, 200, { ok: true });
      }
      if (request.headers.apikey !== FIXTURE_PUBLIC_KEY) deny();
      const control = state.controls.find((item) => item.remaining > 0 && item.path === url.pathname
        && item.method === request.method && Object.entries(item.query).every(([key, value]) => url.searchParams.get(key) === value));
      if (control) {
        control.remaining -= 1;
        if (control.action === "fail") throw new FixtureError(control.status, "fixture_failure", "Deliberate test fixture failure.");
        await new Promise((done) => setTimeout(done, control.ms));
      }

      if (url.pathname.startsWith("/auth/v1/")) {
        const endpoint = url.pathname.slice("/auth/v1/".length);
        if (endpoint === "token" && request.method === "POST") {
          const body = await readBody(request);
          let record;
          if (url.searchParams.get("grant_type") === "refresh_token") {
            record = state.users.get(state.sessions.get(body.refresh_token));
          } else {
            record = [...state.users.values()].find((entry) => entry.user.email.toLowerCase() === String(body.email).toLowerCase() && entry.password === body.password);
          }
          if (!record) throw new FixtureError(400, "invalid_credentials", "Invalid fixture credentials.");
          return send(response, 200, session(record.user));
        }
        if (endpoint === "signup" && request.method === "POST") {
          const body = await readBody(request);
          if (typeof body.email !== "string" || !body.email.endsWith("@fixture.example.edu") || typeof body.password !== "string" || body.password.length < 8) {
            throw new FixtureError(400, "validation_failed", "Use a fictional fixture account.");
          }
          if ([...state.users.values()].some((entry) => entry.user.email.toLowerCase() === body.email.toLowerCase())) {
            throw new FixtureError(422, "user_already_exists", "Fixture account already exists.");
          }
          const id = randomUUID(), metadata = body.data || {};
          const profile = makeProfile(id, body.email, metadata);
          validate("profiles", profile);
          const user = makeUser(id, body.email, metadata);
          state.users.set(id, { user, password: body.password });
          state.profiles.set(id, profile);
          // Deliberately simulates email-confirmation-disabled signup only.
          return send(response, 200, session(user));
        }
        const user = identity(request);
        if (!user) throw new FixtureError(401, "bad_jwt", "Fixture session is missing or expired.");
        if (endpoint === "user" && request.method === "GET") return send(response, 200, clone(user));
        if (endpoint === "logout" && request.method === "POST") {
          for (const [token, id] of state.sessions) if (id === user.id) state.sessions.delete(token);
          return send(response, 204, null);
        }
        throw new FixtureError(404, "fixture_auth", "Unsupported fixture Auth endpoint.");
      }

      const table = url.pathname.match(/^\/rest\/v1\/(profiles|posts)$/)?.[1];
      if (!table) throw new FixtureError(404, "fixture_path", "Unsupported test fixture endpoint.");
      const user = identity(request);
      if (!user) deny();
      const selection = url.searchParams.get("select") || "*";
      if (table === "profiles" && (selection.includes("*") || selection.split(",").includes("email") || url.searchParams.has("email"))) deny();
      const store = state[table];
      let rows = [...store.values()].filter((row) => matches(row, url));
      const method = request.method;
      if (!["GET", "HEAD"].includes(method)) {
        const body = await readBody(request);
        if (method === "POST") {
          if (table !== "posts") deny();
          const entries = Array.isArray(body) ? body : [body];
          rows = entries.map((entry) => {
            if (entry.user_id !== user.id || Object.keys(entry).some((key) => ![...postKeys, "user_id"].includes(key))) deny();
            const row = generated(table, { id: randomUUID(), skills_required: [], ...entry, created_at: now(), updated_at: now() });
            validate(table, row);
            return row;
          });
          rows.forEach((row) => store.set(row.id, row));
        } else if (method === "PATCH") {
          const editable = table === "profiles" ? profileKeys : postKeys;
          if (Object.keys(body).some((key) => !editable.includes(key))) deny();
          rows = rows.filter((row) => (table === "profiles" ? row.id : row.user_id) === user.id).map((row) => {
            const updated = generated(table, { ...clone(row), ...body, updated_at: now() });
            validate(table, updated);
            return updated;
          });
          rows.forEach((row) => store.set(row.id, row));
        } else if (method === "DELETE") {
          if (table !== "posts") deny();
          rows = rows.filter((row) => row.user_id === user.id);
          rows.forEach((row) => store.delete(row.id));
        } else throw new FixtureError(405, "fixture_method", "Unsupported fixture method.");
        if (!String(request.headers.prefer).includes("return=representation")) return send(response, method === "POST" ? 201 : 204, null);
      }
      const total = rows.length;
      const order = url.searchParams.get("order");
      if (order) rows.sort((a, b) => {
        for (const term of order.split(",")) {
          const [key, direction] = term.split(".");
          const result = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
          if (result) return direction === "desc" ? -result : result;
        }
        return 0;
      });
      let offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
      let limit = Math.min(1000, Math.max(0, Number(url.searchParams.get("limit") ?? 1000)));
      if (request.headers.range) {
        const [start, end] = String(request.headers.range).split("-").map(Number);
        offset = start || 0; limit = Number.isFinite(end) ? end - offset + 1 : 1000;
      }
      rows = rows.slice(offset, offset + limit);
      const projected = rows.map((row) => selection === "*" ? clone(row)
        : Object.fromEntries(selection.split(",").map((column) => {
          if (!(column in row)) throw new FixtureError(400, "42703", "Unknown fixture selection.");
          return [column, clone(row[column])];
        })));
      const headers = { "Content-Range": `${rows.length ? `${offset}-${offset + rows.length - 1}` : "*"}/${total}` };
      if (String(request.headers.accept).includes("application/vnd.pgrst.object+json")) {
        if (projected.length !== 1) return send(response, 406, {
          code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned",
          details: `The result contains ${projected.length} rows`, hint: null,
        }, headers, method);
        return send(response, method === "POST" ? 201 : 200, projected[0], headers, method);
      }
      return send(response, method === "POST" ? 201 : 200, projected, headers, method);
    } catch (error) {
      const known = error instanceof FixtureError;
      // Do not log request bodies, Auth headers, tokens, or session credentials.
      return send(response, known ? error.status : 500, {
        code: known ? error.code : "fixture_error",
        error_code: known ? error.code : "fixture_error",
        msg: known ? error.message : "Unexpected test fixture error.",
        message: known ? error.message : "Unexpected test fixture error.",
        details: null, hint: null,
      }, {}, request.method);
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.env.CAMPUSCONNECT_E2E !== "1") {
    console.error("Refusing to start the test fixture outside CAMPUSCONNECT_E2E=1.");
    process.exitCode = 1;
  } else {
    const server = createFixtureServer({ password: process.env.CAMPUSCONNECT_TEST_PASSWORD });
    server.on("error", () => {
      console.error("Test fixture could not bind its dedicated loopback port.");
      process.exitCode = 1;
    });
    server.listen(FIXTURE_PORT, "127.0.0.1", () => {
      console.log("TEST ONLY: Supabase UI fixture listening on 127.0.0.1:54329; no real database is connected.");
    });
    const shutdown = () => server.close(() => process.exit(0));
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  }
}
