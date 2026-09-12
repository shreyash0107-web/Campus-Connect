export const CATEGORIES = ["Project", "Study Partner", "Skill Sharing", "Other"] as const;
export const BRANCHES = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "Business & Management", "Design", "Arts & Humanities", "Sciences", "Other",
];
export const YEARS = [1, 2, 3, 4, 5, 6];
export const PAGE_SIZE = 12;
export const PROFILE_COLUMNS = "id,full_name,branch,year,bio,skills,interests,avatar_url,created_at,updated_at" as const;
export const POST_COLUMNS = "id,user_id,title,description,category,skills_required,created_at,updated_at" as const;
