import { pagesEdgeCache } from "../lib/pagesEdgeCache"
import { boundaryFromNominatim } from "../lib/nominatim"
import { handleBoundaryProxy } from "../../shared/proxyHandler"

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const result = await handleBoundaryProxy(
    url.searchParams,
    pagesEdgeCache(context.env),
    (osmType, osmId, radiusMeters) => boundaryFromNominatim(osmType, osmId, context.env, radiusMeters),
  )
  return Response.json(result.body, { status: result.status, headers: result.headers })
}
