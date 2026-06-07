import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlatSplit — Shared Retro Expense Manager',
  description: 'Classic single-page expense manager for flatmates.',
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'FlatSplit'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  if (${process.env.NODE_ENV === 'production'}) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(
                        function(reg) {
                          console.log('SW registered:', reg.scope);
                        },
                        function(err) {
                          console.log('SW registration failed:', err);
                        }
                      );
                    });
                  } else {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      for (let reg of regs) {
                        reg.unregister().then(function() {
                          console.log('SW unregistered in development mode');
                        });
                      }
                    });
                    if ('caches' in window) {
                      caches.keys().then(function(keys) {
                        for (let key of keys) {
                          caches.delete(key).then(function() {
                            console.log('Cache cleared in development mode:', key);
                          });
                        }
                      });
                    }
                  }
                }
              }
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
