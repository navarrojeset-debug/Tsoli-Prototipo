import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(new URL("./db.json", import.meta.url));

export async function readDatabase() {
  const contents = await readFile(databasePath, "utf8");
  return JSON.parse(contents);
}

export async function writeDatabase(database) {
  const contents = `${JSON.stringify(database, null, 2)}\n`;
  await writeFile(databasePath, contents, "utf8");
}
