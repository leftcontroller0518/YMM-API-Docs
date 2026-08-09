export function getReferenceUrl(
  symbolId: string,
): string {
  return `/reference/${encodeURIComponent(symbolId).replace(/[()]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  })}`
}