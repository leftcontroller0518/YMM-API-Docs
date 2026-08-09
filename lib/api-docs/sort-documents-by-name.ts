import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"

export function sortDocumentsByName<T extends ApiYamlDocumentV1>(
  documents: readonly T[],
): T[] {
  return [...documents]
    .sort((a, b) => a.name.localeCompare(b.name))
}