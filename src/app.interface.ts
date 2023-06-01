export interface PaginationOptions {
    lastCursor?: string;
    limit?: number;
    search?: PaginationSearchOptions;
}

export type PaginationSearchOptions = Record<string, { value: string; like?: boolean; }>;

