const OPENALEX_BASE = "https://api.openalex.org";

export interface OpenAlexWork {
  id: string;
  doi: string | null;
  title: string;
  publication_year: number | null;
  authorships: Array<{
    author: { id?: string; display_name?: string };
  }>;
  primary_location?: {
    source?: {
      display_name?: string;
      type?: string;
    } | null;
  } | null;
  is_oa?: boolean;
  abstract_inverted_index?: Record<string, number[]> | null;
  cited_by_count?: number;
  language?: string;
  type?: string;
}

export interface NormalizedWork {
  id: string;
  doi: string | null;
  doiUrl: string | null;
  title: string;
  year: number | null;
  authors: string[];
  journal: string | null;
  abstract: string | null;
  citations: number;
  language: string | null;
  isPeerReviewed: boolean;
  citationApa: string;
}

function reconstructAbstract(
  inv: Record<string, number[]> | null | undefined,
): string | null {
  if (!inv) return null;
  const positions: Array<[number, string]> = [];
  for (const [word, idxs] of Object.entries(inv)) {
    for (const i of idxs) positions.push([i, word]);
  }
  positions.sort(([a], [b]) => a - b);
  return positions.map(([, w]) => w).join(" ");
}

function formatApaCitation(w: OpenAlexWork): string {
  const authorList = (w.authorships || [])
    .map((a) => a.author.display_name)
    .filter(Boolean) as string[];
  const authorsApa = authorList.length === 0
    ? "Auteur inconnu"
    : authorList.length === 1
    ? formatLastFirst(authorList[0])
    : authorList.length <= 6
    ? authorList.map(formatLastFirst).join(", ")
    : authorList.slice(0, 6).map(formatLastFirst).join(", ") + ", et al.";
  const year = w.publication_year ?? "s.d.";
  const title = w.title || "Sans titre";
  const journal = w.primary_location?.source?.display_name ?? "";
  const doi = w.doi ? ` https://doi.org/${w.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}` : "";
  return `${authorsApa} (${year}). ${title}.${journal ? ` ${journal}.` : ""}${doi}`.trim();
}

function formatLastFirst(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => p[0]?.toUpperCase() + ".")
    .join(" ");
  return `${last}, ${initials}`;
}

export function normalizeWork(w: OpenAlexWork): NormalizedWork {
  const doi = w.doi
    ? w.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    : null;
  const isJournal = w.primary_location?.source?.type === "journal";
  const isPeerReviewed =
    !!w.primary_location?.source &&
    (isJournal || (w.type === "article" && !!w.primary_location?.source));
  return {
    id: w.id,
    doi,
    doiUrl: doi ? `https://doi.org/${doi}` : null,
    title: w.title || "Sans titre",
    year: w.publication_year ?? null,
    authors: (w.authorships || [])
      .map((a) => a.author.display_name)
      .filter(Boolean) as string[],
    journal: w.primary_location?.source?.display_name ?? null,
    abstract: reconstructAbstract(w.abstract_inverted_index),
    citations: w.cited_by_count ?? 0,
    language: w.language ?? null,
    isPeerReviewed,
    citationApa: formatApaCitation(w),
  };
}

export interface OpenAlexQuery {
  search: string;
  perPage?: number;
  yearFrom?: number;
}

export async function searchWorks(q: OpenAlexQuery): Promise<NormalizedWork[]> {
  const email = process.env.OPENALEX_EMAIL || "contact@mythese.com";
  const baseFilters = [
    "language:fr|en",
    `from_publication_date:${q.yearFrom ?? new Date().getFullYear() - 12}-01-01`,
    "type:article|review",
    "has_abstract:true",
  ];

  // Stratégie : title_and_abstract.search d'abord (haute précision, peu de bruit).
  // Si < 10 résultats, fallback sur `search` plein texte (recall plus large)
  // et merge déduplique. Top sources strictes restent en tête.
  const strict = await runStrictQuery(email, q.search, baseFilters);
  let pool = strict;
  if (strict.length < 10) {
    const broad = await runBroadQuery(email, q.search, baseFilters);
    const seen = new Set(strict.map((w) => w.id));
    pool = [...strict, ...broad.filter((w) => !seen.has(w.id))];
  }

  const withAbstract = pool.filter((w) => w.abstract && w.title);
  const withJournal = withAbstract.filter((w) => w.journal);
  if (withJournal.length >= 12) return withJournal.slice(0, 20);
  return [...withJournal, ...withAbstract.filter((w) => !w.journal)].slice(0, 20);
}

async function runStrictQuery(
  email: string,
  search: string,
  baseFilters: string[],
): Promise<NormalizedWork[]> {
  const params = new URLSearchParams();
  params.set("per_page", "30");
  params.set("filter", [`title_and_abstract.search:${search}`, ...baseFilters].join(","));
  params.set("sort", "relevance_score:desc");
  params.set("mailto", email);
  return fetchWorks(email, params);
}

async function runBroadQuery(
  email: string,
  search: string,
  baseFilters: string[],
): Promise<NormalizedWork[]> {
  const params = new URLSearchParams();
  params.set("search", search);
  params.set("per_page", "30");
  params.set("filter", baseFilters.join(","));
  params.set("sort", "relevance_score:desc");
  params.set("mailto", email);
  return fetchWorks(email, params);
}

async function fetchWorks(email: string, params: URLSearchParams): Promise<NormalizedWork[]> {
  const url = `${OPENALEX_BASE}/works?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": `Mythese/0.1 (mailto:${email})`,
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`OpenAlex error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { results: OpenAlexWork[] };
  return (data.results || []).map(normalizeWork);
}
