# 2. リソースを作成する場所と破棄する場所

## 作成場所を決める基準

Direct2Dリソースは、種類によって作成する場所を分ける必要があります。

前章で述べた通り、Direct2Dリソースには

- **デバイス非依存**
- **デバイス依存**

の2種類があります。

この違いは、単なる分類ではなく、**どこで作成して、どこで破棄するべきか**に直接関係します。

基本的な考え方は次の通りです。

1. デバイス非依存リソースは長期保持する。
2. デバイス依存リソースはDeviceContextに合わせて作成する。
3. 描画結果が変わらない場合は作り直さない。
4. 作り直す場合は、古いリソースを必ず破棄する。

## デバイス非依存リソースを作成する場所

デバイス非依存リソースは、GPUデバイスに依存しないため、長く保持できます。

代表的なものは次の通りです。

- Factory
- Geometry
- StrokeStyle
- PathGeometry

これらは、デバイスロストの影響を受けにくいため、毎フレーム作り直す必要はありません。

たとえば `ID2D1PathGeometry` は、図形の形状そのものを保持しますが、この時点ではGPU上の描画結果ではありません。そのため、形状が変わらない限り保持して使い回すことができます。

```cs
geometry = devices.D2D.Factory.CreatePathGeometry();

using (var sink = geometry.Open())
{
    sink.BeginFigure(points[0], FigureBegin.Filled);
    sink.AddLines(points[1..]);
    sink.EndFigure(FigureEnd.Closed);
    sink.Close();
}
```

ただし、頂点の数や座標が変わるような図形では、Geometry自体を作り直す必要があります。

その場合も、前回作成したGeometryを破棄してから新しく作成します。

```cs
geometry?.Dispose();
geometry = devices.D2D.Factory.CreatePathGeometry();
```

## デバイス依存リソースを作成する場所

デバイス依存リソースは、DeviceContextから作成します。

代表的なものは次の通りです。

- Brush
- Bitmap
- Effect
- CommandList
- DeviceContextから作成された描画用リソース

これらはDeviceContextに紐づいているため、デバイスロスト時には無効になります。

また、作成コストやGPUリソースの保持があるため、毎フレーム無条件に作成するべきではありません。

たとえば単色ブラシは、色が固定であればコンストラクタなどで一度作成して使い回します。

```cs
readonly ID2D1SolidColorBrush whiteBrush;

public SampleShapeSource(IGraphicsDevicesAndContext devices)
{
    whiteBrush = devices.DeviceContext.CreateSolidColorBrush(new(1, 1, 1, 1));
}
```

一方、`CommandList` は描画内容を保持するため、図形のサイズや形状が変わったときに作り直します。

```cs
commandList?.Dispose();
commandList = devices.DeviceContext.CreateCommandList();
```

## YMM4プラグインでの基本配置

YMM4の図形プラグインでは、Direct2Dリソースの作成場所はだいたい次のように分けられます。

### コンストラクタで作るもの

コンストラクタでは、長く使い回すリソースを作成します。

- Brush
- Effect
- 変化しないGeometry
- DisposeCollector

例：

```cs
public SampleShapeSource(IGraphicsDevicesAndContext devices, SampleShapeParameter parameter)
{
    this.devices = devices;
    this.parameter = parameter;

    whiteBrush = devices.DeviceContext.CreateSolidColorBrush(new(1f, 1f, 1f, 1f));
}
```

このようにしておくと、`Update` が呼ばれるたびにブラシを作成せずに済みます。

## Updateで作るもの

`Update` では、現在のフレームやパラメーターに応じて変化するリソースを作成します。

YMM4では、`Update` は再生中やプレビュー更新時に何度も呼ばれます。

そのため、`Update` の中では次の点を意識する必要があります。

- 値が変わっていない場合は何もしない。
- 必要な場合だけ描画結果を作り直す。
- 作り直す前に古いリソースを破棄する。

サンプルでは、サイズが変わっていない場合はそのまま戻っています。

```cs
var size = sampleShapeParameter.Size.GetValue(frame, length, fps);

if (commandList != null && this.size == size)
    return;
```

これは非常に重要です。

YMM4はリアルタイムプレビューを行うため、毎フレーム不要なリソースを作成すると、プレビューが重くなります。

