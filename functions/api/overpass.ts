const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
]

async function proxyOverpassQuery(query: string): Promise<Response> {
  const attempts = await Promise.allSettled(
    OVERPASS_ENDPOINTS.map(async (endpoint) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "mapposter-web/1.0 (Overpass proxy)",
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!response.ok) {
        throw new Error(`Overpass error ${response.status} from ${endpoint}`)
      }

      return response.json()
    }),
  )

  const success = attempts.find((result) => result.status === "fulfilled")
  if (success && success.status === "fulfilled") {
    return Response.json(success.value)
  }

  const message = attempts
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason))
    .join("; ")

  return Response.json({ error: message || "All Overpass endpoints failed" }, { status: 502 })
}

export const onRequestPost = async (context: { request: Request }): Promise<Response> => {
  let query = ""

  try {
    const body = (await context.request.json()) as { query?: string }
    query = body.query?.trim() ?? ""
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 })
  }

  return proxyOverpassQuery(query)
}
