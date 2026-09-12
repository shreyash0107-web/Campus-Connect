import { AuthPage } from "@/components/auth-page";
import { param, type SearchParams } from "@/lib/data";
export const metadata = { title: "Log in" };
export default async function Login({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return <AuthPage mode="login" next={param(params, "next")} error={param(params, "error")} />;
}
