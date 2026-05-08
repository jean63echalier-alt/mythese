// Smoke test: OpenAlex query for Beeclou topic
const email = process.env.OPENALEX_EMAIL || "test@mythese.com";

const params = new URLSearchParams();
params.set("search", "digital out-of-home advertising urban attention");
params.set("per_page", "30");
params.set(
  "filter",
  [
    "language:fr|en",
    `from_publication_date:${new Date().getFullYear() - 12}-01-01`,
    "type:article|review",
    "has_abstract:true",
  ].join(","),
);
params.set("sort", "relevance_score:desc");
params.set("mailto", email);

const url = `https://api.openalex.org/works?${params.toString()}`;
console.log("URL:", url);
const start = Date.now();
const res = await fetch(url, {
  headers: { "User-Agent": `Mythese-test/0.1 (mailto:${email})` },
});
console.log("Status:", res.status, "Time:", Date.now() - start, "ms");
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
const data = await res.json();
const works = data.results || [];
console.log(`Total works returned: ${works.length}`);
console.log(`Total available: ${data.meta?.count}`);
console.log("\nTop 5 :");
for (const w of works.slice(0, 5)) {
  const authors = (w.authorships || []).slice(0, 3).map((a) => a.author.display_name).join(", ");
  console.log(`- [${w.publication_year}] ${w.title}`);
  console.log(`  ${authors} · ${w.primary_location?.source?.display_name ?? "?"} · cited ${w.cited_by_count}x`);
  console.log(`  DOI: ${w.doi ?? "(none)"}`);
}
