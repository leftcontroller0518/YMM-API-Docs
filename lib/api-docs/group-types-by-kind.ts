import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"
import {sortDocumentsByName} from "@/lib/api-docs/sort-documents-by-name";

export interface NamespaceTypeGroups {
  readonly classes: ApiYamlDocumentV1[]
  readonly interfaces: ApiYamlDocumentV1[]
  readonly structs: ApiYamlDocumentV1[]
  readonly enums: ApiYamlDocumentV1[]
  readonly delegates: ApiYamlDocumentV1[]
}

export function groupTypesByKind(
  documents: readonly ApiYamlDocumentV1[],
): NamespaceTypeGroups {

  return {
    classes: sortDocumentsByName(
      documents.filter(x => x.type === "class"),
    ),

    interfaces: sortDocumentsByName(
      documents.filter(x => x.type === "interface"),
    ),

    structs: sortDocumentsByName(
      documents.filter(x => x.type === "struct"),
    ),

    enums: sortDocumentsByName(
      documents.filter(x => x.type === "enum"),
    ),

    delegates: sortDocumentsByName(
      documents.filter(x => x.type === "delegate"),
    ),
  }
}