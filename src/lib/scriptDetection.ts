const LATIN_RANGE = /[\u0000-\u024F]/u

export function isLatinScript(text: string): boolean {
  const letters = [...text].filter((char) => /\p{L}/u.test(char))
  if (letters.length === 0) {
    return true
  }

  const latinCount = letters.filter((char) => LATIN_RANGE.test(char)).length
  return latinCount / letters.length > 0.8
}

export function formatCityLabel(text: string): string {
  if (!isLatinScript(text)) {
    return text
  }

  return [...text.toUpperCase()].join(" ")
}

export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? "N" : "S"
  const lonDir = longitude >= 0 ? "E" : "W"
  return `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lonDir}`
}
