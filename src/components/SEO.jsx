import Head from "next/head";

export default function SEO({
  title,
  description,
  image,
  url,
  pinColor = "#3B82F6",
  children,
}) {
  // Ensure we have default values
  const metaTitle = title || "Salud Libre";
  const metaDescription = description || "Encuentra y agenda citas con los mejores doctores";
  const metaImage = image || "https://saludlibre.com/img/logo-hospital.png";
  const metaUrl = url || "https://saludlibre.com";

  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/web-app-manifest-192x192.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="512x512"
        href="/web-app-manifest-512x512.png"
      />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={metaTitle} />
      <meta property="og:site_name" content="Salud Libre" />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={metaUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={metaTitle} />

      {/* WhatsApp specific (uses Open Graph) */}
      <meta property="og:image:type" content="image/jpeg" />
      
      {/* Additional meta tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content={pinColor} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Salud Libre" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={metaUrl} />
      
      {/* Manifest and other icons */}
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color={pinColor} />

      {children}
    </Head>
  );
}
