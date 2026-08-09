import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildSymbolIndex } from "@/lib/api-docs/symbol-index"
import { buildInheritanceIndex, getDerivedTypes, getImplementedBy } from "@/lib/api-docs/inheritance-index"
import { buildOverloadIndex } from "@/lib/api-docs/overload-group"
import { buildNamespacePageModel } from "@/lib/api-docs/build-namespace-page-model"
import { resolveTypeLink } from "@/lib/api-docs/resolve-type-link"

import type { ApiYamlDocumentV1 } from "@/lib/api-docs/yaml-v1-schema"

const documents: ApiYamlDocumentV1[] = [
  {
    id: "N:Foo",
    type: "namespace",
    name: "Foo",
    summary: "Foo namespace",
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
      type: {
        kind: "named",
        name: "Foo.NodeBase",
      },
    },
    implements: [
      {
        type: {
          kind: "named",
          name: "Foo.IVideoNode",
        },
      },
    ],
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
    id: "M:Foo.VideoNode.Process()",
    type: "method",
    name: "Process",
    namespace: "Foo",
    accessibility: "public",
    summary: "Process",
    declaringType: {
      id: "T:Foo.VideoNode",
    },
    returns: {
      type: {
        kind: "named",
        name: "System.Void",
      },
    },
  },
]

describe("Integration", () => {

  it("buildSymbolIndex indexes all documents", () => {

    const index = buildSymbolIndex([...documents])

    assert.equal(index.byId.size, 5)
    assert.ok(index.byId.has("N:Foo"))
    assert.ok(index.byId.has("T:Foo.NodeBase"))
    assert.ok(index.byId.has("T:Foo.VideoNode"))
    assert.ok(index.byId.has("T:Foo.IVideoNode"))
    assert.ok(index.byId.has("M:Foo.VideoNode.Process()"))
  })

  it("buildInheritanceIndex resolves derived types", () => {

    const index = buildSymbolIndex([...documents])
    const inheritance = buildInheritanceIndex(index)

    const derived = getDerivedTypes(inheritance, "Foo.NodeBase")
    assert.equal(derived.length, 1)
    assert.equal(derived[0].name, "Foo.VideoNode")
  })

  it("buildInheritanceIndex resolves implementedBy", () => {

    const index = buildSymbolIndex([...documents])
    const inheritance = buildInheritanceIndex(index)

    const implemented = getImplementedBy(inheritance, "Foo.IVideoNode")
    assert.equal(implemented.length, 1)
    assert.equal(implemented[0].name, "Foo.VideoNode")
  })

  it("buildOverloadIndex groups Process method", () => {

    const index = buildSymbolIndex([...documents])
    const overloads = buildOverloadIndex(index)

    assert.equal(overloads.groups.size, 1)

    const key = "T:Foo.VideoNode::Process"
    const group = overloads.groups.get(key)
    assert.ok(group)
    assert.equal(group.length, 1)
  })

  it("buildNamespacePageModel returns correct type counts", () => {

    const index = buildSymbolIndex([...documents])
    const model = buildNamespacePageModel(index, "Foo")

    assert.equal(model.classes.length, 2)
    assert.equal(model.interfaces.length, 1)
    assert.equal(model.structs.length, 0)
    assert.equal(model.enums.length, 0)
    assert.equal(model.delegates.length, 0)
    assert.equal(model.children.length, 0)
  })

  it("resolveTypeLink returns url for known type", () => {

    const index = buildSymbolIndex([...documents])

    const result = resolveTypeLink(
      {
        type: {
          kind: "named",
          name: "Foo.NodeBase",
        },
      },
      index,
    )

    assert.equal(result.text, "Foo.NodeBase")
    assert.equal(result.url, "/reference/T%3AFoo.NodeBase")
  })

  it("resolveTypeLink returns no url for external type", () => {

    const index = buildSymbolIndex([...documents])

    const result = resolveTypeLink(
      {
        type: {
          kind: "named",
          name: "System.Object",
        },
      },
      index,
    )

    assert.equal(result.text, "System.Object")
    assert.equal(result.url, undefined)
  })
})