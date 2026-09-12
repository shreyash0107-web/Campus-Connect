import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

// These tests exercise actual Next pages/actions against a TEST HTTP fixture.
// They do not verify PostgreSQL, Supabase RLS, real Auth, or email delivery.
const FIXTURE = "http://127.0.0.1:54329";
const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const BOB_POST = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const browserErrors = new WeakMap<Page, string[]>();

function password() {
  const value = process.env.CAMPUSCONNECT_TEST_PASSWORD;
  if (!value) throw new Error("Run this suite with its fixture Playwright configuration.");
  return value;
}
async function control(request: APIRequestContext, command: Record<string, unknown>) {
  const response = await request.post(`${FIXTURE}/__control`, { data: command });
  expect(response.ok()).toBeTruthy();
}
async function snapshot(request: APIRequestContext) {
  const response = await request.get(`${FIXTURE}/__control`);
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{
    usersCount: number;
    profiles: { id: string; full_name: string; branch: string; year: number; skills: string[]; interests: string[]; bio: string }[];
    posts: { id: string; title: string; user_id: string; skills_required: string[] }[];
  }>;
}
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("alice@fixture.example.edu");
  await page.getByLabel("Password", { exact: true }).fill(password());
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome back, Alice" })).toBeVisible();
}
async function addTag(page: Page, label: string, tag: string) {
  const input = page.getByLabel(label, { exact: true });
  await input.fill(tag);
  await input.press("Enter");
  await expect(page.getByRole("button", { name: `Remove ${tag} from ${label}`, exact: true })).toBeVisible();
}
async function applyStudentFilters(page: Page, q = "", branch = "", year = "") {
  const search = page.getByRole("search", { name: "Search students" });
  await search.getByLabel("Search students", { exact: true }).fill(q);
  await search.getByLabel("Branch", { exact: true }).selectOption(branch);
  await search.getByLabel("Year", { exact: true }).selectOption(year);
  await search.getByRole("button", { name: "Apply filters" }).click();
  await expect(search).toHaveAttribute("aria-busy", "false");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === (q || null)
    && url.searchParams.get("branch") === (branch || null) && url.searchParams.get("year") === (year || null));
}
async function applyOpportunityFilters(page: Page, q = "", category = "", skill = "") {
  const search = page.getByRole("search", { name: "Search opportunities" });
  await search.getByLabel("Search opportunities", { exact: true }).fill(q);
  await search.getByLabel("Category", { exact: true }).selectOption(category);
  await search.getByLabel("Required skill", { exact: true }).fill(skill);
  await search.getByRole("button", { name: "Apply filters" }).click();
  await expect(search).toHaveAttribute("aria-busy", "false");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === (q || null)
    && url.searchParams.get("category") === (category || null) && url.searchParams.get("skill") === (skill || null));
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}

test.beforeEach(async ({ page, request }) => {
  await control(request, { action: "reset" });
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
});
test.afterEach(async ({ page }, info) => {
  const expected = info.annotations.filter((annotation) => annotation.type === "expected-console").map((annotation) => annotation.description || "");
  const unexpected = (browserErrors.get(page) || []).filter((message) => !expected.some((part) => part && message.includes(part)));
  expect(unexpected, "Unexpected browser errors (fixture test)").toEqual([]);
});

test("login errors stay actionable and signup creates a profile through the application", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("alice@fixture.example.edu");
  await page.getByLabel("Password", { exact: true }).fill(`${password()}-incorrect`);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("email and password don’t match");
  await page.goto("/signup");
  await page.getByLabel("Full name", { exact: true }).fill("New Journey Student");
  await page.getByLabel("Email address", { exact: true }).fill("new.student@fixture.example.edu");
  await page.getByLabel("Password", { exact: true }).fill(password());
  await page.getByLabel("Branch / course", { exact: true }).selectOption("Design");
  await page.getByLabel("Year of study", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "Create your account", exact: true }).click();
  await expect(page).toHaveURL(/\/profile\?welcome=1$/);
  await expect(page.getByRole("heading", { name: "Make yourself known." })).toBeVisible();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("New Journey Student");
  const state = await snapshot(request);
  expect(state.usersCount).toBe(5);
  expect(state.profiles.find((profile) => profile.full_name === "New Journey Student")).toMatchObject({ branch: "Design", year: 2, skills: [] });
});