## Disposeで破棄するもの

Direct2DリソースはCOMオブジェクトであり、C#の通常のオブジェクトのように放置してよいものではありません。

使用し終わったリソースは `Dispose()` で明示的に破棄します。

代表的には次のものを破棄します。

- Brush
- Bitmap
- Effect
- Geometry
- CommandList

例：

```cs
public void Dispose()
{
    commandList?.Dispose();
    whiteBrush?.Dispose();
}
```

`IShapeSource` や `IVideoEffectProcessor` など、YMM4から生成される描画処理用クラスは、不要になったときに `Dispose` が呼ばれます。

そのため、コンストラクタや `Update` 内で作成したDirect2Dリソースは、クラスの `Dispose` でまとめて破棄するようにします。

## 作り直すときの破棄

`Dispose` はクラスの最後だけでなく、リソースを作り直す直前にも必要です。

たとえば、`CommandList` を再生成する場合、前回の `CommandList` を保持したまま新しいものを作ると、古いリソースが残り続けます。

```cs
commandList?.Dispose();
commandList = devices.DeviceContext.CreateCommandList();
```

多角形のようにGeometryも作り直す場合は、Geometryも同様に破棄します。

```cs
geometry?.Dispose();
geometry = devices.D2D.Factory.CreatePathGeometry();
```

つまり、Direct2Dリソースは

- 最後に破棄する
- 作り直す前にも破棄する

の2つを意識する必要があります。

## DeviceContext.Targetの戻し忘れ

`CommandList` に描画する場合、DeviceContextの描画先を一時的に変更します。

```cs
var dc = devices.DeviceContext;

dc.Target = commandList;
dc.BeginDraw();
dc.Clear(null);
dc.FillRectangle(rect, whiteBrush);
dc.EndDraw();
dc.Target = null;
commandList.Close();
```

ここで重要なのは、描画後に `Target` を `null` に戻すことです。

`DeviceContext.Target` はDeviceContext側の状態です。戻し忘れると、その後の描画処理に影響する可能性があります。

また、`CommandList` は `EndDraw()` の後に `Close()` を呼ぶ必要があります。

この流れは、ほぼ定型です。

1. `CommandList` を作成する。
2. `DeviceContext.Target` に設定する。
3. `BeginDraw()` を呼ぶ。
4. 描画命令を実行する。
5. `EndDraw()` を呼ぶ。
6. `DeviceContext.Target` を `null` に戻す。
7. `CommandList.Close()` を呼ぶ。

## DisposeCollectorを使う場合

複数のDirect2Dリソースを扱う場合、`DisposeCollector` を使うと破棄漏れを減らせます。

サンプルの多角形プラグインでは、次のように使用されています。

```cs
readonly DisposeCollector disposer = new();

white = dc.CreateSolidColorBrush(new(1f, 1f, 1f, 1f));
disposer.Collect(white);
```

リソースを作り直す場合は、登録済みのリソースを破棄してから新しいものを登録します。

```cs
if (geometry is not null)
    disposer.RemoveAndDispose(ref geometry);

geometry = devices.D2D.Factory.CreatePathGeometry();
disposer.Collect(geometry);
```

最後はまとめて破棄します。

```cs
public void Dispose()
{
    disposer.DisposeAndClear();
}
```

リソースが増えてくると `Dispose()` の書き漏れが起きやすいため、`DisposeCollector` を使うと管理しやすくなります。

## 作成場所のまとめ

Direct2Dリソースは、次のように配置すると管理しやすくなります。

| リソース | 作成場所 | 破棄場所 |
|:--|:--|:--|
| `ID2D1Factory` | YMM4側、または初期化時 | アプリ終了時 |
| `Geometry` | 形状が決まった時 | 作り直す前、または `Dispose` |
| `Brush` | コンストラクタ | `Dispose` |
| `Effect` | コンストラクタ | `Dispose` |
| `CommandList` | 描画内容が変わった時 | 作り直す前、または `Dispose` |
| `Bitmap` | 必要になった時 | 作り直す前、または `Dispose` |

YMM4プラグインでは、FactoryやDeviceContextは基本的にYMM4から渡されます。

