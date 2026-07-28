import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rhythms of Hope | Moksha Base",
  description:
    "Rhythms of Hope — Te Hīkoi o te Tūmanako. A community cancer-awareness event, book launch and live music experience in Hamilton.",
  icons: { icon: "/hope-favicon.png", shortcut: "/hope-favicon.png" },
  openGraph: {
    title: "Rhythms of Hope | Moksha Base",
    description: "A Journey of Resilience — Saturday, 17 October 2026 in Hamilton.",
    images: ["/rhythms-of-hope-og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
