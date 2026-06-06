import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"
import type { SymbolIndex } from "./symbol-index"
import type { InheritanceIndex } from "./inheritance-index"
import type { OverloadIndex } from "./overload-group"
import type { TypeNode } from "./type-node"
import { sortDocumentsByName } from "./sort-documents-by-name"
import { getInheritanceChain } from "./get-inheritance-info"
import { getDerivedTypes, getImplementedBy } from "./inheritance-index"
import { getOverloadGroup } from "./overload-group"

export class TypeNotFoundError extends Error {
  constructor(
    readonly typeId: string,
  ) {
    super(`Type not found: ${typeId}`)
    this.name = "TypeNotFoundError"
  }
}

export interface OverloadGroup {
  readonly name: string
  readonly methods: readonly ApiYamlDocumentV1[]
}

export interface TypePageModel {
  readonly document: ApiYamlDocumentV1
  readonly inheritanceChain: readonly TypeNode[]
  readonly implements: readonly TypeNode[]
  readonly derivedTypes: readonly ApiYamlDocumentV1[]
  readonly implementedBy: readonly ApiYamlDocumentV1[]
  readonly methods: readonly OverloadGroup[]
  readonly properties: readonly ApiYamlDocumentV1[]
  readonly fields: readonly ApiYamlDocumentV1[]
  readonly events: readonly ApiYamlDocumentV1[]
}

export function buildTypePageModel(
  symbolIndex: SymbolIndex,
  inheritanceIndex: InheritanceIndex,
  overloadIndex: OverloadIndex,
  typeId: string,
): TypePageModel {

  const document = symbolIndex.byId.get(typeId)

  if (document === undefined) {
    throw new TypeNotFoundError(typeId)
  }

  const inheritanceChain = getInheritanceChain(document)

  const implementsList: TypeNode[] =
    (document.type === "class"
      || document.type === "interface"
      || document.type === "struct")
      ? (document.implements ?? [])
      : []

  const typeName =
    document.type === "class"
    || document.type === "interface"
    || document.type === "struct"
    || document.type === "enum"
    || document.type === "delegate"
      ? document.name
      : undefined

  const derivedTypes =
    typeName !== undefined
      ? getDerivedTypes(inheritanceIndex, typeName)
      : []

  const implementedBy =
    typeName !== undefined
      ? getImplementedBy(inheritanceIndex, typeName)
      : []

  const allMembers = [...symbolIndex.byId.values()]
    .filter(doc =>
      (doc.type === "method"
        || doc.type === "property"
        || doc.type === "field"
        || doc.type === "event")
      && doc.declaringType.id === typeId,
    )

  const rawMethods = sortDocumentsByName(
    allMembers.filter(doc => doc.type === "method"),
  )

  const seenGroups = new Set<string>()
  const methods: OverloadGroup[] = []

  for (const method of rawMethods) {
    const group = getOverloadGroup(overloadIndex, method)
    const key = `${method.declaringType.id}::${method.name}`

    if (seenGroups.has(key)) {
      continue
    }

    seenGroups.add(key)
    methods.push({
      name: method.name,
      methods: group,
    })
  }

  const properties = sortDocumentsByName(
    allMembers.filter(doc => doc.type === "property"),
  )

  const fields = sortDocumentsByName(
    allMembers.filter(doc => doc.type === "field"),
  )

  const events = sortDocumentsByName(
    allMembers.filter(doc => doc.type === "event"),
  )

  return {
    document,
    inheritanceChain,
    implements: implementsList,
    derivedTypes,
    implementedBy,
    methods,
    properties,
    fields,
    events,
  }
}