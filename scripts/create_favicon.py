#!/usr/bin/env python3
"""
既存の画像からfavicon.icoを作成するスクリプト
Pillowが必要: pip install pillow
"""

from PIL import Image
import sys
import os

def create_favicon(input_path, output_path="favicon.ico", sizes=[16, 32, 48]):
    """
    画像からfavicon.icoを作成
    
    Args:
        input_path: 入力画像のパス
        output_path: 出力先のパス（デフォルト: favicon.ico）
        sizes: faviconのサイズリスト
    """
    try:
        # 画像を開く
        img = Image.open(input_path)
        
        # RGBAモードに変換（透明度をサポート）
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # 各サイズのアイコンを作成
        icons = []
        for size in sizes:
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            icons.append(resized)
        
        # favicon.icoとして保存
        icons[0].save(
            output_path,
            format='ICO',
            sizes=[(s, s) for s in sizes],
            append_images=icons[1:] if len(icons) > 1 else []
        )
        
        print(f"✓ favicon.icoを作成しました: {output_path}")
        return True
        
    except Exception as e:
        print(f"✗ エラー: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使い方: python3 scripts/create_favicon.py <画像パス> [出力パス]")
        print("例: python3 scripts/create_favicon.py images/logo.png")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "favicon.ico"
    
    if not os.path.exists(input_path):
        print(f"✗ ファイルが見つかりません: {input_path}")
        sys.exit(1)
    
    create_favicon(input_path, output_path)
