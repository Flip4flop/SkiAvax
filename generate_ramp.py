#!/usr/bin/env python3
"""Generate a simple ramp sprite (52x20px) without external dependencies"""
import struct
import zlib

def create_png(width, height, pixels):
    """Create a PNG file from RGBA pixel data"""
    def chunk(name, data):
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)

    # PNG header
    png = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += chunk(b'IHDR', ihdr)

    # IDAT chunk (image data)
    raw = b''
    for row in pixels:
        raw += b'\x00'  # Filter type
        raw += row
    png += chunk(b'IDAT', zlib.compress(raw, 9))

    # IEND chunk
    png += chunk(b'IEND', b'')

    return png

# Create ramp sprite (52x20px)
width, height = 52, 20
pixels = []

# Brown ramp colors
brown = bytes([139, 69, 19, 255])  # RGB(139,69,19) = saddle brown
dark_brown = bytes([101, 50, 14, 255])  # Darker outline
transparent = bytes([0, 0, 0, 0])

for y in range(height):
    row = b''
    for x in range(width):
        # Create a right triangle ramp shape
        # Ramp goes from bottom-left to top-right
        if x >= (width - 1) - (y * width // height):
            # Inside the ramp triangle
            # Add darker edge on the slope
            if x == (width - 1) - (y * width // height) or x == (width - 1) - (y * width // height) + 1:
                row += dark_brown
            else:
                row += brown
        else:
            row += transparent
    pixels.append(row)

# Generate PNG
png_data = create_png(width, height, pixels)

# Save to file
with open('/home/user/SkiAvax/assets/temp_sprites/ramp.png', 'wb') as f:
    f.write(png_data)

print(f'✓ ramp.png created! ({width}x{height}px brown ski ramp)')
