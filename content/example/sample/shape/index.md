# 図形の追加

## 四角形を描画する図形プラグイン

### 必要なツール

- .Net10 SDK
- YMM4のdll群と本体
- （推奨）C#開発環境

### プロジェクト参照

- `YukkuriMovieMaker.Controls.dll`
- `YukkuriMovieMaker.Plugin.dll`
- `SharpGen.Runtime.dll`
- `SharpGen.Runtime.COM.dll`
- `Vortice.Direct2D1.dll`
- `Vortice.DirectX.dll`
- `Vortice.Mathematics.dll`

### 継承、実装が必要なクラス

- `IShapePlugin`
- `ShapeParameterBase`
- `IShapeSource`

### YMM4上でできること

このサンプルを読み込ませると、YMM4の図形アイテムで使用できる図形として「サンプル四角形」が追加される。

- 図形アイテムの図形種類として「サンプル四角形」を選べるようになる。
- アイテム編集欄に、`Size` プロパティに対応する「サイズ」が表示される。
- プレビュー上には、`SampleShapeSource` が描画した白い四角形が表示される。
- 「サイズ」の値を変更すると、プレビュー上の四角形の大きさも変わる。

つまり、`IShapePlugin` がYMM4に「この図形を追加します」と伝え、`ShapeParameterBase` が編集項目を持ち、`IShapeSource` が実際の見た目を描画する。

### 最小で動かす流れ

まず動かすだけなら、次の流れでよい。

1. `IShapePlugin` を実装したクラスを作成する。
2. `ShapeParameterBase` を継承したパラメータークラスを作成する。
3. `IShapeSource` を実装した描画クラスを作成する。
4. ビルドしてdllを作成する。
5. YMM4のプラグインフォルダにdllを配置する。
6. YMM4を起動し、図形アイテムから追加した図形を選ぶ。

最初は `Size` だけを変更して、YMM4上の表示が変わることを確認するとよい。

### プラグインの配置場所

ビルドしたdllは、YMM4のプラグインフォルダに配置する。

サンプルプロジェクトでは、ビルド後に次の場所へdllをコピーする設定になっている。

```xml
<Exec Command="mkdir &quot;$(YMM4DirPath)user\plugin\$(ProjectName)&quot; ... copy &quot;$(TargetPath)&quot; &quot;$(YMM4DirPath)user\plugin\$(ProjectName)\&quot;" />
```

手動で配置する場合も、基本的にはYMM4本体側のプラグインフォルダに置く。

```txt
YukkuriMovieMaker4
└─ user
   └─ plugin
      └─ プラグイン名
         └─ プラグイン名.dll
```

- 配布時は、プラグイン本体のdllをこのフォルダに入れる。
- プラグイン固有の依存dllがある場合は、同じフォルダに入れる。
- `YukkuriMovieMaker.Plugin.dll` や `YukkuriMovieMaker.Controls.dll` など、YMM4本体に含まれるdllは、通常は同梱しない。
- Vortice系などYMM4本体側にも存在するdllは、YMM4本体と同じバージョンを参照する。別バージョンを混ぜると、読み込みに失敗する可能性がある。

参照リストにあるdllは「開発時に参照するもの」と「配布時に同梱するもの」を分けて考える必要がある。YMM4本体のdllとバージョンがずれると、ビルドは通ってもYMM4起動時にプラグインが読み込まれないことがある。

### 1. IShapePluginを実装する

図形プラグインの名前や、図形パラメーターの生成処理を定義する。

