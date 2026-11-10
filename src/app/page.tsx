export default function RootPage() {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="0; url=/en/" />
        <link rel="canonical" href="/en/" />
        <title>Office of International Affairs - Universitas Mataram</title>
      </head>
      <body className="bg-white flex items-center justify-center min-h-screen font-sans text-slate-600">
        <div className="text-center p-6">
          <div className="w-8 h-8 border-3 border-unram-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Redirecting to Office of International Affairs...</p>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== 'undefined') { window.location.replace('/en/'); }`,
          }}
        />
      </body>
    </html>
  );
}
