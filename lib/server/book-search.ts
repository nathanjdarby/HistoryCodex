import { request as httpsRequest } from "node:https";

export type BookSearchSource = "open_library" | "google_books";

export type BookSearchResult = {
  source: BookSearchSource;
  title: string;
  author: string | null;
  isbn: string | null;
  openLibraryId: string | null;
  googleBooksId: string | null;
  coverUrl: string | null;
  estimatedPages: number | null;
  summary: string | null;
};

export type BookSearchResponse = {
  results: BookSearchResult[];
  warnings: string[];
};

type OpenLibraryDoc = {
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  key: string;
  number_of_pages_median?: number;
};

type OpenLibraryResponse = {
  docs: OpenLibraryDoc[];
};

type GoogleBooksVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

type GoogleBooksResponse = {
  items?: GoogleBooksVolume[];
  error?: { message?: string };
};

const SEARCH_LIMIT = 10;
const MAX_RESULTS = 15;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function resultKey(result: BookSearchResult): string {
  if (result.isbn) {
    return `isbn:${result.isbn.replace(/[-\s]/g, "").toLowerCase()}`;
  }
  return `title:${normalizeText(result.title)}|author:${normalizeText(result.author)}`;
}

function pickIsbn(identifiers?: { type: string; identifier: string }[]): string | null {
  if (!identifiers?.length) return null;
  const isbn13 = identifiers.find((entry) => entry.type === "ISBN_13");
  if (isbn13) return isbn13.identifier;
  const isbn10 = identifiers.find((entry) => entry.type === "ISBN_10");
  return isbn10?.identifier ?? null;
}

function googleCoverUrl(links?: { thumbnail?: string; smallThumbnail?: string }): string | null {
  const raw = links?.thumbnail ?? links?.smallThumbnail;
  if (!raw) return null;
  return raw.replace(/^http:/, "https:").replace("&edge=curl", "");
}

function mergeSearchResults(results: BookSearchResult[]): BookSearchResult[] {
  const merged = new Map<string, BookSearchResult>();

  for (const result of results) {
    const key = resultKey(result);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, result);
      continue;
    }

    merged.set(key, {
      source: existing.source,
      title: existing.title || result.title,
      author: existing.author ?? result.author,
      isbn: existing.isbn ?? result.isbn,
      openLibraryId: existing.openLibraryId ?? result.openLibraryId,
      googleBooksId: existing.googleBooksId ?? result.googleBooksId,
      coverUrl: existing.coverUrl ?? result.coverUrl,
      estimatedPages: existing.estimatedPages ?? result.estimatedPages,
      summary: existing.summary ?? result.summary,
    });
  }

  return Array.from(merged.values()).slice(0, MAX_RESULTS);
}

async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(SEARCH_LIMIT));
  url.searchParams.set(
    "fields",
    "title,author_name,isbn,cover_i,key,number_of_pages_median",
  );

  const res = await fetch(url, {
    headers: { "User-Agent": "HistoryCodex/1.0 (personal reading tracker)" },
  });
  if (!res.ok) {
    throw new Error("Open Library search failed");
  }

  const data = (await res.json()) as OpenLibraryResponse;
  return data.docs.map((doc) => ({
    source: "open_library" as const,
    title: doc.title,
    author: doc.author_name?.[0] ?? null,
    isbn: doc.isbn?.[0] ?? null,
    openLibraryId: doc.key,
    googleBooksId: null,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null,
    estimatedPages: doc.number_of_pages_median ?? null,
    summary: null,
  }));
}

function readGoogleBooksApiKey(): string | null {
  const raw = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (!raw) return null;
  return raw.replace(/^['"]|['"]$/g, "");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGoogleBooksUrl(query: string, apiKey: string, withFields: boolean): string {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(SEARCH_LIMIT));
  if (withFields) {
    url.searchParams.set(
      "fields",
      "items(id,volumeInfo(title,authors,description,pageCount,industryIdentifiers,imageLinks))",
    );
  }
  url.searchParams.set("key", apiKey);
  return url.toString();
}

function fetchGoogleBooksJson(
  urlString: string,
): Promise<{ status: number; data: GoogleBooksResponse }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        family: 4,
        headers: {
          Accept: "application/json",
          "User-Agent": "HistoryCodex/1.0 (book catalog admin)",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({
              status: res.statusCode ?? 500,
              data: JSON.parse(body) as GoogleBooksResponse,
            });
          } catch {
            reject(new Error("Google Books returned an invalid response"));
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function mapGoogleBooksResponse(data: GoogleBooksResponse): BookSearchResult[] {
  const results: BookSearchResult[] = [];
  for (const item of data.items ?? []) {
    const info = item.volumeInfo;
    if (!info?.title) continue;

    const summary = info.description ? stripHtml(info.description).slice(0, 2000) : null;
    results.push({
      source: "google_books",
      title: info.title,
      author: info.authors?.[0] ?? null,
      isbn: pickIsbn(info.industryIdentifiers),
      openLibraryId: null,
      googleBooksId: item.id,
      coverUrl: googleCoverUrl(info.imageLinks),
      estimatedPages: info.pageCount ?? null,
      summary,
    });
  }
  return results;
}

async function searchGoogleBooks(query: string, apiKey: string): Promise<BookSearchResult[]> {
  let lastError = "Google Books search failed";
  const attempts = [
    { withFields: true },
    { withFields: true },
    { withFields: false },
    { withFields: false },
  ];

  for (let attempt = 0; attempt < attempts.length; attempt++) {
    if (attempt > 0) {
      await sleep(500 * attempt);
    }

    try {
      const { status, data } = await fetchGoogleBooksJson(
        buildGoogleBooksUrl(query, apiKey, attempts[attempt].withFields),
      );

      if (status >= 200 && status < 300) {
        return mapGoogleBooksResponse(data);
      }

      lastError = data.error?.message ?? "Google Books search failed";

      if (status === 403) {
        throw new Error(
          `${lastError} Check that Books API is enabled and the API key allows server requests.`,
        );
      }

      if (status === 503 || status === 429 || status >= 500) {
        continue;
      }

      throw new Error(lastError);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Books API is enabled")) {
        throw error;
      }
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  throw new Error(`${lastError} Try again in a moment.`);
}

export async function searchBooks(query: string): Promise<BookSearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], warnings: [] };
  }

  const warnings: string[] = [];
  const settled = await Promise.allSettled([
    searchOpenLibrary(trimmed),
    (async () => {
      const apiKey = readGoogleBooksApiKey();
      if (!apiKey) {
        warnings.push("Google Books search skipped: set GOOGLE_BOOKS_API_KEY in your environment.");
        return [];
      }
      return searchGoogleBooks(trimmed, apiKey);
    })(),
  ]);

  const batches: BookSearchResult[] = [];
  for (const [index, result] of settled.entries()) {
    if (result.status === "fulfilled") {
      batches.push(...result.value);
      continue;
    }

    warnings.push(
      index === 0
        ? "Open Library search failed."
        : result.reason instanceof Error
          ? `Google Books search failed: ${result.reason.message}`
          : "Google Books search failed.",
    );
  }

  const results = mergeSearchResults(batches);
  if (results.length === 0 && warnings.length === 0) {
    warnings.push("No results found.");
  }

  return { results, warnings };
}