test("login persists across routes, profile edits and removable tags save, and logout protects pages", async ({ page, request }) => {
  await login(page);
  for (const [path, heading] of [
    ["/students", "Meet your next collaborator."],
    ["/opportunities", "Find your next thing."],
    ["/create-opportunity", "Put your idea out there."],
    ["/my-opportunities", "Your opportunities."],
    ["/profile", "Your profile, your story."],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await page.getByLabel("Full name", { exact: true }).fill("Alice Updated");
  await page.getByLabel("A little about you", { exact: true }).fill("I am building accessible browser-tested campus tools.");
  await addTag(page, "Skills", "Playwright");
  await addTag(page, "Interests", "Open Source");
  await page.getByRole("button", { name: "Remove TypeScript from Skills", exact: true }).click();
  await page.getByRole("button", { name: "Save Profile", exact: true }).click();
  await expect(page.locator("form").getByText("Your profile is up to date.", { exact: true })).toBeVisible();
  const profile = (await snapshot(request)).profiles.find((entry) => entry.id === ALICE);
  expect(profile).toMatchObject({ full_name: "Alice Updated", skills: ["React", "Playwright"], interests: ["Accessibility", "Open Source"] });
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("Alice Updated");
  await page.goto(`/students/${ALICE}`);
  await expect(page.getByRole("heading", { name: "Alice Updated", exact: true })).toBeVisible();
  await expect(page.getByText("alice@fixture.example.edu", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("student discovery matches names, skills, interests, branch/year and empty states", async ({ page }) => {
  await login(page);
  await page.goto("/students");
  for (const [query, name] of [["Bob", "Bob Robotics"], ["Python", "Bob Robotics"], ["Photography", "Carol Designer"]]) {
    await applyStudentFilters(page, query);
    await expect(page.locator("article.student-card")).toHaveCount(1);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await applyStudentFilters(page, "", "Design", "4");
  await expect(page.getByRole("heading", { name: "Carol Designer", exact: true })).toBeVisible();
  await expect(page.locator("article.student-card")).toHaveCount(1);
  await applyStudentFilters(page, "no-such-fixture-student");
  await expect(page.getByRole("heading", { name: "No students found", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.locator("article.student-card")).toHaveCount(4);
  await page.getByRole("searchbox", { name: "Search students", exact: true }).fill("*");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("search").getByRole("alert")).toContainText("rather than asterisks");
  await page.goto(`/students/${BOB}`);
  await expect(page.getByRole("heading", { name: "Bob Robotics", exact: true })).toBeVisible();
});

test("opportunities support text/category/exact special-character skill filters", async ({ page }) => {
  await login(page);
  await page.goto("/opportunities");
  await applyOpportunityFilters(page, "Robotics", "Study Partner", "Python");
  await expect(page.locator("article.opportunity-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Robotics study circle", exact: true })).toBeVisible();
  await applyOpportunityFilters(page, "Arduino");
  await expect(page.locator("article.opportunity-card")).toHaveCount(1);
  await applyOpportunityFilters(page, "fictional collaboration");
  await expect(page.locator("article.opportunity-card")).toHaveCount(4);
  await applyOpportunityFilters(page, "", "Skill Sharing", "UI, Design");
  await expect(page.getByRole("heading", { name: "Design exchange workshop", exact: true })).toBeVisible();
  await expect(page.locator("article.opportunity-card")).toHaveCount(1);
  await applyOpportunityFilters(page, "", "", "python");
  await expect(page.getByRole("heading", { name: "No opportunities match just yet.", exact: true })).toBeVisible();
  await applyOpportunityFilters(page, "no-such-fixture-opportunity");
  await expect(page.getByRole("heading", { name: "No opportunities match just yet.", exact: true })).toBeVisible();
});

test("create, edit, cancel deletion, and confirmed deletion persist through server actions", async ({ page, request }) => {
  await login(page);
  await page.goto("/create-opportunity");
  await page.getByLabel("Give your opportunity a clear title", { exact: true }).fill("Browser journey collaboration");
  await page.getByLabel("Category", { exact: true }).selectOption("Project");
  await page.getByLabel("Tell us about the opportunity", { exact: true }).fill("We are building a campus collaboration prototype and looking for a teammate to improve keyboard accessibility.");
  await addTag(page, "Skills required", "Playwright");
  await page.getByRole("button", { name: "Publish Opportunity", exact: true }).click();
  await expect(page).toHaveURL(/\/opportunities\/[0-9a-f-]+(?:\?saved=created)?$/);
  await expect(page.getByRole("heading", { name: "Browser journey collaboration", exact: true })).toBeVisible();
  const created = (await snapshot(request)).posts.find((post) => post.title === "Browser journey collaboration");
  expect(created?.user_id).toBe(ALICE);
  await page.getByRole("link", { name: "Edit Opportunity", exact: true }).click();
  await page.getByLabel("Give your opportunity a clear title", { exact: true }).fill("Updated browser journey collaboration");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Updated browser journey collaboration", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("heading", { name: "Delete this opportunity?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Keep opportunity", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect((await snapshot(request)).posts.some((post) => post.id === created?.id)).toBeTruthy();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await dialog.getByRole("button", { name: "Delete opportunity", exact: true }).click();
  await expect(page).toHaveURL(/\/my-opportunities$/);
  expect((await snapshot(request)).posts.some((post) => post.id === created?.id)).toBeFalsy();
});

test("another owner's opportunity has no edit controls and direct edit renders not found", async ({ page }, info) => {
  info.annotations.push({ type: "expected-console", description: "404 (Not Found)" });
  await login(page);
  await page.goto(`/opportunities/${BOB_POST}`);
  await expect(page.getByRole("heading", { name: "Robotics study circle", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit Opportunity", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
  await page.goto(`/opportunities/${BOB_POST}/edit`);
  await expect(page.getByRole("heading", { name: "This page took a different path.", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toHaveCount(0);
});

test("mobile navigation is keyboard operable, closes with Escape, and pages do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await noOverflow(page);
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "CampusConnect navigation" });
  await expect(drawer).toBeVisible();
  const discover = drawer.getByRole("link", { name: "Discover Students", exact: true });
  await discover.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/students$/);
  await expect(drawer).not.toBeVisible();
  await noOverflow(page);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  for (const route of ["/profile", "/opportunities", "/create-opportunity"]) {
    await page.goto(route);
    await noOverflow(page);
  }
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/dashboard", "/students", "/opportunities", "/my-opportunities", "/profile", "/create-opportunity", `/opportunities/${BOB_POST}`, `/students/${BOB}`]) {
      await page.goto(route);
      await noOverflow(page);
    }
  }
  await page.goto("/dashboard");
  await page.screenshot({ path: "test-results/dashboard-desktop.png", fullPage: true });
});

test("delayed search exposes a pending state and a controlled failure shows recovery UI", async ({ page, request }, info) => {
  info.annotations.push({ type: "expected-console", description: "Unable to find students." });
  await login(page);
  await page.goto("/students");
  await control(request, {
    action: "delay", path: "/rest/v1/profiles", query: { search_text: "ilike.%Python%" }, ms: 2000,
  });
  await page.getByRole("searchbox", { name: "Search students", exact: true }).fill("Python");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("button", { name: "Searching…" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Bob Robotics", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply filters" })).toBeEnabled();
  await control(request, {
    action: "fail", path: "/rest/v1/profiles", query: { search_text: "ilike.%fixturefailure%" }, times: 3,
  });
  await page.getByRole("searchbox", { name: "Search students", exact: true }).fill("fixturefailure");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("heading", { name: "We couldn’t load this right now.", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  // Reset consumes all faults; fresh navigation verifies that the app recovers.
  await control(request, { action: "reset" });
  await login(page);
  await page.goto("/students");
  await expect(page.locator("article.student-card")).toHaveCount(4);
});
