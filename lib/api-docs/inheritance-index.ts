import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"
import type { SymbolIndex } from "./symbol-index"
import { sortDocumentsByName } from "./sort-documents-by-name"

export interface InheritanceIndex {

  readonly derivedTypes:
    ReadonlyMap<
      string,
      readonly ApiYamlDocumentV1[]
    >

  readonly implementedBy:
    ReadonlyMap<
      string,
      readonly ApiYamlDocumentV1[]
    >
}

export function buildInheritanceIndex(
  index: SymbolIndex,
): InheritanceIndex {

  const derivedTypes =
    new Map<string, ApiYamlDocumentV1[]>()

  const implementedBy =
    new Map<string, ApiYamlDocumentV1[]>()

  for (const document of index.byId.values()) {

    switch (document.type) {

      case "class":
      case "interface":
      case "struct":

        if (
          document.base
          && document.base.type.kind === "named"
        ) {

          const key =
            document.base.type.name

          const group =
            derivedTypes.get(key)

          if (group) {
            group.push(document)
          } else {
            derivedTypes.set(key, [document])
          }
        }

        for (const implemented of document.implements ?? []) {

          if (implemented.type.kind !== "named") {
            continue
          }

          const key =
            implemented.type.name

          const group =
            implementedBy.get(key)

          if (group) {
            group.push(document)
          } else {
            implementedBy.set(key, [document])
          }
        }

        break
    }
  }

  for (const [key, value] of derivedTypes) {
    derivedTypes.set(
      key,
      sortDocumentsByName(value),
    )
  }

  for (const [key, value] of implementedBy) {
    implementedBy.set(
      key,
      sortDocumentsByName(value),
    )
  }

  return {
    derivedTypes,
    implementedBy,
  }
}

export function getDerivedTypes(
  inheritanceIndex: InheritanceIndex,
  typeName: string,
): readonly ApiYamlDocumentV1[] {

  return (
    inheritanceIndex.derivedTypes.get(typeName)
    ?? []
  )
}

export function getImplementedBy(
  inheritanceIndex: InheritanceIndex,
  interfaceName: string,
): readonly ApiYamlDocumentV1[] {

  return (
    inheritanceIndex.implementedBy.get(interfaceName)
    ?? []
  )
}