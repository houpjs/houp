import * as fs from "node:fs/promises";

await fs.copyFile("./dist/index.d.ts", "./dist/esm/index.d.ts");
await fs.rename("./tsdoc-metadata.json", "./dist/tsdoc-metadata.json");
await fs.copyFile("./LICENSE", "./dist/LICENSE");
await fs.copyFile("./README.md", "./dist/README.md");
await fs.copyFile("./package.json", "./dist/package.json");