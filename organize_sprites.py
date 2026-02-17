#!/usr/bin/env python3
"""
SkiAvax Sprite Organizer
Automatically organizes sprites from temp_sprites into proper folder structure
"""
import os
import shutil
import json
from pathlib import Path

# Get the script's directory (should be SkiAvax root)
ROOT_DIR = Path(__file__).parent
TEMP_DIR = ROOT_DIR / 'assets' / 'temp_sprites'
SPRITES_DIR = ROOT_DIR / 'assets' / 'sprites'
MANIFEST_FILE = ROOT_DIR / 'assets' / 'manifest.json'

# Sprite organization mapping (based on manifest.json)
SPRITE_FOLDERS = {
    # Player sprites (10 files)
    'player': [
        'player_left_fast.png',
        'player_left.png',
        'player_left_slight.png',
        'player_down.png',
        'player_right_slight.png',
        'player_right.png',
        'player_right_fast.png',
        'player_jump.png',
        'player_crash.png',
        'player_caught.png',
    ],

    # Obstacles (5 files)
    'obstacles': [
        'avax_tree.png',
        'blackhole.png',
        'snowbank.png',
        'ramp.png',
        'gate_flag.png',
    ],

    # Collectibles (2 files)
    'collectibles': [
        'avax_token.png',
        'phar_token.png',
    ],

    # NPCs (8 files)
    'npcs': [
        'benqi.png',
        'salvor.png',
        'blaze.png',
        'arena.png',
        'yieldyak.png',
        'dokyo.png',
        'dexalot.png',
        'pangolin.png',
    ],

    # Boss (1 file)
    'boss': [
        'lfj_joe.png',
    ],

    # UI (1 file)
    'ui': [
        'skiavax_logo.png',
    ],
}

def main():
    print("=" * 60)
    print("🎿 SkiAvax Sprite Organizer")
    print("=" * 60)
    print()

    # Check if temp_sprites directory exists
    if not TEMP_DIR.exists():
        print(f"❌ Error: temp_sprites directory not found at:")
        print(f"   {TEMP_DIR}")
        print()
        print("Please make sure your sprites are in:")
        print("   assets/temp_sprites/")
        return 1

    # Get list of files in temp_sprites
    temp_files = [f.name for f in TEMP_DIR.iterdir() if f.is_file() and f.suffix == '.png']

    if not temp_files:
        print(f"❌ No PNG files found in {TEMP_DIR}")
        return 1

    print(f"📂 Found {len(temp_files)} PNG files in temp_sprites/")
    print()

    # Create sprite subdirectories
    print("📁 Creating folder structure...")
    for folder_name in SPRITE_FOLDERS.keys():
        folder_path = SPRITES_DIR / folder_name
        folder_path.mkdir(parents=True, exist_ok=True)
        print(f"   ✓ {folder_path}")
    print()

    # Organize sprites
    moved_count = 0
    missing_files = []

    print("📦 Organizing sprites...")
    print()

    for folder_name, file_list in SPRITE_FOLDERS.items():
        print(f"  {folder_name}/")
        for filename in file_list:
            src_path = TEMP_DIR / filename
            dst_path = SPRITES_DIR / folder_name / filename

            if src_path.exists():
                # Copy file (keeping original in temp_sprites as backup)
                shutil.copy2(src_path, dst_path)
                print(f"    ✓ {filename}")
                moved_count += 1
            else:
                print(f"    ✗ {filename} (NOT FOUND)")
                missing_files.append(filename)
        print()

    # Summary
    print("=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"✓ Organized: {moved_count}/{27} sprites")

    if missing_files:
        print(f"⚠ Missing: {len(missing_files)} files")
        print()
        print("Missing files:")
        for filename in missing_files:
            print(f"  - {filename}")
        print()
        print("These sprites need to be:")
        print("  1. Renamed correctly (check for capitalization)")
        print("  2. Added to temp_sprites/ folder")
    else:
        print("🎉 All sprites organized successfully!")
        print()
        print("✓ Original files kept in temp_sprites/ as backup")
        print("✓ Sprites copied to assets/sprites/ subdirectories")

    print()
    print("=" * 60)
    print("Next step: Test the game by opening index.html in a browser!")
    print("=" * 60)

    return 0 if not missing_files else 1

if __name__ == '__main__':
    exit(main())
