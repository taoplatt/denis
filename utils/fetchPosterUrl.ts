export async function fetchPosterUrl(
  movieName: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/poster?name=${encodeURIComponent(
        movieName
      )}`
    );
    const data = await res.json();
    return data.posterUrl || null;
  } catch (err) {
    console.error("Error fetching poster:", err);
    return null;
  }
}
