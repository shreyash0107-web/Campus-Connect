// Runs against a REAL disposable development Supabase project, not a mock.
// All application operations use anonymous-key clients authenticated as users;
// the service-role client is used only for fixture creation and cleanup.
import { randomBytes, randomUUID } from "node:crypto";

const PROFILE_COLUMNS = "id,full_name,branch,year,bio,skills,interests,avatar_url,created_at,updated_at,search_text";
const POST_COLUMNS = "id,user_id,title,description,category,skills_required,created_at,updated_at,search_text";
class CheckFailure extends Error {}

function assert(condition, label) {
  if (!condition) throw new CheckFailure(label);
}

function successful(result, label) {
  assert(!result.error, `${label}: request failed (server details suppressed).`);
  return result.data;
}

function permissionDenied(result, label) {
  assert(result.error?.code === "42501", `${label}: expected a database permission denial.`);
}

function rowWriteDenied(result, label) {
  assert(
    result.error?.code === "42501" || (!result.error && Array.isArray(result.data) && result.data.length === 0),
    `${label}: another user's row was writable, or the request failed unexpectedly.`,
  );
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}
function textArrayLiteral(values) {
  return `{${values.map((value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
}

function configured(name, alternate) {
  const value = process.env[name] || (alternate && process.env[alternate]);
  assert(value, `Missing ${name}.`);
  return value;
}

async function main() {
  if (process.env.CHECK_BACKEND !== "true") {
    console.log("Skipped live backend checks. Set CHECK_BACKEND=true only for a disposable development project.");
    return;
  }
  const url = configured("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const anonymousKey = configured("NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = configured("SUPABASE_SERVICE_ROLE_KEY");
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new CheckFailure("The Supabase URL is invalid.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname);
  assert(
    !parsedUrl.username && !parsedUrl.password
      && (parsedUrl.protocol === "https:" || (local && parsedUrl.protocol === "http:")),
    "Use an HTTPS Supabase URL, or HTTP only for a local instance.",
  );
  assert(anonymousKey !== serviceKey, "The public and service-role keys must be different.");
  const { createClient } = await import("@supabase/supabase-js");
  const options = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30_000) }) },
  };
  const admin = createClient(url, serviceKey, options);
  const anonymous = createClient(url, anonymousKey, options);
  const clientA = createClient(url, anonymousKey, options);
  const clientB = createClient(url, anonymousKey, options);
  const runId = randomUUID();
  console.log(`Backend check fixture run ID (not a credential): ${runId}`);
  const marker = runId.replaceAll("-", "").slice(0, 16);
  const skill = `check-${marker}`;
  const literalTag = "literal%_\\tag";
  const specialTags = ["UI, Design", 'a"b', "a\\b", "{tag}", "NULL"];
  const password = `${randomBytes(36).toString("base64url")}aA1!`;
  const createdUsers = [];
  const metadata = [
    { full_name: "Campus Check A", branch: "Computer Science", year: 3 },
    { full_name: { invalid: true }, branch: ["invalid"], year: "999999999999999999999" },
  ];
  let failure = null;

  try {
    for (let index = 0; index < 2; index += 1) {
      const email = `cc-check-${runId}-${index}@checks.example.edu`;
      const data = successful(await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata[index],
        app_metadata: { campusconnect_check: runId },
      }), "Create temporary Auth fixture");
      assert(data.user?.id, "Auth did not return a temporary fixture ID.");
      createdUsers.push({ id: data.user.id, email });
    }
    const [userA, userB] = createdUsers;
    for (const [client, user] of [[clientA, userA], [clientB, userB]]) {
      const login = successful(await client.auth.signInWithPassword({ email: user.email, password }), "Password login");
      assert(login.user?.id === user.id && login.session, "Password login did not establish the expected session.");
      const verified = successful(await client.auth.getUser(), "Verified Auth identity");
      assert(verified.user?.id === user.id, "Verified Auth identity did not match the fixture.");
    }
    console.log("PASS: confirmed Auth accounts can sign in with independently isolated public clients.");

    const initialA = successful(await clientA.from("profiles").select(PROFILE_COLUMNS).eq("id", userA.id).single(), "Read trigger-created profile");
    const initialB = successful(await clientB.from("profiles").select(PROFILE_COLUMNS).eq("id", userB.id).single(), "Read malformed-metadata profile");
    assert(initialA.full_name === "Campus Check A" && initialA.branch === "Computer Science" && initialA.year === 3, "Valid signup metadata was not provisioned.");
    assert(initialB.full_name === "New student" && initialB.branch === "Undeclared" && initialB.year === 1, "Malformed signup metadata did not receive safe defaults.");
    assert(initialA.bio === "" && initialA.skills.length === 0 && initialA.interests.length === 0, "Profile defaults were not provisioned.");
    assert(!("email" in initialA) && !("email" in initialB), "Public profile results unexpectedly contain email.");
    permissionDenied(await clientA.from("profiles").select("email").eq("id", userA.id), "Read own stored email");
    permissionDenied(await clientA.from("profiles").select("email").eq("id", userB.id), "Read another student's stored email");
    // Intentional negative test: production application code must never do this.
    permissionDenied(await clientA.from("profiles").select("*").eq("id", userA.id), "Wildcard profile selection");
    console.log("PASS: signup provisioning tolerates malformed metadata; public-column reads work and email/SELECT * are denied.");

    const editableA = {
      full_name: `Check ${marker} A`,
      branch: "Backend Check",
      year: 3,
      bio: "A temporary profile owned by this integration run.",
      skills: [skill, literalTag],
      interests: ["Testing"],
      avatar_url: null,
    };
    const updatedA = successful(await clientA.from("profiles").update(editableA).eq("id", userA.id).select(PROFILE_COLUMNS).single(), "Own profile update");
    assert(updatedA.bio === editableA.bio && updatedA.skills.includes(skill), "Own profile update was not persisted.");
    assert(updatedA.created_at === initialA.created_at && Date.parse(updatedA.updated_at) >= Date.parse(initialA.updated_at), "Profile timestamp invariants failed.");
    assert(updatedA.search_text.includes(skill), "Generated student search text did not update.");
    successful(await clientB.from("profiles").update({
      full_name: `Check ${marker} B`,
      branch: "Backend Check",
      year: 4,
      skills: [skill, "literalXYtag"],
      interests: ["Testing"],
    }).eq("id", userB.id).select("id").single(), "Second user's own profile update");

    rowWriteDenied(await clientA.from("profiles").update({ bio: "Unauthorized change" }).eq("id", userB.id).select("id"), "Cross-user profile update");
    const untouchedB = successful(await clientB.from("profiles").select("bio").eq("id", userB.id).single(), "Recheck cross-user profile");
    assert(untouchedB.bio === initialB.bio, "Cross-user profile update changed the victim's data.");
    for (const forbidden of [
      { id: randomUUID() },
      { email: "forbidden@checks.example.edu" },
      { created_at: "2000-01-01T00:00:00Z" },
      { updated_at: "2000-01-01T00:00:00Z" },
    ]) {
      permissionDenied(await clientA.from("profiles").update(forbidden).eq("id", userA.id).select("id"), "Protected profile-column update");
    }
    const profileGeneratedWrite = await clientA.from("profiles").update({ search_text: "forbidden" }).eq("id", userA.id);
    assert(["42501", "428C9"].includes(profileGeneratedWrite.error?.code), "Generated profile search text was writable.");
    permissionDenied(await clientA.from("profiles").delete().eq("id", userA.id).select("id"), "Direct profile deletion");
    permissionDenied(await clientA.from("profiles").insert({
      id: randomUUID(), full_name: "Invalid Insert", email: "forbidden@checks.example.edu", branch: "Backend Check", year: 1,
    }).select("id"), "Direct profile insertion");
    assert((await clientA.from("profiles").update({ skills: Array(13).fill("tag") }).eq("id", userA.id)).error?.code === "23514", "Tag cardinality limit was not enforced.");
    assert((await clientA.from("profiles").update({ interests: ["x".repeat(33)] }).eq("id", userA.id)).error?.code === "23514", "Tag length limit was not enforced.");
    assert((await clientA.from("profiles").update({ year: 7 }).eq("id", userA.id)).error?.code === "23514", "Year limit was not enforced.");
    console.log("PASS: own profile edits work; cross-user writes, protected columns, and malformed fields are blocked.");

    const studentSearch = await clientA.from("profiles").select(PROFILE_COLUMNS, { count: "exact" })
      .ilike("search_text", `%${escapeLike(skill)}%`).eq("branch", "Backend Check").eq("year", 3)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(0, 11);
    const matchingStudents = successful(studentSearch, "Student search and filters");
    assert(studentSearch.count === 1 && matchingStudents.length === 1 && matchingStudents[0].id === userA.id, "Student search/filter/count mismatch.");
    const literalStudents = successful(await clientA.from("profiles").select("id")
      .ilike("search_text", `%${escapeLike(literalTag)}%`).in("id", [userA.id, userB.id]), "Literal student wildcard search");
    assert(literalStudents.length === 1 && literalStudents[0].id === userA.id, "Student wildcard escaping did not preserve literal matching.");

    const postPayload = {
      user_id: userA.id,
      title: `Backend check ${marker}`,
      description: "A temporary collaboration opportunity used to verify database ownership and search behavior.",
      category: "Project",
      skills_required: [skill, literalTag, ...specialTags],
    };
    const post = successful(await clientA.from("posts").insert(postPayload).select(POST_COLUMNS).single(), "Create own opportunity");
    assert(post.user_id === userA.id && post.search_text.includes(skill), "Opportunity ownership/search text was not initialized.");
    const editedPost = successful(await clientA.from("posts").update({
      title: `Updated check ${marker}`,
      description: "This opportunity has been edited by its owner to verify that updates persist and remain searchable.",
      category: "Skill Sharing",
    }).eq("id", post.id).select(POST_COLUMNS).single(), "Edit own opportunity");
    assert(editedPost.title.startsWith("Updated check") && editedPost.category === "Skill Sharing", "Opportunity edit was not persisted.");
    assert(editedPost.created_at === post.created_at && Date.parse(editedPost.updated_at) >= Date.parse(post.updated_at), "Post timestamp invariants failed.");
    rowWriteDenied(await clientB.from("posts").update({ title: "Unauthorized update" }).eq("id", post.id).select("id"), "Cross-user opportunity update");
    rowWriteDenied(await clientB.from("posts").delete().eq("id", post.id).select("id"), "Cross-user opportunity deletion");
    permissionDenied(await clientB.from("posts").insert(postPayload).select("id"), "Opportunity insertion with another user's ownership");
    for (const forbidden of [
      { id: randomUUID() },
      { user_id: userB.id },
      { created_at: "2000-01-01T00:00:00Z" },
      { updated_at: "2000-01-01T00:00:00Z" },
    ]) {
      permissionDenied(await clientA.from("posts").update(forbidden).eq("id", post.id).select("id"), "Protected post-column update");
    }
    const postGeneratedWrite = await clientA.from("posts").update({ search_text: "forbidden" }).eq("id", post.id);
    assert(["42501", "428C9"].includes(postGeneratedWrite.error?.code), "Generated opportunity search text was writable.");
    assert((await clientA.from("posts").update({ title: "Short" }).eq("id", post.id)).error?.code === "23514", "Post title length limit was not enforced.");
    assert((await clientA.from("posts").update({ category: "Unknown" }).eq("id", post.id)).error?.code === "23514", "Post category limit was not enforced.");
    const stillOwned = successful(await clientA.from("posts").select("user_id,title").eq("id", post.id).single(), "Recheck cross-user opportunity");
    assert(stillOwned.user_id === userA.id && stillOwned.title === editedPost.title, "Cross-user opportunity writes changed the row.");
    console.log("PASS: own opportunity creation/editing works; cross-user writes and ownership/timestamp reassignment are blocked.");

    const opportunitySearch = await clientB.from("posts").select(POST_COLUMNS, { count: "exact" })
      .ilike("search_text", `%${escapeLike(marker)}%`).eq("category", "Skill Sharing")
      .contains("skills_required", textArrayLiteral([skill]))
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(0, 11);
    const matchingPosts = successful(opportunitySearch, "Opportunity search and filters");
    assert(opportunitySearch.count === 1 && matchingPosts.length === 1 && matchingPosts[0].id === post.id, "Opportunity search/filter/count mismatch.");
    for (const tag of specialTags) {
      const tagged = successful(await clientB.from("posts").select("id").eq("user_id", userA.id)
        .contains("skills_required", textArrayLiteral([tag])), "Special-character required-skill filtering");
      assert(tagged.length === 1 && tagged[0].id === post.id, "Quoted tag-array filtering did not preserve the exact tag.");
    }
    const literalPosts = successful(await clientB.from("posts").select("id").eq("user_id", userA.id)
      .ilike("search_text", `%${escapeLike(literalTag)}%`), "Literal opportunity wildcard search");
    assert(literalPosts.length === 1 && literalPosts[0].id === post.id, "Opportunity wildcard escaping did not preserve literal matching.");
    const wrongCategory = successful(await clientB.from("posts").select("id").eq("user_id", userA.id).eq("category", "Other"), "Nonmatching category filter");
    assert(wrongCategory.length === 0, "Nonmatching category filter returned the opportunity.");

    // Generate enough temporary rows to verify real 12-row pagination and count.
    successful(await clientA.from("posts").insert(Array.from({ length: 12 }, (_, index) => ({
      user_id: userA.id,
      title: `Paging fixture ${marker} ${index}`,
      description: "An additional temporary opportunity used only to test page boundaries and exact counts.",
      category: "Other",
      skills_required: [skill],
    }))).select("id"), "Create pagination fixtures");
    const pageQuery = () => clientA.from("posts").select("id,created_at", { count: "exact" }).eq("user_id", userA.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false });
    const firstPage = await pageQuery().range(0, 11);
    const secondPage = await pageQuery().range(12, 23);
    const firstRows = successful(firstPage, "First opportunity page");
    const secondRows = successful(secondPage, "Second opportunity page");
    assert(firstPage.count === 13 && secondPage.count === 13 && firstRows.length === 12 && secondRows.length === 1, "Pagination sizes or exact counts were incorrect.");
    assert(!firstRows.some((row) => row.id === secondRows[0].id), "Pagination repeated a row across pages.");
    console.log("PASS: literal substring search, student filters, category/skill filters, exact counts, and 12-row pagination work.");

    permissionDenied(await anonymous.from("profiles").select(PROFILE_COLUMNS).limit(1), "Anonymous student read");
    permissionDenied(await anonymous.from("profiles").select("email").limit(1), "Anonymous email read");
    permissionDenied(await anonymous.from("posts").select(POST_COLUMNS).limit(1), "Anonymous opportunity read");
    permissionDenied(await anonymous.from("profiles").update({ bio: "Anonymous change" }).eq("id", userA.id).select("id"), "Anonymous profile update");
    permissionDenied(await anonymous.from("posts").insert(postPayload).select("id"), "Anonymous opportunity creation");
    const deleted = successful(await clientA.from("posts").delete().eq("id", post.id).select("id"), "Delete own opportunity");
    assert(deleted.length === 1, "The owner could not delete their opportunity.");
    const afterDelete = successful(await clientB.from("posts").select("id").eq("id", post.id), "Read deleted opportunity");
    assert(afterDelete.length === 0, "Deleted opportunity is still visible.");
    console.log("PASS: anonymous data access is denied and owner deletion persists.");
  } catch (error) {
    failure = error instanceof CheckFailure ? error : new CheckFailure("Unexpected backend-check failure; details suppressed to protect credentials.");
  } finally {
    // Only IDs returned by createUser in THIS run are eligible for deletion.
    // Check trusted ownership metadata again; never delete by email or prefix.
    for (const user of createdUsers) {
      try {
        const verified = successful(await admin.auth.admin.getUserById(user.id), "Verify cleanup ownership").user;
        assert(verified?.app_metadata?.campusconnect_check === runId, "Cleanup ownership marker did not match.");
        successful(await admin.auth.admin.deleteUser(user.id), "Delete temporary Auth fixture");
        const remainingProfile = successful(await admin.from("profiles").select("id").eq("id", user.id), "Verify profile cascade cleanup");
        const remainingPosts = successful(await admin.from("posts").select("id").eq("user_id", user.id), "Verify post cascade cleanup");
        assert(remainingProfile.length === 0 && remainingPosts.length === 0, "Temporary fixture cascade cleanup failed.");
      } catch {
        console.error("Cleanup could not be verified for an account created by this run. Inspect Auth app_metadata.campusconnect_check before any manual removal.");
        failure ??= new CheckFailure("Temporary fixture cleanup was incomplete.");
      }
    }
    if (createdUsers.length > 0 && !failure) {
      console.log("PASS: this run's two temporary accounts and their dependent profiles/posts were cleaned up.");
    }
  }
  if (failure) throw failure;
  console.log("Live backend integration checks passed. Email delivery, SSR cookies, browser flows, and deployment are separate checks.");
}

main().catch((error) => {
  console.error(error instanceof CheckFailure ? error.message : "Backend checks failed unexpectedly. Details suppressed to protect credentials.");
  process.exitCode = 1;
});
