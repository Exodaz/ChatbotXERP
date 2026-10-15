/**
 * Parses live Facebook comments for CF commands.
 * Handles patterns such as:
 * - "CF A12"
 * - "cf a12"
 * - "CF A12 x2" or "CF A12*2" or "CF A12 2"
 * - "ซีเอฟ A12"
 * - "CF A12 สีดำ"
 */
export type ParsedCFCommand = {
  isCF: boolean
  liveCode?: string
  quantity: number
  rawText: string
}

const CF_REGEX = /^(?:cf|ซีเอฟ)\s+([A-Za-z0-9_-]+)(?:\s*(?:x|\*|\s)\s*(\d+))?/i

export function parseLiveCFComment(commentText: string): ParsedCFCommand {
  if (!commentText) {
    return { isCF: false, quantity: 1, rawText: "" }
  }

  const trimmed = commentText.trim()
  const match = trimmed.match(CF_REGEX)

  if (!match) {
    return { isCF: false, quantity: 1, rawText: trimmed }
  }

  const liveCode = match[1]?.toUpperCase()
  const quantity = match[2] ? Math.max(1, Number.parseInt(match[2], 10)) : 1

  return {
    isCF: true,
    liveCode,
    quantity,
    rawText: trimmed,
  }
}
