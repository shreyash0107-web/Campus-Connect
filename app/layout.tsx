import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CampusConnect — Find the right people to build with.", template: "%s | CampusConnect" },
  description: "Discover students, find project and study partners, and turn campus ideas into collaborations.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a>{children}<Toaster position="bottom-right" richColors closeButton /></body></html>;
}
