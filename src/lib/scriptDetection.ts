const LATIN_RANGE = /[\u0000-\u024F]/u

export function isLatinScript(text: string): boolean {
  const letters = [...text].filter((char) => /\p{L}/u.test(char))
  if (letters.length === 0) {
    return true
  }

  const latinCount = letters.filter((char) => LATIN_RANGE.test(char)).length
  return latinCount / letters.length > 0.8
}

/** Em space between words — survives HTML whitespace collapsing unlike regular spaces. */
const LATIN_LABEL_WORD_GAP = "\u2003"

function letterSpaceWord(word: string): string {
  return [...word.toUpperCase()].join(" ")
}

export function formatCityLabel(text: string): string {
  if (!isLatinScript(text)) {
    return text
  }

  const words = text.trim().split(/\s+/).filter((word) => word.length > 0)
  if (words.length === 0) {
    return text
  }

  return words.map(letterSpaceWord).join(LATIN_LABEL_WORD_GAP)
}

export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? "N" : "S"
  const lonDir = longitude >= 0 ? "E" : "W"
  return `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lonDir}`
}
