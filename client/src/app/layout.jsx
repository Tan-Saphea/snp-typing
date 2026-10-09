import { AntdRegistry } from "@ant-design/nextjs-registry";
import ClientProviders from "@/components/ClientProviders.jsx";
import "@/styles/index.css";

export const metadata = {
  title: "SNP Typing",
  description: "English and Khmer typing education",
  icons: {
    icon: "/logo.png",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = JSON.parse(localStorage.getItem('snp-learner-settings') || '{}');
                  var pref = stored.theme || 'system';
                  var isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark', 'snp-dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark', 'snp-dark');
                    root.style.colorScheme = 'light';
                  }
                  if (stored.largeText) {
                    root.classList.add('snp-large-text');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link
          rel="preload"
          href="/fonts/googlesans-khmer-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/googlesans-khmer-700.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/googlesans-latin-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/googlesans-latin-700.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AntdRegistry>
          <ClientProviders>{children}</ClientProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
