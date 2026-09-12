import { cn, initials } from "@/lib/utils";
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const tone = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
  return <div className={cn("avatar", large && "avatar-lg")} data-tone={tone} aria-hidden="true">{initials(name)}</div>;
}
