import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const dir = path.join(process.cwd(), "data", "movies"); // full path to your folder
  const files = fs.readdirSync(dir); // get all files in the folder

  const movies = files
    .filter((file) => file.endsWith(".json")) // only .json files
    .map((file) => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")); // read + parse the file
      const name = path.basename(file, ".json"); // remove ".json" from filename
      return { name, data }; // return { name: "titanic", data: {...} }
    });

  res.status(200).json(movies); // send the data back to the browser
}
