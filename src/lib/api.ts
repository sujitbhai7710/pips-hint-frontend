// API Client for Pips Solver Worker v2.0.0
// Matches actual worker response formats

const API_BASE = "https://pips-worker.pipssolver.workers.dev";

// ============================================================
// Types matching actual Worker API responses
// ============================================================

export interface Region {
  indices: number[][];
  type: 'sum' | 'equals' | 'unequal' | 'less' | 'greater' | 'empty';
  target?: number;
}

export interface DifficultyPuzzle {
  id: number;
  backendId: string;
  constructors: string;
  dominoes: number[][];
  regions: Region[];
  solution?: number[][][]; // stripped in public responses
}

export interface AIExplanationSection {
  heading: string;
  body: string;
}

export interface AIExplanation {
  easy: AIExplanationSection;
  medium: AIExplanationSection;
  hard: AIExplanationSection;
  tips: string;
  learned: string;
  faqs: { question: string; answer: string }[];
}

export interface PuzzleResponse {
  printDate: string;
  editor: string;
  easy: DifficultyPuzzle;
  medium: DifficultyPuzzle;
  hard: DifficultyPuzzle;
  explanation: AIExplanation | null;
}

export interface DifficultyResponse {
  date: string;
  editor: string;
  [difficulty: string]: DifficultyPuzzle | string | AIExplanation | null;
  explanation: {
    [difficulty: string]: AIExplanationSection | null;
    tips: string | null;
    learned?: string | null;
    faqs?: { question: string; answer: string }[];
  } | null;
}

export interface ArchiveEntry {
  date: string;
  editor: string | null;
  hasEasy: boolean;
  hasMedium: boolean;
  hasHard: boolean;
}

export interface ArchiveResponse {
  dates: ArchiveEntry[];
  total: number;
}

export interface StatsResponse {
  totalPuzzles: number;
  dateRange: { first: string | null; last: string | null };
  editors: { editor: string; count: number }[];
  topConstructors: { constructors: string; count: number }[];
  regionTypeDistribution: Record<string, number>;
  idRange: { min: number | null; max: number | null };
  recentAdditions: { last7Days: number };
}

export interface UnlimitedResponse {
  date: string;
  easy: DifficultyPuzzle;
  medium: DifficultyPuzzle;
  hard: DifficultyPuzzle;
  explanation: AIExplanation | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  checks: {
    database: { status: string; latency?: number };
    gemini: { status: string; detail?: string };
    github: { status: string };
  };
}

export interface ListResponse {
  data: {
    date: string;
    data: PuzzleResponse;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// Fetch helper
// ============================================================

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }
  return res.json();
}

// ============================================================
// API Methods
// ============================================================

export const api = {
  getToday: () => fetchAPI<PuzzleResponse>("/today"),
  getYesterday: () => fetchAPI<PuzzleResponse>("/yesterday"),
  getByDate: (date: string) => fetchAPI<PuzzleResponse>(`/date/${date}`),
  getByDateDifficulty: (date: string, difficulty: string) =>
    fetchAPI<DifficultyResponse>(`/date/${date}/${difficulty}`),
  getById: (id: number) => fetchAPI<any>(`/id/${id}`),
  getStats: () => fetchAPI<StatsResponse>("/stats"),
  getArchive: (month?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    const qs = params.toString();
    return fetchAPI<ArchiveResponse>(`/archive${qs ? `?${qs}` : ""}`);
  },
  getUnlimited: (difficulty?: string, exclude?: string) => {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (exclude) params.set("exclude", exclude);
    const qs = params.toString();
    return fetchAPI<UnlimitedResponse>(`/pips/unlimited${qs ? `?${qs}` : ""}`);
  },
  getHealth: () => fetchAPI<HealthResponse>("/health"),
  list: (page = 1, limit = 20, includeExplanation = false) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (includeExplanation) params.set("include", "explanation");
    return fetchAPI<ListResponse>(`/list?${params.toString()}`);
  },
};

// ============================================================
// Helper: get puzzle for a date, falling back to yesterday
// ============================================================

export async function getPuzzleForDate(date?: string): Promise<PuzzleResponse | null> {
  try {
    if (date) {
      return await api.getByDate(date);
    }
    return await api.getToday();
  } catch {
    // Today might not exist yet, try yesterday
    try {
      return await api.getYesterday();
    } catch {
      return null;
    }
  }
}

// Format date for display
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Format date short
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Get today's date string YYYY-MM-DD
export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
