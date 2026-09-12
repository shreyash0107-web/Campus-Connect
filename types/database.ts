export type Profile = {
  id: string;
  full_name: string;
  branch: string;
  year: number;
  bio: string;
  skills: string[];
  interests: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = "Project" | "Study Partner" | "Skill Sharing" | "Other";
export type Post = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: Category;
  skills_required: string[];
  created_at: string;
  updated_at: string;
};
export type Opportunity = Post & { author: Profile | null };

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Profile & { email: string; search_text: string },
        Partial<Profile> & { id: string; email: string; full_name: string; branch: string; year: number },
        Partial<Pick<Profile, "full_name" | "branch" | "year" | "bio" | "skills" | "interests" | "avatar_url">>
      >;
      posts: Table<
        Post & { search_text: string },
        Omit<Post, "id" | "created_at" | "updated_at">,
        Partial<Pick<Post, "title" | "description" | "category" | "skills_required">>
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
