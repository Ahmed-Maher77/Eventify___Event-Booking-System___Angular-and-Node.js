export type AdminPaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

/** Same windowing logic as the event catalog (1 … middle … last). */
export function buildAdminPaginationTokens(
  totalPages: number,
  currentPage: number,
): AdminPaginationToken[] {
  const total = Math.max(0, Math.floor(totalPages));
  const current = Math.max(1, Math.min(Math.floor(currentPage) || 1, Math.max(1, total)));
  if (total <= 0) {
    return [];
  }
  if (total <= 5) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }
  const tokens: AdminPaginationToken[] = [1];
  const middleStart = Math.max(2, current - 1);
  const middleEnd = Math.min(total - 1, current + 1);
  if (middleStart > 2) {
    tokens.push('ellipsis-left');
  }
  for (let page = middleStart; page <= middleEnd; page += 1) {
    tokens.push(page);
  }
  if (middleEnd < total - 1) {
    tokens.push('ellipsis-right');
  }
  tokens.push(total);
  return tokens;
}
