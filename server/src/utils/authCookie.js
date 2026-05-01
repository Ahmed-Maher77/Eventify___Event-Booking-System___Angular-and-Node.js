const parseDurationToMs = (value, fallbackMs) => {
  if (!value || typeof value !== 'string') {
    return fallbackMs;
  }

  const normalized = value.trim().toLowerCase();
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  const match = normalized.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const unitMap = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000
  };

  return amount * unitMap[unit];
};

export const getAuthCookieName = () => process.env.JWT_COOKIE_NAME || 'token';

export const getAuthCookieOptions = () => {
  const defaultMaxAgeMs = 7 * 24 * 60 * 60 * 1000;   // 7 days
  const maxAgeMs = parseDurationToMs(process.env.JWT_COOKIE_MAX_AGE, defaultMaxAgeMs);
  const sameSite = process.env.JWT_COOKIE_SAME_SITE || 'lax';

  return {
    httpOnly: (process.env.JWT_COOKIE_HTTP_ONLY || 'true') === 'true',
    secure: (process.env.JWT_COOKIE_SECURE || 'false') === 'true',
    sameSite,
    path: process.env.JWT_COOKIE_PATH || '/',
    maxAge: maxAgeMs
  };
};

export const getAuthCookieClearOptions = () => {
  const options = getAuthCookieOptions();
  return {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path
  };
};
