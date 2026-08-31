interface KVNamespace {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    options?: {
      expirationTtl?: number
    },
  ): Promise<void>
}

interface Env {
  PROXY_CACHE: KVNamespace
  GEOCODE_CONTACT_EMAIL?: string
}

type PagesFunction<Env = unknown> = (context: {
  request: Request
  env: Env
  waitUntil: (promise: Promise<unknown>) => void
  passThroughOnException: () => void
  next: () => Promise<Response>
  params: Record<string, string>
  data: Record<string, unknown>
}) => Response | Promise<Response>
