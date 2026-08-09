# YMM API Docs コンテンツ作成ガイド

このドキュメントは `content/` 以下のファイルを作成・編集するすべての人を対象とする。Markdownドキュメントの書き方と、APIリファレンスYAMLの書き方をそれぞれ詳細に説明する。

---

## 目次

1. [ディレクトリ構成](#1-ディレクトリ構成)
2. [Markdownドキュメントの書き方](#2-markdownドキュメントの書き方)
3. [APIリファレンスYAMLの書き方](#3-apiリファレンスyamlの書き方)
4. [TypeNodeの書き方](#4-typenodeの書き方)
5. [SymbolIdの命名規則](#5-symbolidの命名規則)
6. [各ドキュメントタイプのリファレンス](#6-各ドキュメントタイプのリファレンス)
7. [よくあるミスと対処法](#7-よくあるミスと対処法)

---

## 1. ディレクトリ構成

```
content/
├── .md                        # トップページ
├── example/                   # チュートリアル・サンプル解説（Markdown）
│   └── sample/
│       └── video-effect/
│           ├── index.md
│           └── screenshot.png  # ← MDと同じ場所に画像を置く
└── reference/                 # APIリファレンス（YAML）
    └── yukkuri-movie-maker/
        └── plugin/
            ├── index.yaml     # namespace
            └── effects/
                ├── index.yaml # namespace
                ├── i-video-effect/
                │   ├── index.yaml          # interface
                │   ├── property/
                │   │   └── label.yaml      # property
                │   └── method/
                │       └── create-video-effect.yaml  # method
                └── video-effect-base/
                    ├── index.yaml          # class
                    └── method/
                        └── set.yaml        # method
```

**ルール:**

- `index.yaml` または `index.md` がそのディレクトリのページになる。
- namespaceとtype（class/interface等）は `index.yaml`。
- メンバー（method/property/field/event）は `method/`・`property/`・`field/`・`event/` サブディレクトリに個別ファイルで配置する。
- ファイル名はケバブケース（例: `create-video-effect.yaml`）。
- 画像はMDファイルと同じディレクトリに配置し、相対パスで参照する。

---

## 2. Markdownドキュメントの書き方

### 2.1 ファイルの基本構造

```markdown
---
title: "ページタイトル"
description: "ページの説明（OGP等で使用）"
---

# 見出し1（ページタイトル）

本文...
```

フロントマター（`---` で囲まれた部分）はオプション。`title` と `description` を指定できる。

`# 見出し1` はページ上部には表示されない（`remarkRemoveFirstH1` で除去され、フロントマターの `title` または `# 見出し1` のテキストがページタイトルとして別途表示される）。

### 2.2 見出し

```markdown
# 見出し1  ← ページタイトルとして使用・本文中には表示されない
## 見出し2  ← 目次（TOC）に表示される
### 見出し3  ← 目次（TOC）に表示される
#### 見出し4  ← TOCには表示されない
```

`##` と `###` だけが右サイドバーの目次に自動的に表示される。

### 2.3 段落・改行

```markdown
これは1つ目の段落。

これは2つ目の段落。空行で段落を区切る。

行末に2つのスペースを入れると  
この行のように行内で改行できる。
```

### 2.4 強調

```markdown
**太字**
*イタリック*
~~取り消し線~~
`インラインコード`
```

### 2.5 コードブロック

言語名を指定するとシンタックスハイライトが有効になる（Shiki使用）。

````markdown
```csharp
public class VideoEffectBase
{
    public abstract string Label { get; }
}
```
````

````markdown
```yaml
id: "T:Foo.Bar"
type: class
```
````

````markdown
```bash
dotnet build
```
````

言語指定なしの場合はハイライトなし。

````markdown
```
ハイライトなしのコード
```
````

### 2.6 リンク

```markdown
[テキスト](URL)
[相対リンク](../other-page/)
[リファレンスページ](/reference/yukkuri-movie-maker/plugin/effects/video-effect-base/)
[外部リンク](https://example.com)
```

内部リンクは `/` から始まる絶対パスで書く。相対パスも使えるが、ページ移動時にリンク切れになりやすいため絶対パス推奨。

### 2.7 画像

画像はMDファイルと**同じディレクトリ**に配置し、相対パスで参照する。

```
content/
└── example/
    └── my-page/
        ├── index.md
        ├── screenshot.png
        └── diagram.webp
```

```markdown
![スクリーンショットの説明](./screenshot.png)
![構成図](./diagram.webp)
```

サポートする画像形式: `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.avif`

外部URLの画像はそのまま書ける。

```markdown
![外部画像](https://example.com/image.png)
```

### 2.8 テーブル

```markdown
| 列1 | 列2 | 列3 |
| --- | --- | --- |
| セル | セル | セル |
| セル | セル | セル |
```

列の揃え指定:

```markdown
| 左揃え | 中央揃え | 右揃え |
| :--- | :---: | ---: |
| データ | データ | データ |
```

### 2.9 リスト

```markdown
- 箇条書き
- 箇条書き
  - ネスト
  - ネスト

1. 番号付き
2. 番号付き
   1. ネスト
   2. ネスト
```

### 2.10 引用

```markdown
> これは引用文です。
> 複数行にわたる引用も書けます。
>
> 空行を挟んでも引用が続きます。
```

### 2.11 水平線

```markdown
---
```

### 2.12 数式（KaTeX）

インライン数式:

```markdown
$E = mc^2$ という式があります。
```

ブロック数式:

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

### 2.13 脚注

```markdown
本文中に脚注を入れる[^1]。

[^1]: これが脚注の内容です。
```

### 2.14 タスクリスト

```markdown
- [x] 完了したタスク
- [ ] 未完了のタスク
```

### 2.15 GitHubリポジトリへの編集リンク

`siteSetting.ts` で `IS_GITHUB_REPO_EDITABLE = true` かつ `GITHUB_REPO_USERNAME`・`GITHUB_REPO_NAME`・`GITHUB_REPO_BRANCH` が設定されている場合、各ページの末尾に「このページを編集」リンクが自動で表示される。

---

## 3. APIリファレンスYAMLの書き方

### 3.1 基本構造

すべてのリファレンスYAMLは以下の共通フィールドを持つ。

```yaml
id: "プレフィックス:完全修飾シンボル名"
type: "ドキュメントタイプ"
name: "表示名"
namespace: "所属する名前空間"
summary: "一行の説明文"
```

### 3.2 共通フィールド一覧

| フィールド | 必須 | 型 | 説明 |
| --- | --- | --- | --- |
| `id` | 必須 | 文字列 | シンボルID。[命名規則参照](#5-symbolidの命名規則) |
| `type` | 必須 | 文字列 | ドキュメントタイプ。[タイプ一覧参照](#32-typeの値一覧) |
| `name` | 必須 | 文字列 | 表示名。1文字以上 |
| `summary` | 必須 | 文字列 | 1行の概要説明。1文字以上 |
| `namespace` | 条件付き必須 | 文字列 | 所属名前空間。namespaceタイプ以外では必須 |
| `assembly` | 任意 | 文字列 | アセンブリ名（例: `YukkuriMovieMaker.Plugin.dll`） |
| `accessibility` | 任意 | 文字列 | アクセシビリティ修飾子。[値一覧参照](#33-accessibilityの値一覧) |
| `since` | 任意 | 文字列または数値 | 導入バージョン（例: `"4.20.0.0"` または `4.20`） |
| `obsolete` | 任意 | 文字列または数値 | 非推奨になったバージョン |
| `remarks` | 任意 | 文字列 | 詳細な注釈。Markdownが使える |
| `examples` | 任意 | 文字列 | コード例。Markdownが使える |
| `code` | 任意 | 文字列 | C#の宣言コード。コードブロックとして表示される |

### 3.2 typeの値一覧

| 値 | 説明 |
| --- | --- |
| `namespace` | 名前空間 |
| `class` | クラス |
| `interface` | インターフェース |
| `struct` | 構造体 |
| `enum` | 列挙型 |
| `delegate` | デリゲート |
| `method` | メソッド（コンストラクターを含む） |
| `property` | プロパティー |
| `field` | フィールド |
| `event` | イベント |

### 3.3 accessibilityの値一覧

| 値 | C# 修飾子 |
| --- | --- |
| `public` | `public` |
| `protected` | `protected` |
| `internal` | `internal` |
| `private` | `private` |
| `protected internal` | `protected internal` |

### 3.4 remarks と examples にMarkdownを書く

`remarks` と `examples` フィールドにはMarkdownが使える。YAMLの複数行文字列リテラル（`|`）を使って記述する。

````yaml
remarks: |
  このメソッドは**スレッドセーフ**ではありません。

  別途ロックが必要です。

examples: |
  ```csharp
  var effect = new MyEffect();
  effect.Process(devices);
  ```
````

`|` の後ろの文字列は改行がそのまま保持される。インデントはYAMLの規則に従い、`|` の次の行のインデントを基準として除去される。

---

## 4. TypeNodeの書き方

TypeNodeはC#の型を表現するYAMLの構造体。`propertyType`・`fieldType`・`eventType`・`returns`・パラメーターの `type`・`base`・`implements` 等で使用する。

### 4.1 TypeNodeの構造

```yaml
type:          # 必須。型の種類と名前を示す
  kind: ...    # "named" | "genericParameter" | "array" | "tuple"
  ...          # kind に応じたフィールド
nullable: true          # 任意。true のとき ? が付く（null許容型）
genericArguments:       # 任意。ジェネリック引数。named にのみ付けられる
  - type:
      kind: named
      name: System.String
```

### 4.2 named（通常の型）

```yaml
type:
  kind: named
  name: System.String
```

`name` は完全修飾名を書く。

```yaml
# bool
type:
  kind: named
  name: System.Boolean

# int
type:
  kind: named
  name: System.Int32

# 自プロジェクトの型
type:
  kind: named
  name: YukkuriMovieMaker.Plugin.Effects.VideoEffectBase

# null許容型（string?）
type:
  kind: named
  name: System.String
nullable: true
```

### 4.3 genericParameter（型パラメーター）

ジェネリックメソッドやジェネリック型の型パラメーター自体（`T` や `TResult` 等）を表す。

```yaml
type:
  kind: genericParameter
  name: T

# null許容（T?）
type:
  kind: genericParameter
  name: T
nullable: true
```

### 4.4 array（配列型）

```yaml
# string[]
type:
  kind: array
  elementType:
    type:
      kind: named
      name: System.String

# string?[]（要素がnull許容）
type:
  kind: array
  elementType:
    type:
      kind: named
      name: System.String
    nullable: true

# string[]?（配列自体がnull許容）
type:
  kind: array
  elementType:
    type:
      kind: named
      name: System.String
nullable: true

# T[]（型パラメーターの配列）
type:
  kind: array
  elementType:
    type:
      kind: genericParameter
      name: T
```

`genericArguments` は `array` には付けられない。

### 4.5 tuple（タプル型）

```yaml
# (string name, int age)
type:
  kind: tuple
  elements:
    - name: name        # 要素名（任意）
      type:
        kind: named
        name: System.String
    - name: age
      type:
        kind: named
        name: System.Int32

# 名前なしタプル (string, int)
type:
  kind: tuple
  elements:
    - type:
        kind: named
        name: System.String
    - type:
        kind: named
        name: System.Int32

# null許容タプル (string name, int age)?
type:
  kind: tuple
  elements:
    - name: name
      type:
        kind: named
        name: System.String
    - name: age
      type:
        kind: named
        name: System.Int32
nullable: true
```

`genericArguments` は `tuple` には付けられない。

### 4.6 ジェネリック型（genericArguments）

`genericArguments` は `named` の型にのみ付けられる。

```yaml
# IEnumerable<string>
type:
  kind: named
  name: System.Collections.Generic.IEnumerable
genericArguments:
  - type:
      kind: named
      name: System.String

# Dictionary<string, int>
type:
  kind: named
  name: System.Collections.Generic.Dictionary
genericArguments:
  - type:
      kind: named
      name: System.String
  - type:
      kind: named
      name: System.Int32

# IEnumerable<string>?（null許容）
type:
  kind: named
  name: System.Collections.Generic.IEnumerable
nullable: true
genericArguments:
  - type:
      kind: named
      name: System.String

# List<T>（型パラメーターをジェネリック引数に）
type:
  kind: named
  name: System.Collections.Generic.List
genericArguments:
  - type:
      kind: genericParameter
      name: T

# Dictionary<string, List<T?>>（ネスト）
type:
  kind: named
  name: System.Collections.Generic.Dictionary
genericArguments:
  - type:
      kind: named
      name: System.String
  - type:
      kind: named
      name: System.Collections.Generic.List
    genericArguments:
      - type:
          kind: genericParameter
          name: T
        nullable: true

# Task<(string name, int age)?>（ジェネリック引数にnull許容タプル）
type:
  kind: named
  name: System.Threading.Tasks.Task
genericArguments:
  - type:
      kind: tuple
      elements:
        - name: name
          type:
            kind: named
            name: System.String
        - name: age
          type:
            kind: named
            name: System.Int32
    nullable: true
```

`genericArguments` は1つ以上の要素が必要。空配列は無効。

### 4.7 TypeReferenceとしての使用

`base`・`externalInheritance`・`implements`・`returns`・`propertyType`・`fieldType`・`eventType` はすべてTypeNodeと同じ構造。

```yaml
# base: VideoEffectBase を継承
base:
  type:
    kind: named
    name: YukkuriMovieMaker.Plugin.Effects.VideoEffectBase

# implements: 複数のインターフェースを実装
implements:
  - type:
      kind: named
      name: System.ComponentModel.INotifyPropertyChanged
  - type:
      kind: named
      name: System.ComponentModel.INotifyDataErrorInfo

# returns: void を返す
returns:
  type:
    kind: named
    name: System.Void

# propertyType: string? 型のプロパティー
propertyType:
  type:
    kind: named
    name: System.String
  nullable: true
```

---

## 5. SymbolIdの命名規則

C#のXMLドキュメントコメント仕様に準拠する。

| プレフィックス | 対象 | 例 |
| --- | --- | --- |
| `N:` | 名前空間 | `N:YukkuriMovieMaker.Plugin.Effects` |
| `T:` | 型（class/interface/struct/enum） | `T:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase` |
| `M:` | メソッド・コンストラクター | `M:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.Set` |
| `P:` | プロパティー | `P:YukkuriMovieMaker.Plugin.Effects.IVideoEffect.Label` |
| `F:` | フィールド | `F:YukkuriMovieMaker.Plugin.Effects.VideoEffectCategories.Animation` |
| `E:` | イベント | `E:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.PropertyChanged` |
| `D:` | デリゲート | `D:YukkuriMovieMaker.Plugin.Effects.SomeDelegate` |

### 5.1 メソッドのID

引数なし:

```
M:YukkuriMovieMaker.Plugin.Effects.VideoEffectAttribute.GetName
```

引数あり（引数型を `()` 内に `,` 区切りで列挙）:

```
M:YukkuriMovieMaker.Plugin.Effects.VideoEffectAttribute.GetCategories(System.String,System.Int32)
```

コンストラクターは `#ctor`:

```
M:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.#ctor
M:YukkuriMovieMaker.Plugin.Effects.VideoEffectAttribute.#ctor(System.String,System.String[],System.Boolean)
```

ジェネリックメソッドは型パラメーターを ``` `` {n}``` で表現:

```
M:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.Set``1(``0@,``0,System.String,System.String[])
```

- ``` ``1 ``` → 型パラメーター1個
- ``` ``0 ``` → 1番目の型パラメーター
- `@` → `ref`/`out` 修飾子

配列引数は `[]`:

```
M:Foo.Bar.Method(System.String[],System.Int32)
```

### 5.2 namespaceのIDとnameの関係

```yaml
id: "N:YukkuriMovieMaker.Plugin.Effects"
name: "YukkuriMovieMaker.Plugin.Effects"   # id から "N:" を除いた文字列と完全一致
```

`name` が `id` から `N:` を除いた文字列と一致しない場合、スキーマ検証でエラーになる。

### 5.3 typeドキュメントのIDとname

```yaml
id: "T:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase"
name: "YukkuriMovieMaker.Plugin.Effects.VideoEffectBase"   # 完全修飾名
```

`name` は完全修飾名を書く。

### 5.4 memberドキュメントのname

```yaml
id: "M:YukkuriMovieMaker.Plugin.Effects.VideoEffectAttribute.GetName"
name: "GetName"   # メンバー名のみ（クラス名は含めない）
```

メンバーの `name` にドット（`.`）を含めてはいけない。

コンストラクターの `name` は `#ctor`:

```yaml
id: "M:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.#ctor"
name: "#ctor"
```

---

## 6. 各ドキュメントタイプのリファレンス

### 6.1 namespace

```yaml
id: "N:YukkuriMovieMaker.Plugin.Effects"
type: namespace
name: "YukkuriMovieMaker.Plugin.Effects"       # id から N: を除いた文字列と一致
namespace: "YukkuriMovieMaker.Plugin"           # 親名前空間。ルートnamespaceは省略
summary: "エフェクトプラグインを作成に必要な型を提供します。"
remarks: |                                      # 任意
  追加の説明...
```

**制約:**
- `name` は `id` から `N:` を除いた文字列と完全一致しなければならない。
- `namespace` に自身の `name` と同じ値（自己参照）は設定できない。
- ルート名前空間（親がない場合）は `namespace` を省略する。
- `accessibility` は設定できない。

**ルート名前空間の例:**

```yaml
id: "N:YukkuriMovieMaker"
type: namespace
name: "YukkuriMovieMaker"
summary: "YukkuriMovieMakerの名前空間。"
```

### 6.2 class

````yaml
id: "T:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase"
type: class
name: "YukkuriMovieMaker.Plugin.Effects.VideoEffectBase"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "映像エフェクトの基底クラスです。"
assembly: "YukkuriMovieMaker.Plugin.dll"        # 任意
genericParameters:                               # 任意。ジェネリック型パラメーター名の配列
  - T
  - TResult
externalInheritance:                             # 任意。ドキュメント化されていない基底型チェーン
  - type:
      kind: named
      name: System.Object
  - type:
      kind: named
      name: YukkuriMovieMaker.Commons.Animatable
base:                                            # 任意。直接の基底クラス
  type:
    kind: named
    name: YukkuriMovieMaker.Commons.Animatable
implements:                                      # 任意。実装するインターフェース
  - type:
      kind: named
      name: YukkuriMovieMaker.Plugin.Effects.IVideoEffect
  - type:
      kind: named
      name: System.ComponentModel.INotifyPropertyChanged
code: |                                          # 任意。C#の宣言コード
  public abstract class VideoEffectBase : Animatable, IVideoEffect
since: "4.20.0.0"                               # 任意。導入バージョン
obsolete: "5.0.0.0"                             # 任意。非推奨バージョン
remarks: |                                      # 任意
  詳細な説明...
examples: |                                     # 任意
  ```csharp
  var effect = new MyEffect();
  ```
````

**externalInheritance について:**

`externalInheritance` はドキュメント化されていない基底型の継承チェーンを記述するフィールド。継承チェーンを最上位（通常 `System.Object`）から順に、直接の基底クラスの**一つ上まで**を列挙する。

```
System.Object → Animatable → VideoEffectBase
```

この場合、`VideoEffectBase` のドキュメントには:

```yaml
externalInheritance:
  - type:
      kind: named
      name: System.Object
  - type:
      kind: named
      name: YukkuriMovieMaker.Commons.Animatable
base:
  type:
    kind: named
    name: YukkuriMovieMaker.Commons.Animatable
```

`base` に直接の親を書き、`externalInheritance` に `System.Object` から親の一つ上まで（`base` と同じものを末尾に含めても構わないが、通常は `base` と重複させない）を書く。

ドキュメント化されているクラスを継承する場合（継承チェーンがSymbolIndex内に存在する場合）は `externalInheritance` は不要で `base` だけ書けばよい。

**implements と externalInheritance の空配列禁止:**

```yaml
# NG: 空配列は無効
implements: []
externalInheritance: []

# OK: 省略する
```

### 6.3 interface

`class` とほぼ同じ。`base` の代わりに継承するインターフェースがある場合は `implements` で書く。

```yaml
id: "T:YukkuriMovieMaker.Plugin.Effects.IVideoEffect"
type: interface
name: "YukkuriMovieMaker.Plugin.Effects.IVideoEffect"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "映像エフェクトのインターフェースです。"
assembly: "YukkuriMovieMaker.Plugin.dll"
implements:                                      # 任意。継承するインターフェース
  - type:
      kind: named
      name: System.ComponentModel.INotifyPropertyChanged
  - type:
      kind: named
      name: System.ComponentModel.INotifyDataErrorInfo
code: |
  public interface IVideoEffect : INotifyPropertyChanged, INotifyDataErrorInfo
```

### 6.4 struct

`class` と同じフィールドが使える。

```yaml
id: "T:YukkuriMovieMaker.Plugin.Effects.FrameSize"
type: struct
name: "YukkuriMovieMaker.Plugin.Effects.FrameSize"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "フレームサイズを表す構造体です。"
assembly: "YukkuriMovieMaker.Plugin.dll"
implements:
  - type:
      kind: named
      name: System.IEquatable
    genericArguments:
      - type:
          kind: named
          name: YukkuriMovieMaker.Plugin.Effects.FrameSize
code: |
  public readonly struct FrameSize : IEquatable<FrameSize>
```

### 6.5 enum

```yaml
id: "T:YukkuriMovieMaker.Plugin.Effects.BlendMode"
type: enum
name: "YukkuriMovieMaker.Plugin.Effects.BlendMode"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "ブレンドモードを表す列挙型です。"
assembly: "YukkuriMovieMaker.Plugin.dll"
code: |
  public enum BlendMode
remarks: |
  各値の説明を remarks に書く。
  | 値 | 説明 |
  | --- | --- |
  | `Normal` | 通常 |
  | `Multiply` | 乗算 |
```

enum の値（`field`）は個別YAMLに書く（後述）。

### 6.6 delegate

```yaml
id: "D:YukkuriMovieMaker.Plugin.Effects.VideoProcessHandler"
type: delegate
name: "VideoProcessHandler"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "映像処理を行うデリゲートです。"
assembly: "YukkuriMovieMaker.Plugin.dll"
genericParameters:                               # 任意
  - T
parameters:                                      # 任意
  - name: sender
    type:
      type:
        kind: named
        name: System.Object
  - name: args
    type:
      type:
        kind: genericParameter
        name: T
returns:                                         # 必須
  type:
    kind: named
    name: System.Void
code: |
  public delegate void VideoProcessHandler<T>(object sender, T args)
```

`returns` はデリゲートでは**必須**。`void` の場合も省略できない。

### 6.7 method

````yaml
id: "M:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.Set``1(``0@,``0,System.String,System.String[])"
type: method
name: "Set"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: protected
summary: "プロパティーに値を設定し、変更を通知します。"
assembly: "YukkuriMovieMaker.Plugin.dll"
declaringType:
  id: "T:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase"
genericParameters:                               # 任意。ジェネリックメソッドの型パラメーター名
  - T
parameters:                                      # 任意
  - name: storage
    modifier: ref                                # 任意。"ref" | "out" | "in"
    type:
      type:
        kind: genericParameter
        name: T
  - name: value
    type:
      type:
        kind: genericParameter
        name: T
  - name: name
    type:
      type:
        kind: named
        name: System.String
  - name: etcChangedPropertyNames
    type:
      type:
        kind: array
        elementType:
          type:
            kind: named
            name: System.String
returns:                                         # 必須
  type:
    kind: named
    name: System.Boolean
code: |
  protected bool Set<T>(ref T storage, T value, string name = "", params string[] etcChangedPropertyNames);
remarks: |                                      # 任意
  詳細な説明...
examples: |                                     # 任意
  ```csharp
  Set(ref _myField, value);
  ```
````

**コンストラクターの書き方:**

```yaml
id: "M:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.#ctor"
type: method
name: "#ctor"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "VideoEffectBase クラスの新しいインスタンスを初期化します。"
declaringType:
  id: "T:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase"
returns:
  type:
    kind: named
    name: System.Void
code: |
  public VideoEffectBase()
```

**制約:**
- `returns` は**必須**。`void` でも省略できない。
- `declaringType` は**必須**。
- `parameters` の空配列は無効。引数なしの場合は `parameters` フィールド自体を省略する。
- `genericParameters` の空配列は無効。

### 6.8 property

```yaml
id: "P:YukkuriMovieMaker.Plugin.Effects.IVideoEffect.Label"
type: property
name: "Label"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "エフェクトの表示名を取得します。"
assembly: "YukkuriMovieMaker.Plugin.dll"
declaringType:
  id: "T:YukkuriMovieMaker.Plugin.Effects.IVideoEffect"
propertyType:                                    # 任意だが強く推奨
  type:
    kind: named
    name: System.String
code: |
  [JsonIgnore]
  public abstract string Label { get; }
remarks: |                                      # 任意
  読み取り専用プロパティーです。
```

### 6.9 field

```yaml
id: "F:YukkuriMovieMaker.Plugin.Effects.VideoEffectCategories.Animation"
type: field
name: "Animation"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "アニメーションカテゴリーのキー名を返します。"
assembly: "YukkuriMovieMaker.Plugin.dll"
declaringType:
  id: "T:YukkuriMovieMaker.Plugin.Effects.VideoEffectCategories"
fieldType:                                       # 任意だが強く推奨
  type:
    kind: named
    name: System.String
code: |
  public const string Animation = "YMM4Key_EffectCategoryAnimationName";
```

### 6.10 event

```yaml
id: "E:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase.PropertyChanged"
type: event
name: "PropertyChanged"
namespace: "YukkuriMovieMaker.Plugin.Effects"
accessibility: public
summary: "プロパティーの値が変更されたときに発生します。"
assembly: "YukkuriMovieMaker.Plugin.dll"
declaringType:
  id: "T:YukkuriMovieMaker.Plugin.Effects.VideoEffectBase"
eventType:                                       # 任意だが強く推奨
  type:
    kind: named
    name: System.ComponentModel.PropertyChangedEventHandler
code: |
  public event PropertyChangedEventHandler? PropertyChanged;
```

---

## 7. よくあるミスと対処法

### 7.1 スキーマ検証エラー

YAMLがスキーマ検証を通らない場合、そのファイルはサイトに表示されない。コンソールにエラーログが出る。

**空配列の使用:**

```yaml
# NG
implements: []
parameters: []
genericArguments: []
externalInheritance: []

# OK: 省略する
```

**namespace の自己参照:**

```yaml
# NG
id: "N:Foo.Bar"
name: "Foo.Bar"
namespace: "Foo.Bar"   # 自分自身を参照している

# OK
id: "N:Foo.Bar"
name: "Foo.Bar"
namespace: "Foo"
```

**namespace の name と id の不一致:**

```yaml
# NG
id: "N:Foo.Bar"
name: "FooBar"   # id の "N:" を除いた "Foo.Bar" と一致しない

# OK
id: "N:Foo.Bar"
name: "Foo.Bar"
```

**member の name にドットを含める:**

```yaml
# NG
id: "M:Foo.Bar.GetName"
name: "Foo.Bar.GetName"   # ドットを含めてはいけない

# OK
id: "M:Foo.Bar.GetName"
name: "GetName"
```

**returns の省略（method/delegate）:**

```yaml
# NG: method と delegate では returns は必須
type: method
# returns: が無い

# OK
type: method
returns:
  type:
    kind: named
    name: System.Void
```

**declaringType の省略（member系）:**

method/property/field/event では `declaringType` は必須。

```yaml
# NG
type: method
# declaringType: が無い

# OK
type: method
declaringType:
  id: "T:Foo.Bar"
```

**genericArguments を named 以外に付ける:**

```yaml
# NG: array に genericArguments は付けられない
type:
  kind: array
  elementType:
    type:
      kind: named
      name: System.String
genericArguments:
  - type:
      kind: named
      name: System.Int32

# NG: genericParameter に genericArguments は付けられない
type:
  kind: genericParameter
  name: T
genericArguments:
  - type:
      kind: named
      name: System.String
```

### 7.2 外部型リンクが張られない

`config/external-type-links.yaml` に型名が登録されていない場合、その型はリンクなしのテキストとして表示される。新しい外部型を使う場合は `external-type-links.yaml` に追記する。

```yaml
# config/external-type-links.yaml に追記
System.Windows.Point: https://learn.microsoft.com/ja-jp/dotnet/api/system.windows.point
```

キーは TypeNode の `name` フィールドの値（完全修飾名）と完全一致させる。

### 7.3 リダイレクトが効かない

新しいYAMLファイルを追加した場合、`next.config.ts` の `redirects()` はビルド時に実行される。開発サーバー（`next dev`）を再起動すれば反映される。

### 7.4 画像が表示されない

- 画像ファイルがMDファイルと同じ `content/` 以下のディレクトリに存在するか確認する。
- サポート外の拡張子（`.bmp`・`.tiff` 等）は表示されない。`.png`・`.jpg`・`.webp` を使う。
- パスの大文字小文字はOSによって区別される。ファイル名と参照パスが一致しているか確認する。
- `public/` に画像を置いて `/画像名.png` で参照する方法でも機能する。