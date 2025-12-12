import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 👇 CORRECTION ICI (Chemin relatif)
import QueryProvider from "./components/QueryProvider"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Grand Line RPG",
  description: "Aventure RPG One Piece",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased` }
        suppressHydrationWarning={true}
      >
        <QueryProvider>
            {children}
        </QueryProvider>
      </body>
    </html>
  );
}

