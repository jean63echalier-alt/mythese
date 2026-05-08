import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mythese — Le coach IA qui structure ton mémoire de recherche",
  description:
    "Sources peer-reviewed via OpenAlex. Méthodologie française. Jamais à ta place. Coach méthodologique IA pour étudiants Master et doctorants.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://mythese.com",
  ),
  openGraph: {
    title: "Mythese — Le coach IA qui structure ton mémoire",
    description:
      "Sources peer-reviewed. Méthodologie française. Jamais à ta place.",
    url: "https://mythese.com",
    siteName: "Mythese",
    locale: "fr_FR",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32" },
      { url: "/favicon-192.png", sizes: "192x192" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
