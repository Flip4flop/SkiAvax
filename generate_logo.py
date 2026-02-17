#!/usr/bin/env python3
"""Generate a simple SkiAvax logo (128x48px) without external dependencies"""
import struct
import zlib

def create_png(width, height, pixels):
    """Create a PNG file from RGBA pixel data"""
    def chunk(name, data):
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += chunk(b'IHDR', ihdr)

    raw = b''
    for row in pixels:
        raw += b'\x00'
        raw += row
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')

    return png

# Create simple SkiAvax logo (128x48px)
width, height = 128, 48
pixels = []

# AVAX red color
avax_red = bytes([232, 65, 66, 255])  # #E84142
white = bytes([255, 255, 255, 255])
transparent = bytes([0, 0, 0, 0])

for y in range(height):
    row = b''
    for x in range(width):
        # Simple design: AVAX triangle on left, transparent background
        if 10 <= x <= 38 and 8 <= y <= 40:
            # Draw simple triangle in the left portion
            triangle_x = x - 24
            triangle_y = y - 24
            if abs(triangle_x) + abs(triangle_y) < 14:
                row += avax_red
            else:
                row += transparent
        else:
            row += transparent
    pixels.append(row)

png_data = create_png(width, height, pixels)

with open('/home/user/SkiAvax/assets/temp_sprites/skiavax_logo.png', 'wb') as f:
    f.write(png_data)

print(f'✓ skiavax_logo.png created! ({width}x{height}px with AVAX triangle)')
