import test from "node:test";
import assert from "node:assert/strict";
import { initials, pageNumber, safeNext, searchPattern, textArrayLiteral } from "../lib/utils";
import { loginSchema, opportunitySchema, profileSchema, signupSchema, readTags } from "../lib/validation";

test("initials use the first two names and tolerate empty input", () => {
  assert.equal(initials(" Aanya   Sharma "), "AS");
  assert.equal(initials("Arjun"), "A");
  assert.equal(initials(""), "CC");
});
test("redirects cannot leave the application or enter auth loops", () => {
  for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/login", "/auth/callback", "/signup", "/\n/evil.example", null]) assert.equal(safeNext(value), "/dashboard");
  assert.equal(safeNext("/opportunities?category=Project"), "/opportunities?category=Project");
  assert.equal(safeNext("/profile?welcome=1"), "/profile?welcome=1");
});
test("pagination bounds reject invalid and excessive offsets", () => {
  for (const value of [0, -1, 1.2, "bad", undefined]) assert.equal(pageNumber(value), 1);
  assert.equal(pageNumber("2"), 2);
  assert.equal(pageNumber("999999999"), 10000);
});
test("search wildcards are literal and PostgREST asterisk aliases rejected", () => {
  assert.equal(searchPattern("UI_100%\\work"), "%UI\\_100\\%\\\\work%");
  assert.equal(searchPattern("C++"), "%C++%");
  assert.throws(() => searchPattern("*"));
});
test("PostgreSQL array filters preserve commas, quotes, backslashes, braces, and NULL", () => {
  assert.equal(textArrayLiteral(["UI, Design", 'a"b', "a\\b", "{tag}", "NULL"]), '{"UI, Design","a\\"b","a\\\\b","{tag}","NULL"}');
});
test("signup validates credentials and study year", () => {
  const values = { full_name: "Aanya Sharma", email: "aanya@example.edu", password: "Strong-test-123", branch: "Computer Science", year: "3" };
  assert.equal(signupSchema.safeParse(values).success, true);
  for (const patch of [{ password: "short" }, { email: "bad" }, { year: "1.5" }, { year: "7" }, { full_name: " " }]) assert.equal(signupSchema.safeParse({ ...values, ...patch }).success, false);
  assert.equal(loginSchema.safeParse({ email: values.email, password: "old" }).success, true);
});
test("profile tags and bio have enforced boundaries", () => {
  const values = { full_name: "Maya Chen", branch: "Design", year: 2, bio: "", skills: ["Figma"], interests: [] };
  assert.equal(profileSchema.safeParse(values).success, true);
  for (const patch of [{ bio: "a".repeat(501) }, { skills: Array(13).fill("React") }, { skills: [""] }, { interests: ["a".repeat(33)] }]) assert.equal(profileSchema.safeParse({ ...values, ...patch }).success, false);
});
test("opportunity constraints apply and ownership fields are stripped", () => {
  const values = { title: "A campus project", description: "A clear description with enough context for someone to join.", category: "Project", skills_required: ["React"] };
  const result = opportunitySchema.parse({ ...values, user_id: "attacker", id: "fake" });
  assert.equal("user_id" in result, false);
  for (const patch of [{ title: "Short" }, { description: "Too short" }, { category: "Invalid" }, { skills_required: "React" }]) assert.equal(opportunitySchema.safeParse({ ...values, ...patch }).success, false);
});
test("tag transport rejects malformed payloads", () => {
  const form = new FormData();
  form.set("tags", '["React","Figma"]');
  assert.deepEqual(readTags(form, "tags"), ["React", "Figma"]);
  form.set("tags", "{}");
  assert.equal(readTags(form, "tags"), null);
  form.set("tags", "bad json");
  assert.equal(readTags(form, "tags"), null);
});
