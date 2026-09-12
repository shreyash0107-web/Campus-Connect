import { AuthPage } from "@/components/auth-page";
import { param, type SearchParams } from "@/lib/data";
export const metadata = { title: "Create your account" };
export default async function Signup({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <AuthPage mode="signup" next={param(await searchParams, "next")} />;
}
