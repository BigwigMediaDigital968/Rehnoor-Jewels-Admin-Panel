import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Rehnoor Jewels — Admin",
  description: "Rehnoor Jewellery Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Toast Container */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#022c22",
              color: "#facc15",
              border: "1px solid rgba(250,204,21,0.2)",
              backdropFilter: "blur(10px)",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#022c22",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#022c22",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
