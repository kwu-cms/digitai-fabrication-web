import argparse
import os
import sys


def load_dependencies():
    try:
        import fitz  # PyMuPDF
        from PIL import Image
    except Exception as exc:  # pragma: no cover - runtime check only
        print("必要なライブラリが不足しています: PyMuPDF, Pillow", file=sys.stderr)
        print("インストール例: pip install pymupdf pillow", file=sys.stderr)
        raise SystemExit(1) from exc
    return fitz, Image


def render_first_page(pdf_path, target_w, target_h, bg_color):
    fitz, Image = load_dependencies()
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(0)
        zoom = max(target_w / page.rect.width, target_h / page.rect.height)
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        canvas = Image.new("RGB", (target_w, target_h), bg_color)
        img.thumbnail((target_w, target_h), Image.LANCZOS)
        offset_x = (target_w - img.width) // 2
        offset_y = (target_h - img.height) // 2
        canvas.paste(img, (offset_x, offset_y))
        return canvas
    finally:
        doc.close()


def main():
    parser = argparse.ArgumentParser(description="PDFの1ページ目を16:9でPNG書き出し")
    parser.add_argument(
        "--input-dir",
        default="pdf",
        help="入力PDFフォルダ (default: pdf)",
    )
    parser.add_argument(
        "--output-dir",
        default="thumbnails",
        help="出力先フォルダ (default: thumbnails)",
    )
    parser.add_argument("--width", type=int, default=1280, help="出力幅 (default: 1280)")
    parser.add_argument("--height", type=int, default=720, help="出力高さ (default: 720)")
    parser.add_argument("--bg", default="#f8fafc", help="背景色 (default: #f8fafc)")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    if not os.path.isdir(args.input_dir):
        print(f"PDFフォルダが見つかりません: {args.input_dir}", file=sys.stderr)
        return 1

    pdf_files = sorted(
        filename
        for filename in os.listdir(args.input_dir)
        if filename.lower().endswith(".pdf")
    )
    if not pdf_files:
        print("PDFが見つかりませんでした。")
        return 0

    for filename in pdf_files:
        input_pdf = os.path.join(args.input_dir, filename)
        base_name = os.path.splitext(os.path.basename(input_pdf))[0]
        output_path = os.path.join(args.output_dir, f"{base_name}.png")
        image = render_first_page(input_pdf, args.width, args.height, args.bg)
        image.save(output_path, format="PNG")
        print(f"出力完了: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
