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

  for (const movie of popularMovies) {
    const fileName = movie.toLowerCase().replace(/\s+/g, "_") + ".json";
    const filePath = path.join(MOVIES_DIR, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`✅ Skipping ${movie}, already exists.`);
      continue;
    }

    console.log(`📀 Generating breakdown for ${movie}...`);

    const breakdown = await generateBreakdown(movie);
    if (!breakdown) continue;

    fs.writeFileSync(filePath, JSON.stringify(breakdown, null, 2));
    console.log(`✅ Saved: ${fileName}`);
  }

  console.log("🎉 Done!");
}

main().catch(console.error);
