# デジタルファブリケーション成果サイト

学生の制作物をCSVから読み込み、画像・STL・Tinkercadリンクをカード表示する静的サイトです。

## 使い方

1. `data/works.csv` を編集します。
2. 画像は `assets/images/`、STLは `assets/stl/` に配置します。
3. `index.html` をブラウザで開いて確認します。

## CSVスキーマ

ヘッダーは以下の順で作成してください。

```text
id,title,student,year,department,tags,description,image,stl,tinkercad
```

- `image` / `stl` はリポジトリ内の相対パス（例: `assets/images/xxx.jpg`）
- `tags` は `|` 区切り（例: `laser|3dprint`）
- `tinkercad` は外部リンク（埋め込みなし）

## GitHub Pages 公開

1. GitHubにこのフォルダをリポジトリとしてpush
2. GitHubの `Settings` → `Pages` を開く
3. `Build and deployment` で `Deploy from a branch` を選択
4. ブランチは `main`、フォルダは `/ (root)` を選択
5. 発行されたURLにアクセス

## Three.js をローカル配置する場合

CDNを使わずローカルに配置する場合、以下の3ファイルを配置してください。

- `assets/vendor/three/three.module.min.js`
- `assets/vendor/three/three.core.min.js`
- `assets/vendor/three/OrbitControls.js`
- `assets/vendor/three/STLLoader.js`

`index.html` は importmap を使って `three` を上記パスに解決します。

## pptx2pdf.py の使い方

PowerPoint（.pptx）をPDFに一括変換するスクリプトです。

### 準備（pptx2pdf.py）

- LibreOffice がインストールされていること（`soffice` コマンドが使える状態）

### 実行例（pptx2pdf.py）

```bash
python3 pptx2pdf.py <フォルダパス>
```

指定したフォルダ内の `.pptx` をすべて `pdf` に変換し、同じフォルダに出力します。

## pdf_firstpage_to_png.py の使い方

PDFの1ページ目を16:9のPNGサムネイルに一括変換します。

### 準備（pdf_firstpage_to_png.py）

- PyMuPDF と Pillow をインストール

```bash
pip install pymupdf pillow
```

### 実行例（pdf_firstpage_to_png.py）

```bash
python3 pdf_firstpage_to_png.py
```

### 出力先

- `pdf/` 内のPDFを読み込み、`thumbnails/` に `PDF名.png` で保存します
- 例: `pdf/1522003.pdf` → `thumbnails/1522003.png`

### オプション

- `--input-dir` でPDFフォルダを変更
- `--output-dir` で出力先を変更
- `--width` / `--height` で画像サイズを変更

## 重要メモ

- 画像やSTLが未設定でも動作します（プレースホルダー画像を参照）
- Tinkercadは外部リンクのみです
- STLビューアはThree.jsをローカル配置で読み込みます
