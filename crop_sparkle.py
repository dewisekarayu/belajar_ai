from PIL import Image

def clean_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # Erase bottom right 200x200
    for y in range(max(0, height - 200), height):
        for x in range(max(0, width - 200), width):
            pixels[x, y] = (0, 0, 0, 0)
            
    # Crop to new bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Success. New size: {img.size}")

if __name__ == "__main__":
    clean_logo("c:/Users/lenovo/belajar-ai/ai-chat/public/logo.png", "c:/Users/lenovo/belajar-ai/ai-chat/public/logo.png")
