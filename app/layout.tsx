import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abuse Desk — Find the right abuse contact",
  description: "Look up the responsible abuse desk for any public IP and prepare a clear incident report.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
