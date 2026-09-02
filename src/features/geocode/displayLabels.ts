import { detectScriptFamily } from "@/lib/scriptDetection"
import type { DisplayLabels, GeocodeResult } from "@/lib/types"

function firstDisplaySegment(displayName: string, index: number): string | undefined {
  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  return parts[index]
}

export function displayLabelsFromGeocodeResult(result: GeocodeResult): DisplayLabels {
  const placeLatin = result.placeLatinName ?? firstDisplaySegment(result.displayName, 0) ?? result.displayName
  const countryLatin =
    result.countryLatinName ?? firstDisplaySegment(result.displayName, 2) ?? firstDisplaySegment(result.displayName, 1) ?? ""

  if (!result.placeLocalName) {
    return {
      city: placeLatin,
      country: countryLatin || placeLatin,
    }
  }

  return {
    city: result.placeLocalName,
    cityLatin: placeLatin,
    country: result.countryLocalName ?? "",
    countryLatin,
    scriptFamily: detectScriptFamily(result.placeLocalName, {
      countryCode: result.countryCode,
    }) ?? undefined,
    hasPlaceLocalName: true,
  }
}
