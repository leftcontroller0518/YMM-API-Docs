import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  ApiYamlDocumentV1Schema,
  NamespaceDocumentSchema,
  ClassDocumentSchema,
  MethodDocumentSchema,
} from "@/lib/api-docs/yaml-v1-schema"

// -------------------------------------------------------------------
// ヘルパー
// -------------------------------------------------------------------

function valid(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown, label: string) {
  const result = schema.safeParse(value)
  assert.ok(result.success, `${label} は valid であるべきだが invalid だった`)
}

function invalid(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown, label: string) {
  const result = schema.safeParse(value)
  assert.ok(!result.success, `${label} は invalid であるべきだが valid だった`)
}

// -------------------------------------------------------------------
// 基底ドキュメント
// -------------------------------------------------------------------

const baseNamespace = {
  id: "N:Foo",
  type: "namespace",
  name: "Foo",
  summary: "テスト用名前空間。",
} as const

const baseClass = {
  id: "T:Foo.Bar",
  type: "class",
  name: "Foo.Bar",
  namespace: "Foo",
  summary: "テスト用クラス。",
  accessibility: "public",
} as const

const baseMethod = {
  id: "M:Foo.Bar.Do",
  type: "method",
  name: "Do",
  namespace: "Foo",
  summary: "テスト用メソッド。",
  accessibility: "public",
  declaringType: { id: "T:Foo.Bar" },
  returns: { type: { kind: "named", name: "System.Void" } },
} as const

// -------------------------------------------------------------------
// 1. メンバー name 規則
// -------------------------------------------------------------------

describe("メンバー name 規則（意味論の文書化）", () => {
  it("method の name はメンバー名のみが正しい意味論", () => {
    valid(MethodDocumentSchema, baseMethod, "name: Do")
  })

  it("スキーマは name に . を含む文字列を技術的には拒否しない（意味論的制約はスキーマ外）", () => {
    // スキーマは文字列の内容を制限しないため valid になる。
    // これは意図的な設計であり、仕様が要求するのは「メンバー名のみ」という意味論であって
    // 「. を含んではならない」という文字列制約ではない。
    valid(MethodDocumentSchema, { ...baseMethod, name: "Foo.Bar.Do" }, "name: Foo.Bar.Do（スキーマは許容）")
  })
})

// -------------------------------------------------------------------
// 2. namespace の namespace フィールド（自己参照禁止）
// -------------------------------------------------------------------

describe("namespace 自己参照禁止", () => {
  it("namespace フィールドが自身の name と異なる場合は valid", () => {
    valid(NamespaceDocumentSchema, {
      ...baseNamespace,
      id: "N:Foo.Bar",
      name: "Foo.Bar",
      namespace: "Foo",
    }, "namespace: Foo（親）")
  })

  it("namespace フィールドが自身の name と同じ場合は invalid（自己参照）", () => {
    invalid(NamespaceDocumentSchema, {
      ...baseNamespace,
      id: "N:Foo.Bar",
      name: "Foo.Bar",
      namespace: "Foo.Bar",
    }, "namespace: Foo.Bar（自己参照）")
  })

  it("ルート namespace は namespace フィールドなしで valid", () => {
    valid(NamespaceDocumentSchema, baseNamespace, "ルートnamespace（namespaceフィールドなし）")
  })
})

// -------------------------------------------------------------------
// 3. namespace name 整合性（name == id から N: を除いた文字列）
// -------------------------------------------------------------------

describe("namespace name 整合性", () => {
  it("name が id から N: を除いた文字列と一致する場合は valid", () => {
    valid(NamespaceDocumentSchema, {
      id: "N:YukkuriMovieMaker.Plugin",
      type: "namespace",
      name: "YukkuriMovieMaker.Plugin",
      namespace: "YukkuriMovieMaker",
      summary: "プラグイン名前空間。",
    }, "name == id[2:]")
  })

  it("name が id から N: を除いた文字列と一致しない場合は invalid", () => {
    invalid(NamespaceDocumentSchema, {
      id: "N:YukkuriMovieMaker.Plugin",
      type: "namespace",
      name: "YukkuriMovieMaker.Plugin.Something",
      namespace: "YukkuriMovieMaker",
      summary: "プラグイン名前空間。",
    }, "name != id[2:]")
  })

  it("ルート namespace で name と id が整合する場合は valid", () => {
    valid(NamespaceDocumentSchema, {
      id: "N:YukkuriMovieMaker",
      type: "namespace",
      name: "YukkuriMovieMaker",
      summary: "ルート名前空間。",
    }, "ルートで name == id[2:]")
  })
})

