export const metadata = {
  title: "PNPP | Pokhara Nagarik Pratikriya Paddhati",
  description: "Pokhara Metropolitan City complaint portal with citizen, department, ward, and admin access.",
};

import "./globals.css";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@500;600;700;800&family=Instrument+Sans:wght@400;500;600;700&family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__PNPP_CONFIG__ = ${JSON.stringify({ apiBaseUrl })};`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
