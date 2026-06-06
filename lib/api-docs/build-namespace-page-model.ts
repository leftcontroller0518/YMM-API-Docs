import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"
import type { SymbolIndex } from "./symbol-index"
import { getChildNamespaces } from "./get-child-namespaces"
import { getTypesInNamespace } from "./get-types-in-namespace"
import { groupTypesByKind } from "./group-types-by-kind"

export interface NamespacePageModel {

  readonly namespace: ApiYamlDocumentV1

  readonly children: readonly ApiYamlDocumentV1[]

  readonly classes: readonly ApiYamlDocumentV1[]

  readonly interfaces: readonly ApiYamlDocumentV1[]

  readonly structs: readonly ApiYamlDocumentV1[]

  readonly enums: readonly ApiYamlDocumentV1[]

  readonly delegates: readonly ApiYamlDocumentV1[]
}


export class NamespaceNotFoundError extends Error {

  constructor(
    readonly namespaceName: string,
  ) {
    super(`Namespace not found: ${namespaceName}`)
  }
}

export function getNamespaceDocument(
  index: SymbolIndex,
  namespaceName: string,
): ApiYamlDocumentV1 {

  for (const document of index.byId.values()) {

    if (
      document.type === "namespace"
      && document.name === namespaceName
    ) {
      return document
    }
  }

  throw new NamespaceNotFoundError(namespaceName)
}

export function buildNamespacePageModel(
  index: SymbolIndex,
  namespaceName: string,
): NamespacePageModel {

  const namespace =
    getNamespaceDocument(
      index,
      namespaceName,
    )

  const children =
    getChildNamespaces(
      index,
      namespaceName,
    )

  const types =
    getTypesInNamespace(
      index,
      namespaceName,
    )

  const grouped =
    groupTypesByKind(types)

  return {
    namespace,
    children,
    classes: grouped.classes,
    interfaces: grouped.interfaces,
    structs: grouped.structs,
    enums: grouped.enums,
    delegates: grouped.delegates,
  }
}
