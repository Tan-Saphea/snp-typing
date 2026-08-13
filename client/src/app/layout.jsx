import ClientProviders from "@/components/ClientProviders.jsx";
import "@/styles/index.css";

export const metadata = {
  title: "SNP Typing",
  description: "English and Khmer typing education",
  icons: { icon: "/logo.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