そのため、プラグイン側で意識するべきなのは、そこから作成した `Brush`、`Effect`、`Geometry`、`CommandList` などの寿命管理です。

## よくない実装例

次のように、`Update` のたびにブラシを作成する実装は避けるべきです。

```cs
public void Update(TimelineItemSourceDescription desc)
{
    var brush = devices.DeviceContext.CreateSolidColorBrush(new(1f, 1f, 1f, 1f));

    // 描画処理
}
```

この実装には問題があります。

- 毎フレームDirect2Dリソースを作成している。
- `Dispose()` されていない。
- リアルタイムプレビュー中に負荷が増える。
- 長時間使用すると不安定になる可能性がある。

修正する場合は、ブラシをコンストラクタで作成し、`Dispose` で破棄します。

```cs
readonly ID2D1SolidColorBrush whiteBrush;

public SampleShapeSource(IGraphicsDevicesAndContext devices)
{
    whiteBrush = devices.DeviceContext.CreateSolidColorBrush(new(1f, 1f, 1f, 1f));
}

public void Dispose()
{
    whiteBrush.Dispose();
}
```

## 実装の注意

1. `Update` で毎回リソースを作成しないでください。
2. 作り直す場合は、古いリソースを先に破棄してください。
3. `Brush` や `Effect` は、可能な限り使い回してください。
4. `CommandList` は、描画内容が変わったときだけ作り直してください。
5. `DeviceContext.Target` は、使用後に必ず `null` に戻してください。
6. `CommandList` は、`EndDraw()` 後に必ず `Close()` してください。
7. `Dispose` でDirect2Dリソースを明示的に破棄してください。

## サンプルコード

このコードは、YMM4の図形プラグインでDirect2Dリソースをどこで作成し、どこで破棄するかを示す最小構成です。

以下のことを行っています。

1. ブラシをコンストラクタで作成する
2. `Update` ではサイズが変わったときだけ `CommandList` を作り直す
3. 作り直す前に古い `CommandList` を破棄する
4. `Dispose` でDirect2Dリソースを破棄する

### C#

<details>
  <summary>コード</summary>

```cs
using Vortice.Direct2D1;
using YukkuriMovieMaker.Commons;
using YukkuriMovieMaker.Player.Video;

internal class SampleShapeSource : IShapeSource
{
    readonly IGraphicsDevicesAndContext devices;
    readonly SampleShapeParameter parameter;

    readonly ID2D1SolidColorBrush whiteBrush;
    ID2D1CommandList? commandList;

    double size;

    public ID2D1Image Output =>
        commandList ?? throw new InvalidOperationException("Updateを呼び出してからOutputを参照してください。");

    public SampleShapeSource(IGraphicsDevicesAndContext devices, SampleShapeParameter parameter)
    {
        this.devices = devices;
        this.parameter = parameter;

        whiteBrush = devices.DeviceContext.CreateSolidColorBrush(new(1f, 1f, 1f, 1f));
    }

    public void Update(TimelineItemSourceDescription desc)
    {
        var fps = desc.FPS;
        var frame = desc.ItemPosition.Frame;
        var length = desc.ItemDuration.Frame;

        var currentSize = parameter.Size.GetValue(frame, length, fps);

        if (commandList is not null && size == currentSize)
            return;

        commandList?.Dispose();

        var dc = devices.DeviceContext;
        commandList = dc.CreateCommandList();

        dc.Target = commandList;
        dc.BeginDraw();
        dc.Clear(null);

        dc.FillRectangle(
            new(
                (float)-currentSize / 2,
                (float)-currentSize / 2,
                (float)currentSize / 2,
                (float)currentSize / 2),
            whiteBrush);

        dc.EndDraw();
        dc.Target = null;
        commandList.Close();

        size = currentSize;
    }

    public void Dispose()
    {
        commandList?.Dispose();
        whiteBrush.Dispose();
    }
}
```

</details>

この実装では、`whiteBrush` はコンストラクタで一度だけ作成されます。

一方で、`commandList` は描画内容を保持するため、サイズが変わったときだけ作り直されます。

このように、リソースごとに作成場所と破棄場所を分けることで、YMM4のリアルタイムプレビューでも安定して動作しやすくなります。
