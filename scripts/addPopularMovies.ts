// scripts/addPopularMovies.ts

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { config } from "dotenv";
import { OpenAI } from "openai";

config({ path: ".env.local" });

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MOVIES_DIR = path.join(process.cwd(), "data/movies");
const POSTERS_FILE = path.join(process.cwd(), "data/posters.json");
let posters: Record<string, string> = {};
if (fs.existsSync(POSTERS_FILE)) {
  posters = JSON.parse(fs.readFileSync(POSTERS_FILE, "utf-8"));
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function fetchPopularMovies(): Promise<string[]> {
  const movieNames: string[] = [];

  for (let page = 1; page <= 1; page++) {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=vote_average.desc&vote_average.gte=7.5&vote_count.gte=500&primary_release_date.lte=2024-01-01&page=${page}`
    );
    const data = (await res.json()) as {
      results: { title: string }[];
    };
    const names = data.results.map((m: any) => m.title);
    movieNames.push(...names);
  }

  return movieNames;
}

async function generateBreakdown(movieTitle: string) {
  const prompt = `
Generate a JSON structure with story breakdowns of the movie "${movieTitle}" in the following format:

\`\`\`json
{
  "title": "${movieTitle}",
  "frameworks": {
    "Save the Cat": {
      "Opening Image": "...",
      "Theme Stated": "...",
      "Set-Up": "...",
      "Catalyst": "...",
      "Debate": "...",
      "Break into Two": "...",
      "B Story": "...",
      "Fun and Games": "...",
      "Midpoint": "...",
      "Bad Guys Close In": "...",
      "All Is Lost": "...",
      "Dark Night of the Soul": "...",
      "Break into Three": "...",
      "Finale": "...",
      "Final Image": "..."
    },
    "Hero’s Journey": {
      "Ordinary World": "...",
      "Call to Adventure": "...",
      "Trials": "...",
      "Ordeal": "...",
      "Return": "..."
    },
    "Story Circle": {
      "You": "...",
      "Need": "...",
      "Go": "...",
      "Search": "...",
      "Find": "...",
      "Take": "...",
      "Return": "...",
      "Change": "..."
    }
  }
}
\`\`\`

Format it for film students — rich in emotional and narrative insight.
Do not include explanations or comments, just return valid JSON.
`;

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini-2025-04-14",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = chatResponse.choices[0].message.content;
  const cleaned = content?.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned!);
  } catch (err) {
    console.error(`❌ Failed to parse JSON for: ${movieTitle}`);
    console.error("Raw output was:\n", content);
    return null;
  }
}

async function main() {
  const popularMovies = await fetchPopularMovies();

  const savedMovies: string[] = [];
  const skippedMovies: string[] = [];

  for (const movie of popularMovies) {
    const fileName = movie.toLowerCase().replace(/\s+/g, "_") + ".json";
    const filePath = path.join(MOVIES_DIR, fileName);

    const hasMovieFile = fs.existsSync(filePath);
    const hasPoster = posters[movie.toLowerCase()];

    if (hasMovieFile && hasPoster) {
      console.log(`✅ Skipping ${movie}, already exists and poster cached.`);
      skippedMovies.push(movie);
      continue;
    }

    if (!posters[movie.toLowerCase()]) {
      const posterRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
          movie
        )}&api_key=${TMDB_API_KEY}`
      );
      const posterData = (await posterRes.json()) as {
        results: { poster_path: string }[];
      };
      const posterPath = posterData.results?.[0]?.poster_path;
      if (posterPath) {
        posters[
          movie.toLowerCase()
        ] = `https://image.tmdb.org/t/p/w500${posterPath}`;
      } else {
        console.warn(`⚠️ Poster not found for ${movie}`);
        console.warn(
          `❌ TMDB response: ${JSON.stringify(posterData, null, 2)}`
        );
      }
    } else {
      console.log(`🖼️ Skipping ${movie}, poster already cached.`);
    }

    console.log(`📀 Generating breakdown for ${movie}...`);
    await new Promise((res) => setTimeout(res, 500));

    const breakdown = await generateBreakdown(movie);
    if (!breakdown) continue;

    fs.writeFileSync(filePath, JSON.stringify(breakdown, null, 2));
    savedMovies.push(movie);
    console.log(`✅ Saved: ${fileName}`);
  }

  if (Object.keys(posters).length > 0) {
    fs.writeFileSync(POSTERS_FILE, JSON.stringify(posters, null, 2));
    console.log(`🖼️ Posters saved to data/posters.json`);
  } else {
    console.warn("⚠️ No posters saved. posters.json will not be written.");
  }

  console.log(
    `✅ Saved ${savedMovies.length} movies: ${savedMovies.join(", ")}`
  );
  console.log(
    `⏩ Skipped ${skippedMovies.length} movies: ${skippedMovies.join(", ")}`
  );

  console.log("🎉 Done!");
}

main().catch(console.error);
