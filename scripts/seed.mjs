// Backend-only script. Never import this module into the application.
const SEED_VERSION = "campusconnect-demo-v1";
const profiles = [
  {
    email: "maya.chen@students.example.edu",
    full_name: "Maya Chen",
    branch: "Computer Science",
    year: 3,
    bio: "Fictional demo profile. Building accessible web tools and looking for thoughtful collaborators.",
    skills: ["React", "TypeScript", "UI Design"],
    interests: ["Accessibility", "Hackathons"],
    post: {
      id: "5ee00000-0000-4000-8000-000000000001",
      title: "Build a more accessible campus map",
      description: "Looking for a small team to prototype an accessible campus navigation experience. We will research student needs, map routes, and build a responsive web application together.",
      category: "Project",
      skills_required: ["React", "UI Design"],
    },
  },
  {
    email: "arjun.patel@students.example.edu",
    full_name: "Arjun Patel",
    branch: "Computer Science",
    year: 2,
    bio: "Fictional demo profile. Learning algorithms through practice, discussion, and shared notes.",
    skills: ["Python", "C++", "Data Structures"],
    interests: ["Competitive Programming", "Study Groups"],
    post: {
      id: "5ee00000-0000-4000-8000-000000000002",
      title: "Weekly data structures study circle",
      description: "Preparing for data structures exams with a friendly weekly practice group. Bring a problem you found interesting and we will work through the reasoning, not just the final answer.",
      category: "Study Partner",
      skills_required: ["Data Structures", "Python"],
    },
  },
  {
    email: "sofia.rivera@students.example.edu",
    full_name: "Sofia Rivera",
    branch: "Design",
    year: 3,
    bio: "Fictional demo profile. Interested in design systems, student communities, and approachable interfaces.",
    skills: ["Figma", "UI Design", "User Research"],
    interests: ["Design Systems", "Accessibility"],
    post: {
      id: "5ee00000-0000-4000-8000-000000000003",
      title: "Trade Figma tips for frontend practice",
      description: "I can share a practical introduction to Figma components and interaction design. In exchange, I would love help turning a small design into a clean, responsive React interface.",
      category: "Skill Sharing",
      skills_required: ["React", "CSS"],
    },
  },
  {
    email: "noah.williams@students.example.edu",
    full_name: "Noah Williams",
    branch: "Electronics & Communication",
    year: 4,
    bio: "Fictional demo profile. Exploring useful hardware projects and low-cost environmental sensors.",
    skills: ["Arduino", "Python", "IoT"],
    interests: ["Sustainability", "Robotics"],
    post: {
      id: "5ee00000-0000-4000-8000-000000000004",
      title: "Prototype a campus air quality sensor",
      description: "Forming a team to build a low-cost air quality monitor and a simple data dashboard. Beginners are welcome; we will split the project into hardware, data collection, and visualization.",
      category: "Project",
      skills_required: ["Arduino", "Python", "Data Visualization"],
    },
  },
  {
    email: "leila.hassan@students.example.edu",
    full_name: "Leila Hassan",
    branch: "Sciences",
    year: 2,
    bio: "Fictional demo profile. Enjoys making difficult concepts easier to discuss and understand.",
    skills: ["Statistics", "Python", "LaTeX"],
    interests: ["Data Science", "Peer Learning"],
    post: {
      id: "5ee00000-0000-4000-8000-000000000005",
      title: "Find a probability revision partner",
      description: "Looking for one or two classmates to review probability distributions and work through practice questions. We can meet twice a week and keep a shared set of explanations and examples.",
      category: "Study Partner",
      skills_required: ["Statistics"],
    },
  },
  {
    email: "ethan.park@students.example.edu",
    full_name: "Ethan Park",
    branch: "Business & Management",
    year: 1,
    bio: "Fictional demo profile. Helping new students find communities and try their first collaborative project.",
    skills: ["Public Speaking", "Project Management"],
    interests: ["Entrepreneurship", "Student Communities"],
    post: {
      id: "5ee00000-0000-4000-8000-000000000006",
      title: "Start a welcoming student maker meetup",
      description: "Help shape an informal meetup where students share small projects, ask questions, and meet potential collaborators. We are looking for volunteers to plan a beginner-friendly first event.",
      category: "Other",
      skills_required: ["Project Management", "Public Speaking"],
    },
  },
];

