export const MAX_SUMMARY_TEXT_LENGTH = 120_000

const MIN_SUMMARY_TEXT_LENGTH = 1000
const MIN_SUMMARY_HEADING_COUNT = 6

export function isSummaryTextWithinLimit(summaryText: string): boolean {
  return summaryText.length <= MAX_SUMMARY_TEXT_LENGTH
}

export function shouldExecuteSummary(summaryText: string): boolean {
  if (!summaryText) return false

  const headingCount = (summaryText.match(/^#{2,3}\s/gm) || []).length
  return summaryText.length >= MIN_SUMMARY_TEXT_LENGTH || headingCount >= MIN_SUMMARY_HEADING_COUNT
}
