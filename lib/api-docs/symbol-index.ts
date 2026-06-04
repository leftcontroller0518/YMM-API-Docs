import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"

export interface SymbolIndex {
  readonly byId: ReadonlyMap<string, ApiYamlDocumentV1>
}

export class DuplicateSymbolIdError extends Error {
  constructor(
    readonly symbolId: string,
  ) {
    super(`Duplicate symbol id: ${symbolId}`)
    this.name = "DuplicateSymbolIdError"
  }
}

export function buildSymbolIndex(
  documents: readonly ApiYamlDocumentV1[],
): SymbolIndex {

  const byId = new Map<string, ApiYamlDocumentV1>()

  for (const document of documents) {

    if (byId.has(document.id)) {
      throw new DuplicateSymbolIdError(document.id)
    }

    byId.set(document.id, document)
  }

  return {
    byId,
  }
}