import { httpClient } from '@/lib/httpClient';
import { endpoints as apiEndpoints } from '@/config/endpoints';

const endpoints = {
  dashboard: apiEndpoints.analista.dashboard,
  summary: apiEndpoints.analista.summary,
  incidentsByCategory: apiEndpoints.analista.incidentsByCategory,
  incidentsByStatus: apiEndpoints.analista.incidentsByStatus,
  reports: apiEndpoints.analista.reports,
  resolutionTimes: apiEndpoints.analista.resolutionTimes,
  recurringFailures: apiEndpoints.analista.recurringFailures,
};

export type AnalystPeriod = 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days';
export type AnalystDimension = 'category' | 'building' | 'priority' | 'status';

export type AnalystReportFilters = {
  dimension: AnalystDimension;
  period: AnalystPeriod;
  category: string;
  building: string;
  priority: string;
};

export type ApiRecord = Record<string, unknown>;

export function asRecord(value: unknown): ApiRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as ApiRecord)
    : null;
}

export function nestedRecord(value: unknown): ApiRecord | null {
  let record = asRecord(value);
  for (let depth = 0; record && depth < 3; depth += 1) {
    const nested = record.data ?? record.dashboard ?? record.summary ?? record.metrics;
    const next = asRecord(nested);
    if (!next) return record;
    record = next;
  }
  return record;
}

export function readNumber(
  record: ApiRecord | null,
  keys: string[],
): number | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

export function readText(record: ApiRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

export function readRows(
  payload: unknown,
  collectionKeys: string[],
): ApiRecord[] | null {
  if (Array.isArray(payload)) {
    return payload.map(asRecord).filter((row): row is ApiRecord => row !== null);
  }

  const record = asRecord(payload);
  if (!record) return null;
  for (const key of collectionKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.map(asRecord).filter((row): row is ApiRecord => row !== null);
    }
  }
  const nested = asRecord(record.data);
  if (nested) return readRows(nested, collectionKeys);
  return null;
}

export function readDistribution(
  payload: unknown,
  dimension: AnalystDimension,
): { label: string; count: number }[] | null {
  const labelKeys: Record<AnalystDimension, string[]> = {
    category: ['category', 'label', 'name', 'title'],
    building: ['building', 'label', 'name', 'title'],
    priority: ['priority', 'label', 'name', 'title'],
    status: ['status', 'label', 'name', 'title'],
  };
  const rows = readRows(payload, [
    'data',
    'results',
    'items',
    'reports',
    'categories',
    'statuses',
    'distribution',
    'breakdown',
  ]);

  if (rows) {
    return rows.flatMap((row) => {
      const label = readText(row, labelKeys[dimension]);
      const count = readNumber(row, ['count', 'total', 'incidents', 'tickets', 'value']);
      return label !== null && count !== null ? [{ label, count }] : [];
    });
  }

  const record = asRecord(payload);
  if (!record) return null;
  const entries = Object.entries(record).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === 'number' && Number.isFinite(entry[1]),
  );
  return entries.length ? entries.map(([label, count]) => ({ label, count })) : null;
}

export function getAnalystDashboard(period: AnalystPeriod, signal?: AbortSignal) {
  return httpClient<unknown>(endpoints.dashboard, { query: { period }, signal });
}

export function getAnalystSummary(period: AnalystPeriod, signal?: AbortSignal) {
  return httpClient<unknown>(endpoints.summary, { query: { period }, signal });
}

export function getIncidentsByCategory(period: AnalystPeriod, signal?: AbortSignal) {
  return httpClient<unknown>(endpoints.incidentsByCategory, {
    query: { period },
    signal,
  });
}

export function getIncidentsByStatus(period: AnalystPeriod, signal?: AbortSignal) {
  return httpClient<unknown>(endpoints.incidentsByStatus, {
    query: { period },
    signal,
  });
}

export function getAnalystReports(
  filters: AnalystReportFilters,
  signal?: AbortSignal,
) {
  return httpClient<unknown>(endpoints.reports, {
    query: filters,
    signal,
  });
}

export function getResolutionTimes(signal?: AbortSignal) {
  return httpClient<unknown>(endpoints.resolutionTimes, { signal });
}

export function getRecurringFailures(signal?: AbortSignal) {
  return httpClient<unknown>(endpoints.recurringFailures, { signal });
}
