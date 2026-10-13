export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Error {
  code: string;
  message: string;
  details?: unknown;
}

export type UserRole = 'administrator' | 'manager' | 'technician';
