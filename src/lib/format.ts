export function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toErrorSummary(error: unknown): { message: string; details: string[] } {
  if (error instanceof Error) {
    const details = "details" in error && Array.isArray(error.details) ? error.details : [];
    return { message: error.message, details };
  }

  return { message: "Unable to load data", details: [] };
}