[GitHub](https://github.com/manju-summoner/YukkuriMovieMaker4PluginSamples/blob/master/YMM4SamplePlugin/Shape/SampleShape/SampleShapePlugin.cs)より引用

```cs
public class SampleShapePlugin : IShapePlugin
{
    public string Name => "サンプル四角形";

    public bool IsExoShapeSupported => true;

    public bool IsExoMaskSupported => true;

    public IShapeParameter CreateShapeParameter(SharedDataStore? sharedData)
    {
        return new SampleShapeParameter(sharedData);
    }
}
```

- `Name` プロパティで、YMM4上に表示される図形名を指定する。
- `IsExoShapeSupported` で、図形アイテムとしてのexo出力に対応しているかどうかを返す。
- `IsExoMaskSupported` で、図形切り抜きエフェクトやエフェクトアイテムなど、マスク系のexo出力に対応しているかどうかを返す。
- `CreateShapeParameter` 関数で、後述する `ShapeParameterBase` を継承したパラメータークラスを返す。
- `sharedData` は、図形の種類を切り替えたときに設定を復元するために使用する。
- `Name` が他の図形プラグインと被っていると、YMM4上で判別しづらくなるため、固有の名前にしておく。

### 2. ShapeParameterBaseを継承する

図形の設定項目、exo出力、図形ソースの生成処理を定義する。

[GitHub](https://github.com/manju-summoner/YukkuriMovieMaker4PluginSamples/blob/master/YMM4SamplePlugin/Shape/SampleShape/SampleShapeParameter.cs)より引用

```cs
internal class SampleShapeParameter(SharedDataStore? sharedData) : ShapeParameterBase(sharedData)
{
    [Display(Name = "サイズ")]
    [AnimationSlider("F0", "px", 0, 100)]
    public Animation Size { get; } = new Animation(100, 0, 1000);

    public SampleShapeParameter() : this(null)
    {
    }

    public override IShapeSource CreateShapeSource(IGraphicsDevicesAndContext devices)
    {
        return new SampleShapeSource(devices, this);
    }

    protected override IEnumerable<IAnimatable> GetAnimatables() => [Size];
}
```

- 図形の設定項目は、通常のアイテム編集項目と同様にプロパティとして定義する。
- アイテム編集欄に表示するとき、`Display` 属性で項目名を指定し、`AnimationSlider` などのアイテム編集コントロール属性を付与する。
- 引数なしのコンストラクタを必ず定義する。これがないと、プロジェクトファイルの読み込みに失敗する。
- `CreateShapeSource` 関数で、後述する描画処理用のクラスのインスタンスを返す。
- アニメーション可能な項目がある場合、`GetAnimatables` 関数のオーバーライドでそのプロパティを入れた配列を返す。

### 3. exo出力を定義する

図形アイテムやマスクとしてexo出力する場合、対応する関数でAviUtl向けのフィルタ文字列を返す。

[GitHub](https://github.com/manju-summoner/YukkuriMovieMaker4PluginSamples/blob/master/YMM4SamplePlugin/Shape/SampleShape/SampleShapeParameter.cs)より引用

```cs
public override IEnumerable<string> CreateShapeItemExoFilter(int keyFrameIndex, ExoOutputDescription desc)
{
    var fps = desc.VideoInfo.FPS;
    return
    [
        $"_name=図形\r\n" +
        $"サイズ={Size.ToExoString(keyFrameIndex, "F0", fps)}\r\n" +
        $"縦横比=0\r\n" +
        $"ライン幅=4000\r\n" +
        $"type=0\r\n" +
        $"color=FFFFFF\r\n" +
        $"name=\r\n"
    ];
}
```

- `CreateShapeItemExoFilter` 関数では、図形アイテムとしてexo出力する際のフィルタを返す。
- `CreateMaskExoFilter` 関数では、図形切り抜きなどのマスクとしてexo出力する際のフィルタを返す。
- アニメーション値をexo文字列に変換するときは、`ToExoString` を使用する。
- exo出力に対応しない場合、`IShapePlugin` 側の `IsExoShapeSupported` や `IsExoMaskSupported` を `false` にし、各関数では空配列を返してもよい。

### 4. IShapeSourceを実装する

図形の描画処理を定義する。

[GitHub](https://github.com/manju-summoner/YukkuriMovieMaker4PluginSamples/blob/master/YMM4SamplePlugin/Shape/SampleShape/SampleShapeSource.cs)より引用

```cs
internal class SampleShapeSource : IShapeSource
{
    readonly private IGraphicsDevicesAndContext devices;
    readonly private SampleShapeParameter sampleShapeParameter;

    readonly ID2D1SolidColorBrush whiteBrush;
    ID2D1CommandList? commandList;

    public ID2D1Image Output => commandList ?? throw new Exception($"{nameof(commandList)}がnullです。事前にUpdateを呼び出す必要があります。");

    public void Update(TimelineItemSourceDescription timelineItemSourceDescription)
    {
        var fps = timelineItemSourceDescription.FPS;
        var frame = timelineItemSourceDescription.ItemPosition.Frame;
        var length = timelineItemSourceDescription.ItemDuration.Frame;

        var size = sampleShapeParameter.Size.GetValue(frame, length, fps);

        // CommandListを作成し、白い四角形を描画する
    }
}
```

- `Output` プロパティで、YMM4が読み取る描画結果を返す。
- コンストラクタで `IGraphicsDevicesAndContext` と、上で定義した `ShapeParameterBase` の継承オブジェクトを保持する。
- `Update` 関数で、現在のフレーム、アイテムの長さ、FPSを取得し、設定項目の値を読み取る。
- サンプルでは、`ID2D1CommandList` を作成し、`FillRectangle` で白い四角形を描画している。
- `DeviceContext.Target` に `CommandList` を設定した場合、描画後は必ず `null` に戻す。
- `CommandList` は `EndDraw()` の後に `Close()` を呼んで閉じる必要がある。
- 作成した `CommandList` やブラシなどのDirect2Dリソースは、`Dispose` 関数で開放する。

### 5. 設定の一時保存を実装する

図形の種類を切り替えたときに設定を復元する場合、`LoadSharedData` と `SaveSharedData` を実装する。

[GitHub](https://github.com/manju-summoner/YukkuriMovieMaker4PluginSamples/blob/master/YMM4SamplePlugin/Shape/SampleShape/SampleShapeParameter.cs)より引用

```cs
protected override void LoadSharedData(SharedDataStore store)
{
    var sharedData = store.Load<SharedData>();
    if (sharedData is null)
        return;

    sharedData.CopyTo(this);
}

protected override void SaveSharedData(SharedDataStore store)
{
    store.Save(new SharedData(this));
}
```

- `SaveSharedData` 関数で、現在の設定を一時保存用クラスにコピーして保存する。
- `LoadSharedData` 関数で、保存されていた設定を読み込み、現在のパラメーターに反映する。
- `Animation` などの値は、参照をそのまま渡すのではなく、`CopyFrom` で中身をコピーする。
- この処理を実装しておくと、図形の種類を切り替えた後でも元の設定項目を復元できる。

### IGraphicsDevicesAndContextについて

`IGraphicsDevicesAndContext` は、YMM4側から渡される描画用のコンテキストです。

- Direct2Dの `DeviceContext` を取得できる。
- Direct2DのFactoryなど、描画に必要なオブジェクトへアクセスできる。
- プラグイン側でDirect2DのDeviceを一から作らなくてよい。
- YMM4の描画パイプライン上で使えるリソースを作成できる。

図形プラグインでは、この `devices.DeviceContext` を使って、ブラシや `CommandList`、`PathGeometry` などを作成する。

### IShapeSourceのライフサイクル

`IShapeSource` は、図形の描画を担当するクラスです。

- 基本的には、図形アイテムごとに描画用のインスタンスが作られる。
- `Update` 関数で、現在のフレームに合わせて描画内容を更新する。
- `Output` プロパティで、YMM4に描画結果を渡す。
- 不要になったら `Dispose` 関数でDirect2Dリソースを開放する。

`Update` は、再生中のフレーム更新やパラメーター変更時に呼ばれる。リアルタイムプレビュー中は何度も呼ばれるため、毎回重い処理を行うとプレビューが重くなる。

### なぜCommandListを使うのか

サンプルでは、描画結果を `ID2D1CommandList` に記録して、それを `Output` として返している。

- Direct2Dの描画結果をYMM4に渡しやすい形式にできる。
- 一度作った描画結果を保持できる。
- サイズなどの値が変わっていない場合、前回の `CommandList` をそのまま使える。
- 毎フレームBitmapを作成するより、YMM4の描画処理に乗せやすい。

このサンプルでも、サイズが変わっていない場合は何もせずに戻る処理が入っている。

```cs
if (commandList != null && this.size == size)
    return;
```

リアルタイムプレビューを前提にするYMM4では、このようなキャッシュが重要になる。

### パフォーマンス上の注意

図形プラグインはプレビュー中に頻繁に更新されるため、次の点に注意する。

- 毎フレーム `new` しない。
- ブラシなどのDirect2Dリソースは、可能ならコンストラクタで作って使い回す。
- `CommandList` や `PathGeometry` を作り直す場合は、前回のものを必ず `Dispose` する。
- パラメーターが変わっていない場合は、描画を作り直さない。
- `DeviceContext.Target` を変更した場合は、描画後に必ず `null` に戻す。

特に `Update` の中で毎回ブラシやGeometryを作ると、プレビューが重くなったり、リソースの開放漏れで不安定になったりする。

## 多角形を描画する図形プラグイン

`SamplePolygonShapePlugin` では、複数の頂点を持つ多角形を描画します。

[GitHub](https://github.com/manju-summoner/YukkuriMovieMaker4PluginSamples/tree/master/YMM4SamplePlugin/Shape/SamplePolygonShape)より引用

### 追加で使われている主な要素

- `IShapeSource2`
- `VideoController`
- `ControllerPoint`
- `ID2D1PathGeometry`
- 独自のプロパティエディタ

### 頂点情報を定義する

多角形の各頂点は、`SamplePolygonShapePoint` クラスで定義されている。

```cs
public class SamplePolygonShapePoint : Animatable
{
    [Display(GroupName = "頂点", Name = "X")]
    [AnimationSlider("F1", "px", -500, 500)]
    public Animation X { get; } = new Animation(0, -100000, 100000);

    [Display(GroupName = "頂点", Name = "Y")]
    [AnimationSlider("F1", "px", -500, 500)]
    public Animation Y { get; } = new Animation(0, -100000, 100000);

    protected override IEnumerable<IAnimatable> GetAnimatables() => [X, Y];
}
```

- 頂点ごとに `X` と `Y` の `Animation` を持つ。
- `GetAnimatables` 関数で `X` と `Y` を返すことで、頂点の座標をアニメーション可能にしている。
- `SamplePolygonShapeParameter` 側では、この頂点のリストを `ImmutableList<SamplePolygonShapePoint>` として保持している。

### IShapeSource2で制御点を表示する

`SamplePolygonShapeSource` は `IShapeSource2` を実装し、描画結果に加えてプレビュー上の制御点を提供する。

```cs
public IEnumerable<VideoController> Controllers { get; private set; } = [];
```

- `Controllers` プロパティで、プレビュー上に表示する制御点を返す。
- `ControllerPoint` を作成し、ドラッグされたときに頂点の `X` と `Y` に移動量を加算する。
- これにより、アイテム編集欄だけでなく、プレビューエリアから直接頂点位置を編集できる。
- 図形をAfter Effectsのシェイプやマスクのように、画面上で直接操作したい場合は `IShapeSource2` が重要になる。
- 数値入力だけで完結する図形なら `IShapeSource` でよいが、頂点やハンドルをユーザーに触らせたい場合は `IShapeSource2` を使う。

### PathGeometryで多角形を描画する

多角形の描画には `ID2D1PathGeometry` を使用する。

```cs
using (var sink = geometry.Open())
{
    sink.BeginFigure(points[0], FigureBegin.Filled);
    sink.AddLines(points[1..]);
    sink.EndFigure(FigureEnd.Closed);
    sink.Close();
}
```

- `BeginFigure` で最初の頂点を指定する。
- `AddLines` で残りの頂点を追加する。
- `EndFigure(FigureEnd.Closed)` で図形を閉じる。
- 作成した `PathGeometry` を `FillGeometry` に渡すことで、多角形を塗りつぶして描画する。

### SampleShapePluginとの違い

- `SampleShapePlugin` は、サイズだけを持つ単純な四角形。
- `SamplePolygonShapePlugin` は、頂点リストを持つ多角形。
- `SampleShapePlugin` は `IShapeSource` を実装する。
- `SamplePolygonShapePlugin` は `IShapeSource2` を実装し、プレビュー上の制御点も提供する。
- 多角形サンプルでは、独自のプロパティエディタを使って頂点の追加、削除もできる。

## 詰みポイント

YMM4プラグインでは、コードが正しく見えても読み込みや表示で詰まることがある。

### プラグインが表示されない

- dllをプラグインフォルダに配置できているか確認する。
- ビルドターゲットがYMM4と合っているか確認する。
- `YukkuriMovieMaker.Plugin.dll` など、参照しているYMM4本体のdllが現在使っているYMM4のものか確認する。
- YMM4本体に含まれるdllを別バージョンで同梱していないか確認する。

### 図形が見つからない

- `IShapePlugin` を実装したクラスがあるか確認する。
- `Name` が他の図形と被っていないか確認する。
- YMM4を再起動しているか確認する。

### プロジェクトファイルを開くと例外が出る

- `ShapeParameterBase` を継承したクラスに、引数なしコンストラクタがあるか確認する。
- 保存対象のプロパティが正しく復元できるか確認する。
- `LoadSharedData` と `SaveSharedData` で、参照をそのまま使い回していないか確認する。

### 描画されない

- `Update` が呼ばれる前に `Output` が参照されても問題ない作りになっているか確認する。
- `commandList` を作成しているか確認する。
- `dc.EndDraw()` の後に `commandList.Close()` を呼んでいるか確認する。
- `dc.Target = null` に戻しているか確認する。
- 作成した図形の座標やサイズが、画面外や0になっていないか確認する。

### 重い、または不安定になる

- `Update` 内で毎回Direct2Dリソースを作り続けていないか確認する。
- 不要になった `CommandList`、`Geometry`、`Brush` を `Dispose` しているか確認する。
- パラメーターが変わっていないときは再描画を省略できないか確認する。

## 次に試すとよいこと

`SampleShapePlugin` が動いたら、次は次のような変更を試すとよい。

- `FillRectangle` を変更して、円や楕円を描画する。
- `Size` 以外のパラメーターを追加する。
- 色を変更できるようにする。
- グラデーションや枠線を追加する。
- `IShapeSource2` を使って、プレビュー上で操作できる制御点を追加する。

まず図形プラグインを作成する場合は、`SampleShapePlugin` のように、`IShapePlugin`、`ShapeParameterBase`、`IShapeSource` の3つを用意する構成から始めるとよい。
