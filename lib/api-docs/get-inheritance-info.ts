import type { TypeNode } from "./type-node"
import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"

export function getInheritanceInfo(
  document: ApiYamlDocumentV1,
): InheritanceInfo {

  switch (document.type) {

    case "class":
    case "interface":
    case "struct":

      return {
        externalInheritance:
          document.externalInheritance
          ?? [],

        base:
        document.base,

        implements:
          document.implements
          ?? [],
      }

    default:

      return {
        externalInheritance: [],
        implements: [],
      }
  }
}

export function getInheritanceChain(
  document: ApiYamlDocumentV1,
): readonly TypeNode[] {

  const info =
    getInheritanceInfo(document)

  return [
    ...info.externalInheritance,
    ...(info.base
      ? [info.base]
      : []),
  ]
}

export interface InheritanceInfo {

  readonly externalInheritance:
    readonly TypeNode[]

  readonly base?:
    TypeNode

  readonly implements:
    readonly TypeNode[]
}