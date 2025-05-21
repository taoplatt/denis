// This API route fetches the movie poster URL from TMDB based on the movie name passed as a query parameter.

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name } = req.query;
  const apiKey = process.env.TMDB_API_KEY;

  console.log("Fetching poster for movie:", name);

  if (typeof name !== "string" || !apiKey) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const query = encodeURIComponent(name);
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`
  );

  if (!response.ok) {
    return res.status(500).json({ error: "TMDB fetch failed" });
  }

  const data = await response.json();
  const movie = data.results?.[0];
  const posterUrl = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  res.status(200).json({ posterUrl });
}