class SeedFailure extends Error {}

function requireValue(value, name) {
  if (!value) throw new SeedFailure(`Missing ${name}.`);
  return value;
}

function check(result, operation) {
  if (result.error) {
    throw new SeedFailure(`${operation} failed. Inspect your Supabase configuration; server error details are intentionally suppressed.`);
  }
  return result.data;
}

function validateUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new SeedFailure("The Supabase URL is invalid.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new SeedFailure("Use an HTTPS Supabase URL, or HTTP only for a local instance.");
  }
}

async function main() {
  if (process.env.SEED_DEMO !== "true") {
    console.log("Skipped demo seed. Set SEED_DEMO=true only for a disposable development project.");
    return;
  }
  const url = requireValue(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const key = requireValue(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  const password = requireValue(process.env.DEMO_SEED_PASSWORD, "DEMO_SEED_PASSWORD");
  if (password.length < 12) throw new SeedFailure("DEMO_SEED_PASSWORD must contain at least 12 characters and satisfy your Auth password policy.");
  validateUrl(url);
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30_000) }) },
  });

  const wantedEmails = new Set(profiles.map((profile) => profile.email));
  const existingUsers = new Map();
  for (let page = 1; ; page += 1) {
    const { users } = check(await admin.auth.admin.listUsers({ page, perPage: 100 }), "Listing demo account candidates");
    for (const user of users) {
      if (wantedEmails.has(user.email?.toLowerCase())) existingUsers.set(user.email.toLowerCase(), user);
    }
    if (users.length < 100) break;
  }

  // Refuse collisions before changing anything. User-editable metadata is not an
  // ownership signal; only trusted admin app_metadata authorizes seed refreshes.
  for (const user of existingUsers.values()) {
    if (user.app_metadata?.campusconnect_seed !== SEED_VERSION) {
      throw new SeedFailure("A demo email already belongs to an unmarked account. Nothing will be overwritten; resolve the collision manually.");
    }
  }

  let created = 0;
  for (const profile of profiles) {
    let user = existingUsers.get(profile.email);
    if (!user) {
      const data = check(await admin.auth.admin.createUser({
        email: profile.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: profile.full_name, branch: profile.branch, year: profile.year },
        app_metadata: { campusconnect_seed: SEED_VERSION },
      }), "Creating a demo account");
      user = data.user;
      if (!user?.id) throw new SeedFailure("Auth did not return the created demo account.");
      created += 1;
    } else {
      const verified = check(await admin.auth.admin.getUserById(user.id), "Verifying a demo account").user;
      if (verified?.app_metadata?.campusconnect_seed !== SEED_VERSION) {
        throw new SeedFailure("Demo account ownership changed; refusing to overwrite it.");
      }
    }

    const { post } = profile;
    const publicProfile = {
      full_name: profile.full_name,
      branch: profile.branch,
      year: profile.year,
      bio: profile.bio,
      skills: profile.skills,
      interests: profile.interests,
    };
    const updated = check(await admin.from("profiles").update(publicProfile).eq("id", user.id).select("id"), "Refreshing a demo profile");
    if (updated.length !== 1) throw new SeedFailure("The signup trigger did not create a demo profile. Apply the migration before seeding.");

    const existingPost = check(await admin.from("posts").select("id,user_id").eq("id", post.id).maybeSingle(), "Checking demo post ownership");
    if (existingPost && existingPost.user_id !== user.id) {
      throw new SeedFailure("A demo post ID belongs to another account; refusing to overwrite it.");
    }
    check(await admin.from("posts").upsert({ ...post, user_id: user.id }, { onConflict: "id" }), "Refreshing a demo post");
  }
  console.log(`Demo seed completed: ${profiles.length} fictional profiles and ${profiles.length} posts; ${created} accounts newly created.`);
  console.log("Existing marked demo passwords were not changed. Demo profile/post content was refreshed; no accounts were deleted.");
}

main().catch((error) => {
  console.error(error instanceof SeedFailure ? error.message : "Demo seed failed unexpectedly. Details suppressed to protect credentials.");
  console.error("No automatic rollback or deletion was attempted. Resolve the cause and rerun; completed marked records are reusable.");
  process.exitCode = 1;
});
