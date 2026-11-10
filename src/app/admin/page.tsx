export default function AdminRedirectPage() {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="0; url=/en/admin/" />
        <link rel="canonical" href="/en/admin/" />
        <title>Redirecting to Admin Portal - IAO Universitas Mataram</title>
      </head>
      <body className="bg-slate-50 flex items-center justify-center min-h-screen font-sans text-slate-700">
        <div className="text-center p-6">
          <div className="w-8 h-8 border-2 border-unram-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Opening UNRAM IAO Admin Dashboard...</p>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== 'undefined') { window.location.replace('/en/admin/'); }`,
          }}
        />
      </body>
    </html>
  );
}
