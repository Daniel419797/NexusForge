import { writeFile } from "node:fs/promises";

const REGISTRY = "https://registry.npmjs.org";
const OUTPUT_PATH = new URL("../src/lib/sdk-published-manifest.json", import.meta.url);

const packageNames = [
  "@nexus-forge-sdk/auth",
  "@nexus-forge-sdk/react-auth",
  "@nexus-forge-sdk/js-client",
  "@nexus-forge-sdk/react",
  "nexusforge-auth",
  "nexusforge-sdk",
];

async function packageExists(name) {
  const encoded = name.startsWith("@") ? name.replace("/", "%2f") : name;
  const url = `${REGISTRY}/${encoded}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) return true;
    if (response.status === 404) return false;

    console.warn(`[sync-sdk-published] Unexpected status ${response.status} for ${name}. Treating as unpublished.`);
    return false;
  } catch (error) {
    console.warn(`[sync-sdk-published] Network error while checking ${name}. Treating as unpublished.`);
    return false;
  }
}

async function main() {
  const checks = await Promise.all(
    packageNames.map(async (name) => [name, await packageExists(name)]),
  );

  const packages = Object.fromEntries(checks);
  const manifest = {
    generatedAt: new Date().toISOString(),
    packages,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const publishedCount = Object.values(packages).filter(Boolean).length;
  console.log(`[sync-sdk-published] Updated manifest with ${publishedCount}/${packageNames.length} published packages.`);
}

main().catch((error) => {
  console.error("[sync-sdk-published] Failed:", error);
  process.exitCode = 1;
});