// -------------------------------------------------------------------
// 4. 空リスト禁止（全リスト型フィールド）
// -------------------------------------------------------------------

describe("空リスト禁止", () => {
  describe("externalInheritance", () => {
    it("要素ありは valid", () => {
      valid(ClassDocumentSchema, {
        ...baseClass,
        externalInheritance: [{ type: { kind: "named", name: "System.Object" } }],
      }, "externalInheritance 要素あり")
    })

    it("空リストは invalid", () => {
      invalid(ClassDocumentSchema, {
        ...baseClass,
        externalInheritance: [],
      }, "externalInheritance: []")
    })

    it("フィールド省略は valid", () => {
      valid(ClassDocumentSchema, baseClass, "externalInheritance 省略")
    })
  })

  describe("implements", () => {
    it("要素ありは valid", () => {
      valid(ClassDocumentSchema, {
        ...baseClass,
        implements: [{ type: { kind: "named", name: "System.IDisposable" } }],
      }, "implements 要素あり")
    })

    it("空リストは invalid", () => {
      invalid(ClassDocumentSchema, {
        ...baseClass,
        implements: [],
      }, "implements: []")
    })

    it("フィールド省略は valid", () => {
      valid(ClassDocumentSchema, baseClass, "implements 省略")
    })
  })

  describe("genericParameters", () => {
    it("要素ありは valid", () => {
      valid(ClassDocumentSchema, {
        ...baseClass,
        genericParameters: ["T"],
      }, "genericParameters 要素あり")
    })

    it("空リストは invalid", () => {
      invalid(ClassDocumentSchema, {
        ...baseClass,
        genericParameters: [],
      }, "genericParameters: []")
    })

    it("フィールド省略は valid", () => {
      valid(ClassDocumentSchema, baseClass, "genericParameters 省略")
    })
  })

  describe("parameters", () => {
    it("要素ありは valid", () => {
      valid(MethodDocumentSchema, {
        ...baseMethod,
        parameters: [{ name: "x", type: { type: { kind: "named", name: "System.Int32" } } }],
      }, "parameters 要素あり")
    })

    it("空リストは invalid", () => {
      invalid(MethodDocumentSchema, {
        ...baseMethod,
        parameters: [],
      }, "parameters: []")
    })

    it("フィールド省略は valid", () => {
      valid(MethodDocumentSchema, baseMethod, "parameters 省略")
    })
  })

  describe("genericArguments（TypeNode 内）", () => {
    it("要素ありは valid", () => {
      valid(MethodDocumentSchema, {
        ...baseMethod,
        returns: {
          type: { kind: "named", name: "System.Collections.Generic.List" },
          genericArguments: [{ type: { kind: "named", name: "System.String" } }],
        },
      }, "genericArguments 要素あり")
    })

    it("空リストは invalid", () => {
      invalid(MethodDocumentSchema, {
        ...baseMethod,
        returns: {
          type: { kind: "named", name: "System.Collections.Generic.List" },
          genericArguments: [],
        },
      }, "genericArguments: []")
    })

    it("フィールド省略は valid", () => {
      valid(MethodDocumentSchema, {
        ...baseMethod,
        returns: {
          type: { kind: "named", name: "System.Collections.Generic.List" },
        },
      }, "genericArguments 省略")
    })
  })
})

// -------------------------------------------------------------------
// 5. namespace 一意性（スキーマ範囲外）
// -------------------------------------------------------------------

describe("namespace 一意性（スキーマ範囲外の注記）", () => {
  it("同一 name の namespace ドキュメントはそれぞれ単独では valid（一意性はビルド時検証）", () => {
    // SymbolIndex 構築時に重複を検出する。
    // スキーマは単一ドキュメントの構造のみを検証するため、
    // この制約はスキーマレベルでは検証できない。
    const doc = {
      id: "N:Foo",
      type: "namespace",
      name: "Foo",
      summary: "テスト用。",
    }
    valid(NamespaceDocumentSchema, doc, "単独では valid")
    valid(NamespaceDocumentSchema, { ...doc }, "同一内容の別インスタンスも単独では valid")
  })
})