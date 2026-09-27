import { pagesEdgeCache } from "../lib/pagesEdgeCache"
import { geocodeFromNominatim } from "../lib/nominatim"
import { handleGeocodeProxy } from "../../shared/proxyHandler"

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const result = await handleGeocodeProxy(url.searchParams, pagesEdgeCache(context.env), (city, country) =>
    geocodeFromNominatim(city, country, context.env),
  )
  return Response.json(result.body, { status: result.status, headers: result.headers })
}
