export default async function handler(req, res) {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ message: "Missing path parameter" });
    }

    // Revalidate the specified path (ISR on-demand revalidation)
    await res.revalidate(path);

    return res.status(200).json({
      revalidated: true,
      path,
      timestamp: Date.now(),
    });
  } catch (error) {
    // If there's an error, Next.js will continue to show
    // the last successfully generated page
    console.error("Error revalidating:", error);
    return res.status(500).json({
      revalidated: false,
      message: "Error revalidating",
      error: error.message,
    });
  }
}
