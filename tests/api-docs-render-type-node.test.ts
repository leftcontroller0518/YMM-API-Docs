import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { renderTypeNode } from "@/lib/api-docs/render-type-node"
import type { TypeNode } from "@/lib/api-docs/type-node"

describe("renderTypeNode", () => {

  describe("Named", () => {
    it("完全修飾名をそのまま返す", () => {
      const node: TypeNode = {
        type: { kind: "named", name: "System.String" },
      }
      assert.equal(renderTypeNode(node), "System.String")
    })

    it("nullable named に ? を付与する", () => {
      const node: TypeNode = {
        type: { kind: "named", name: "System.String" },
        nullable: true,
      }
      assert.equal(renderTypeNode(node), "System.String?")
    })

    it("nullable: false は ? を付与しない", () => {
      const node: TypeNode = {
        type: { kind: "named", name: "System.Int32" },
        nullable: false,
      }
      assert.equal(renderTypeNode(node), "System.Int32")
    })
  })

  describe("GenericParameter", () => {
    it("型パラメータ名をそのまま返す", () => {
      const node: TypeNode = {
        type: { kind: "genericParameter", name: "T" },
      }
      assert.equal(renderTypeNode(node), "T")
    })

    it("nullable genericParameter に ? を付与する", () => {
      const node: TypeNode = {
        type: { kind: "genericParameter", name: "T" },
        nullable: true,
      }
      assert.equal(renderTypeNode(node), "T?")
    })
  })

  describe("Generic（genericArguments）", () => {
    it("単一 generic 引数を展開する", () => {
      // Task<FrameBuffer>
      const node: TypeNode = {
        type: { kind: "named", name: "System.Threading.Tasks.Task" },
        genericArguments: [
          { type: { kind: "named", name: "YukkuriMovieMaker.Plugin.FrameBuffer" } },
        ],
      }
      assert.equal(
        renderTypeNode(node),
        "System.Threading.Tasks.Task<YukkuriMovieMaker.Plugin.FrameBuffer>",
      )
    })

    it("複数 generic 引数をカンマ区切りで展開する", () => {
      // Dictionary<string, int>
      const node: TypeNode = {
        type: { kind: "named", name: "System.Collections.Generic.Dictionary" },
        genericArguments: [
          { type: { kind: "named", name: "System.String" } },
          { type: { kind: "named", name: "System.Int32" } },
        ],
      }
      assert.equal(
        renderTypeNode(node),
        "System.Collections.Generic.Dictionary<System.String, System.Int32>",
      )
    })

    it("nullable な generic 型に ? を付与する", () => {
      // List<string>?
      const node: TypeNode = {
        type: { kind: "named", name: "System.Collections.Generic.List" },
        genericArguments: [
          { type: { kind: "named", name: "System.String" } },
        ],
        nullable: true,
      }
      assert.equal(
        renderTypeNode(node),
        "System.Collections.Generic.List<System.String>?",
      )
    })
  })

  describe("Nested Generic", () => {
    it("Dictionary<string, List<T?>> を正しく復元する", () => {
      const node: TypeNode = {
        type: { kind: "named", name: "System.Collections.Generic.Dictionary" },
        genericArguments: [
          { type: { kind: "named", name: "System.String" } },
          {
            type: { kind: "named", name: "System.Collections.Generic.List" },
            genericArguments: [
              {
                type: { kind: "genericParameter", name: "T" },
                nullable: true,
              },
            ],
          },
        ],
      }
      assert.equal(
        renderTypeNode(node),
        "System.Collections.Generic.Dictionary<System.String, System.Collections.Generic.List<T?>>",
      )
    })

    it("3段ネストを正しく復元する", () => {
      // List<List<List<int>>>
      const node: TypeNode = {
        type: { kind: "named", name: "System.Collections.Generic.List" },
        genericArguments: [
          {
            type: { kind: "named", name: "System.Collections.Generic.List" },
            genericArguments: [
              {
                type: { kind: "named", name: "System.Collections.Generic.List" },
                genericArguments: [
                  { type: { kind: "named", name: "System.Int32" } },
                ],
              },
            ],
          },
        ],
      }
      assert.equal(
        renderTypeNode(node),
        "System.Collections.Generic.List<System.Collections.Generic.List<System.Collections.Generic.List<System.Int32>>>",
      )
    })
  })

  describe("Array", () => {
    it("配列型を [] で表現する", () => {
      // FrameBuffer[]
      const node: TypeNode = {
        type: {
          kind: "array",
          elementType: { type: { kind: "named", name: "YukkuriMovieMaker.Plugin.FrameBuffer" } },
        },
      }
      assert.equal(renderTypeNode(node), "YukkuriMovieMaker.Plugin.FrameBuffer[]")
    })

    it("nullable array（配列自体が null）に ? を付与する", () => {
      // int[]?
      const node: TypeNode = {
        type: {
          kind: "array",
          elementType: { type: { kind: "named", name: "System.Int32" } },
        },
        nullable: true,
      }
      assert.equal(renderTypeNode(node), "System.Int32[]?")
    })

    it("array of nullable（要素が null）を正しく表現する", () => {
      // int?[]
      const node: TypeNode = {
        type: {
          kind: "array",
          elementType: {
            type: { kind: "named", name: "System.Int32" },
            nullable: true,
          },
        },
      }
      assert.equal(renderTypeNode(node), "System.Int32?[]")
    })

    it("nullable array of nullable（配列も要素も null）を正しく表現する", () => {
      // int?[]?
      const node: TypeNode = {
        type: {
          kind: "array",
          elementType: {
            type: { kind: "named", name: "System.Int32" },
            nullable: true,
          },
        },
        nullable: true,
      }
      assert.equal(renderTypeNode(node), "System.Int32?[]?")
    })

    it("ジェネリック要素の配列を正しく表現する", () => {
      // List<string>[]
      const node: TypeNode = {
        type: {
          kind: "array",
          elementType: {
            type: { kind: "named", name: "System.Collections.Generic.List" },
            genericArguments: [
              { type: { kind: "named", name: "System.String" } },
            ],
          },
        },
      }
      assert.equal(renderTypeNode(node), "System.Collections.Generic.List<System.String>[]")
    })
  })

  describe("Tuple", () => {
    it("名前付き tuple を正しく表現する", () => {
      // (int width, int height)
      const node: TypeNode = {
        type: {
          kind: "tuple",
          elements: [
            { name: "width", type: { kind: "named", name: "System.Int32" } },
            { name: "height", type: { kind: "named", name: "System.Int32" } },
          ],
        },
      }
      assert.equal(renderTypeNode(node), "(width: System.Int32, height: System.Int32)")
    })

    it("名前なし tuple を正しく表現する", () => {
      // (int, string)
      const node: TypeNode = {
        type: {
          kind: "tuple",
          elements: [
            { type: { kind: "named", name: "System.Int32" } },
            { type: { kind: "named", name: "System.String" } },
          ],
        },
      }
      assert.equal(renderTypeNode(node), "(System.Int32, System.String)")
    })

    it("nullable tuple に ? を付与する", () => {
      // (int width, int height)?
      const node: TypeNode = {
        type: {
          kind: "tuple",
          elements: [
            { name: "width", type: { kind: "named", name: "System.Int32" } },
            { name: "height", type: { kind: "named", name: "System.Int32" } },
          ],
        },
        nullable: true,
      }
      assert.equal(renderTypeNode(node), "(width: System.Int32, height: System.Int32)?")
    })

    it("tuple 要素の nullable を個別に表現する", () => {
      // (int width, string? label)
      const node: TypeNode = {
        type: {
          kind: "tuple",
          elements: [
            { name: "width", type: { kind: "named", name: "System.Int32" } },
            { name: "label", type: { kind: "named", name: "System.String" }, nullable: true },
          ],
        },
      }
      assert.equal(renderTypeNode(node), "(width: System.Int32, label: System.String?)")
    })

    it("名前あり・なし混在 tuple を正しく表現する", () => {
      // (int, string label)
      const node: TypeNode = {
        type: {
          kind: "tuple",
          elements: [
            { type: { kind: "named", name: "System.Int32" } },
            { name: "label", type: { kind: "named", name: "System.String" } },
          ],
        },
      }
      assert.equal(renderTypeNode(node), "(System.Int32, label: System.String)")
    })
  })

  describe("複合ケース", () => {
    it("仕様12代表例: Dictionary<string, List<T?>>", () => {
      const node: TypeNode = {
        type: { kind: "named", name: "System.Collections.Generic.Dictionary" },
        genericArguments: [
          { type: { kind: "named", name: "System.String" } },
          {
            type: { kind: "named", name: "System.Collections.Generic.List" },
            genericArguments: [
              { type: { kind: "genericParameter", name: "T" }, nullable: true },
            ],
          },
        ],
      }
      assert.equal(
        renderTypeNode(node),
        "System.Collections.Generic.Dictionary<System.String, System.Collections.Generic.List<T?>>",
      )
    })

    it("Task<(string name, int age)?>: ジェネリック引数に nullable tuple", () => {
      const node: TypeNode = {
        type: { kind: "named", name: "System.Threading.Tasks.Task" },
        genericArguments: [
          {
            type: {
              kind: "tuple",
              elements: [
                { name: "name", type: { kind: "named", name: "System.String" } },
                { name: "age", type: { kind: "named", name: "System.Int32" } },
              ],
            },
            nullable: true,
          },
        ],
      }
      assert.equal(
        renderTypeNode(node),
        "System.Threading.Tasks.Task<(name: System.String, age: System.Int32)?>",
      )
    })

    it("(string[], int?) tuple 要素に array と nullable を持つ", () => {
      const node: TypeNode = {
        type: {
          kind: "tuple",
          elements: [
            {
              name: "tags",
              type: {
                kind: "array",
                elementType: { type: { kind: "named", name: "System.String" } },
              },
            },
            {
              name: "count",
              type: { kind: "named", name: "System.Int32" },
              nullable: true,
            },
          ],
        },
      }
      assert.equal(renderTypeNode(node), "(tags: System.String[], count: System.Int32?)")
    })

    it("U Convert<U>(T value) の返戻型 U", () => {
      const node: TypeNode = {
        type: { kind: "genericParameter", name: "U" },
      }
      assert.equal(renderTypeNode(node), "U")
    })

    it("Dictionary<string, int[]?>: ジェネリック引数に nullable array", () => {
      const node: TypeNode = {
        type: { kind: "named", name: "System.Collections.Generic.Dictionary" },
        genericArguments: [
          { type: { kind: "named", name: "System.String" } },
          {
            type: {
              kind: "array",
              elementType: { type: { kind: "named", name: "System.Int32" } },
            },
            nullable: true,
          },
        ],
      }
      assert.equal(
        renderTypeNode(node),
        "System.Collections.Generic.Dictionary<System.String, System.Int32[]?>",
      )
    })
  })

})