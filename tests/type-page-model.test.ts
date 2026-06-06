import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildSymbolIndex } from "@/lib/api-docs/symbol-index"
import { buildInheritanceIndex } from "@/lib/api-docs/inheritance-index"
import { buildOverloadIndex } from "@/lib/api-docs/overload-group"
import {
  buildTypePageModel,
  TypeNotFoundError,
} from "@/lib/api-docs/type-page-model"
import type { ApiYamlDocumentV1 } from "@/lib/api-docs/yaml-v1-schema"

const documents: ApiYamlDocumentV1[] = [
  {
    id: "N:Foo",
    type: "namespace",
    name: "Foo",
    summary: "Foo",
  },
  {
    id: "T:Foo.IVideoNode",
    type: "interface",
    name: "Foo.IVideoNode",
    namespace: "Foo",
    accessibility: "public",
    summary: "IVideoNode",
  },
  {
    id: "T:Foo.NodeBase",
    type: "class",
    name: "Foo.NodeBase",
    namespace: "Foo",
    accessibility: "public",
    summary: "NodeBase",
  },
  {
    id: "T:Foo.VideoNode",
    type: "class",
    name: "Foo.VideoNode",
    namespace: "Foo",
    accessibility: "public",
    summary: "VideoNode",
    base: {
      type: { kind: "named", name: "Foo.NodeBase" },
    },
    implements: [
      { type: { kind: "named", name: "Foo.IVideoNode" } },
    ],
  },
  {
    id: "M:Foo.VideoNode.Process(System.Int32)",
    type: "method",
    name: "Process",
    namespace: "Foo",
    accessibility: "public",
    summary: "Process int",
    declaringType: { id: "T:Foo.VideoNode" },
    returns: { type: { kind: "named", name: "System.Void" } },
  },
  {
    id: "M:Foo.VideoNode.Process(System.String)",
    type: "method",
    name: "Process",
    namespace: "Foo",
    accessibility: "public",
    summary: "Process string",
    declaringType: { id: "T:Foo.VideoNode" },
    returns: { type: { kind: "named", name: "System.Void" } },
  },
  {
    id: "P:Foo.VideoNode.Name",
    type: "property",
    name: "Name",
    namespace: "Foo",
    accessibility: "public",
    summary: "Name",
    declaringType: { id: "T:Foo.VideoNode" },
  },
  {
    id: "F:Foo.VideoNode._count",
    type: "field",
    name: "_count",
    namespace: "Foo",
    accessibility: "private",
    summary: "count",
    declaringType: { id: "T:Foo.VideoNode" },
  },
  {
    id: "E:Foo.VideoNode.Processed",
    type: "event",
    name: "Processed",
    namespace: "Foo",
    accessibility: "public",
    summary: "Processed",
    declaringType: { id: "T:Foo.VideoNode" },
  },
  {
    id: "T:Foo.AudioNode",
    type: "class",
    name: "Foo.AudioNode",
    namespace: "Foo",
    accessibility: "public",
    summary: "AudioNode",
    base: {
      type: { kind: "named", name: "Foo.NodeBase" },
    },
  },
]

function buildIndexes() {
  const symbolIndex = buildSymbolIndex(documents)
  const inheritanceIndex = buildInheritanceIndex(symbolIndex)
  const overloadIndex = buildOverloadIndex(symbolIndex)
  return { symbolIndex, inheritanceIndex, overloadIndex }
}

describe("buildTypePageModel", () => {

  it("throws TypeNotFoundError for unknown typeId", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    assert.throws(
      () => buildTypePageModel(
        symbolIndex,
        inheritanceIndex,
        overloadIndex,
        "T:Foo.Unknown",
      ),
      TypeNotFoundError,
    )
  })

  it("returns document", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.VideoNode",
    )

    assert.equal(model.document.id, "T:Foo.VideoNode")
  })

  it("returns inheritanceChain", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.VideoNode",
    )

    assert.equal(model.inheritanceChain.length, 1)
    assert.equal(
      model.inheritanceChain[0].type.kind === "named"
        ? model.inheritanceChain[0].type.name
        : "",
      "Foo.NodeBase",
    )
  })

  it("returns implements", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.VideoNode",
    )

    assert.equal(model.implements.length, 1)
    assert.equal(
      model.implements[0].type.kind === "named"
        ? model.implements[0].type.name
        : "",
      "Foo.IVideoNode",
    )
  })

  it("returns derivedTypes sorted by name", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.NodeBase",
    )

    assert.equal(model.derivedTypes.length, 2)
    assert.equal(model.derivedTypes[0].name, "Foo.AudioNode")
    assert.equal(model.derivedTypes[1].name, "Foo.VideoNode")
  })

  it("returns implementedBy for interface", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.IVideoNode",
    )

    assert.equal(model.implementedBy.length, 1)
    assert.equal(model.implementedBy[0].name, "Foo.VideoNode")
  })

  it("groups overloaded methods", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.VideoNode",
    )

    assert.equal(model.methods.length, 1)
    assert.equal(model.methods[0].name, "Process")
    assert.equal(model.methods[0].methods.length, 2)
  })

  it("returns properties", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.VideoNode",
    )

    assert.equal(model.properties.length, 1)
    assert.equal(model.properties[0].name, "Name")
  })

  it("returns fields", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.VideoNode",
    )

    assert.equal(model.fields.length, 1)
    assert.equal(model.fields[0].name, "_count")
  })

  it("returns events", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.VideoNode",
    )

    assert.equal(model.events.length, 1)
    assert.equal(model.events[0].name, "Processed")
  })

  it("returns empty members for type with no members", () => {
    const { symbolIndex, inheritanceIndex, overloadIndex } = buildIndexes()

    const model = buildTypePageModel(
      symbolIndex,
      inheritanceIndex,
      overloadIndex,
      "T:Foo.IVideoNode",
    )

    assert.equal(model.methods.length, 0)
    assert.equal(model.properties.length, 0)
    assert.equal(model.fields.length, 0)
    assert.equal(model.events.length, 0)
  })
})