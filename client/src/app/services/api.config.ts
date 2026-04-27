export function resolveApiBaseUrl(): string {
  const fromImportMeta = (import.meta as { env?: Record<string, string | undefined> }).env?.[
    'BACKEND_API'
  ];
  const fromRuntimeEnv = (globalThis as { __env?: Record<string, string | undefined> }).__env?.[
    'BACKEND_API'
  ];

  return (fromImportMeta ?? fromRuntimeEnv ?? '/api').trim().replace(/\/+$/, '');
}
