import Head from "next/head";

export default function SEO({
  title,
  description,
  image,
  url,
  pinColor,
  children,
}) {
  if (!title || !description || !image || !url || !pinColor) {
    console.error(
      "SEO component is missing one or more required props. Please check the docs."
    );
  }
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
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
      <link rel="manifest" href="/site.webmanifest" />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={"website"} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta name="theme-color" content={"#050614"} />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#050614" />

      {children}
    </Head>
  );
}
