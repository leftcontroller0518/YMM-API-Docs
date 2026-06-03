import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  ApiYamlDocumentV1Schema,
  ParameterSchema,
  TypeReferenceSchema,
} from "../lib/api-docs/yaml-v1-schema"

const namedString = {
  type: {
    kind: "named",
    name: "System.String",
  },
}

describe("ApiYamlDocumentV1Schema", () => {
  it("accepts a namespace document", () => {
    const result = ApiYamlDocumentV1Schema.safeParse({
      id: "N:YukkuriMovieMaker.Plugin",
      type: "namespace",
      name: "YukkuriMovieMaker.Plugin",
      namespace: "YukkuriMovieMaker.Plugin",
      summary: "プラグイン API の名前空間。",
    })

    assert.equal(result.success, true)
  })

  it("accepts a class document with TypeNode inheritance and implements", () => {
    const result = ApiYamlDocumentV1Schema.safeParse({
      id: "T:YukkuriMovieMaker.Plugin.VideoNode",
      type: "class",
      name: "YukkuriMovieMaker.Plugin.VideoNode",
      namespace: "YukkuriMovieMaker.Plugin",
      summary: "動画フレームを処理するノード。",
      assembly: "YukkuriMovieMaker.Plugin.dll",
      since: "4.40",
      accessibility: "public",
      base: {
        type: {
          kind: "named",
          name: "YukkuriMovieMaker.Plugin.NodeBase",
        },
      },
      externalInheritance: [
        {
          type: {
            kind: "named",
            name: "System.Object",
          },
        },
      ],
      implements: [
        {
          type: {
            kind: "named",
            name: "System.IDisposable",
          },
        },
      ],
    })

    assert.equal(result.success, true)
  })

  it("accepts a method document with declaringType, parameters, returns, remarks, and examples", () => {
    const result = ApiYamlDocumentV1Schema.safeParse({
      id: "M:YukkuriMovieMaker.Plugin.VideoNode.Process(YukkuriMovieMaker.FrameBuffer)",
      type: "method",
      name: "YukkuriMovieMaker.Plugin.VideoNode.Process",
      namespace: "YukkuriMovieMaker.Plugin",
      summary: "動画フレームを処理します。",
      accessibility: "public",
      declaringType: {
        id: "T:YukkuriMovieMaker.Plugin.VideoNode",
      },
      parameters: [
        {
          name: "buffer",
          modifier: "ref",
          type: {
            kind: "named",
            name: "YukkuriMovieMaker.FrameBuffer",
          },
        },
      ],
      returns: {
        type: {
          kind: "named",
          name: "System.Threading.Tasks.Task",
        },
        genericArguments: [
          {
            type: {
              kind: "named",
              name: "YukkuriMovieMaker.FrameBuffer",
            },
          },
        ],
      },
      remarks: "## 概要\n\nフレームを加工します。",
      examples: "```csharp\nnode.Process(buffer);\n```",
    })

    assert.equal(result.success, true)
  })

  it("accepts nested generic, nullable, array, and tuple type references", () => {
    const result = TypeReferenceSchema.safeParse({
      type: {
        kind: "named",
        name: "System.Collections.Generic.Dictionary",
      },
      nullable: true,
      genericArguments: [
        namedString,
        {
          type: {
            kind: "array",
            elementType: {
              type: {
                kind: "tuple",
                elements: [
                  {
                    name: "name",
                    type: {
                      kind: "named",
                      name: "System.String",
                    },
                  },
                  {
                    name: "age",
                    type: {
                      kind: "named",
                      name: "System.Int32",
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    })

    assert.equal(result.success, true)
  })

  it("rejects a member document without declaringType", () => {
    const result = ApiYamlDocumentV1Schema.safeParse({
      id: "P:YukkuriMovieMaker.Plugin.VideoNode.Input",
      type: "property",
      name: "YukkuriMovieMaker.Plugin.VideoNode.Input",
      namespace: "YukkuriMovieMaker.Plugin",
      summary: "入力を取得します。",
    })

    assert.equal(result.success, false)
  })

  it("rejects an id prefix that does not match document type", () => {
    const result = ApiYamlDocumentV1Schema.safeParse({
      id: "T:YukkuriMovieMaker.Plugin",
      type: "namespace",
      name: "YukkuriMovieMaker.Plugin",
      namespace: "YukkuriMovieMaker.Plugin",
      summary: "プラグイン API の名前空間。",
    })

    assert.equal(result.success, false)
  })

  it("rejects unsupported document fields", () => {
    const result = ApiYamlDocumentV1Schema.safeParse({
      id: "N:YukkuriMovieMaker.Plugin",
      type: "namespace",
      name: "YukkuriMovieMaker.Plugin",
      namespace: "YukkuriMovieMaker.Plugin",
      summary: "プラグイン API の名前空間。",
      title: "legacy title",
    })

    assert.equal(result.success, false)
  })
})

describe("ParameterSchema", () => {
  it("accepts ref, out, and in modifiers", () => {
    for (const modifier of ["ref", "out", "in"] as const) {
      const result = ParameterSchema.safeParse({
        name: "value",
        modifier,
        type: {
          kind: "named",
          name: "System.String",
        },
      })

      assert.equal(result.success, true)
    }
  })

  it("rejects unknown modifiers", () => {
    const result = ParameterSchema.safeParse({
      name: "value",
      modifier: "params",
      type: {
        kind: "named",
        name: "System.String",
      },
    })

    assert.equal(result.success, false)
  })
})
