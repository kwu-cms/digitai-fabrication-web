# デジタルファブリケーション成果サイト

学生の制作物をCSVから読み込み、画像・STL・Tinkercadリンクをカード表示する静的サイトです。
**URL**: [https://kwu-cms.github.io/digitai-fabrication-web/](https://kwu-cms.github.io/digitai-fabrication-web/)

## 使い方

1. `data/works.csv` を編集します。
2. 画像は `images/`、STLは `stl/` に配置します。
3. `index.html` をブラウザで開いて確認します。

## CSVスキーマ

ヘッダーは以下の順で作成してください。

```text
id,title,student,year,department,tags,description,image,stl,tinkercad
```

- `image` / `stl` はリポジトリ内の相対パス（例: `images/xxx.jpg`）
- `tags` は `|` 区切り（例: `laser|3dprint`）
- `tinkercad` は外部リンク（埋め込みなし）

## データの読み込み元

既定では Google スプレッドシートの CSV を読み込みます。

GitHub Pages 上で `data/works.csv` を使う場合は、`assets/app.js` の `sheetId` を空にしてください。

```js
const sheetId = "";
```

## GitHub Pages 公開

### 公開手順

1. GitHubにこのフォルダをリポジトリとしてpush
2. GitHubの `Settings` → `Pages` を開く
3. `Build and deployment` で `GitHub Actions` を選択（または `Deploy from a branch` を選択）
4. ブランチは `main`、フォルダは `/ (root)` を選択
5. 発行されたURLにアクセス

## 制作関連メモ

詳細は [docs/development.md](docs/development.md) を参照してください。
