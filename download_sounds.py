import os
import requests

sound_dir = "/Users/tansaphea/Documents/5. Persional/Typing/client/public/sounds"
os.makedirs(sound_dir, exist_ok=True)

sounds = [
    "keysprite.mp3",
    "error.mp3",
    "pop.mp3",
    "star1.mp3",
    "star2.mp3",
    "star3.mp3"
]

base_url = "https://www.typing.com/dist/student/extras/sounds/"

for s in sounds:
    url = base_url + s
    target_path = os.path.join(sound_dir, s)
    print(f"Downloading {url} to {target_path}...")
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            with open(target_path, 'wb') as f:
                f.write(response.content)
            print(f"Successfully saved {s} (size: {len(response.content)} bytes).")
        else:
            print(f"Failed to download {s}: status code {response.status_code}")
    except Exception as e:
        print(f"Error downloading {s}: {e}")
