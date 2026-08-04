from PIL import Image
import sys

def remove_background(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        # Get the background color from the top-left pixel
        bg_color = datas[0]
        
        newData = []
        # Allow a small threshold for anti-aliasing
        threshold = 30
        
        for item in datas:
            # Check if pixel is close to background color
            if (abs(item[0] - bg_color[0]) < threshold and 
                abs(item[1] - bg_color[1]) < threshold and 
                abs(item[2] - bg_color[2]) < threshold):
                # Replace with transparent
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # Crop the image to bounding box of non-transparent pixels
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(output_path, "PNG")
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    remove_background(sys.argv[1], sys.argv[2])
