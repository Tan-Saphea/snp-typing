import requests
import re
import os

files_to_scan = [
    "https://www.typing.com/bootstrap/language/en/student.739.js",
    "https://www.typing.com/bootstrap/typing/en/bootstrap.739.js",
    "https://www.typing.com/bootstrap/lesson/typing/en/385.739.js",
    "https://www.typing.com/dist/student/js/app.739.js"
]

print("Starting scan...")

for url in files_to_scan:
    filename = url.split("/")[-1]
    print(f"Downloading {url}...")
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            content = response.text
            print(f"File {filename} downloaded successfully, size: {len(content)} characters.")
            
            # Look for audio file extensions
            audio_extensions = re.findall(r'[\'"][^\'"]+\.(?:mp3|wav|ogg|m4a|aac)[\'"]', content)
            if audio_extensions:
                print(f"Found potential audio file paths in {filename}:")
                for path in set(audio_extensions):
                    print(f"  - {path}")
            
            # Look for AudioContext or how audio is synthesized or defined
            audio_ctx = re.findall(r'AudioContext|createOscillator|createDynamicsCompressor', content)
            if audio_ctx:
                print(f"Found AudioContext/Synthesis references in {filename}: {set(audio_ctx)}")
            
            # Let's search for keywords related to typing sound or keyboard sound
            keywords = ["keyboard", "sound", "click", "keypress", "audio"]
            for keyword in keywords:
                matches = [m.start() for m in re.finditer(keyword, content, re.IGNORECASE)]
                if matches:
                    print(f"Found {len(matches)} occurrences of '{keyword}' in {filename}.")
                    # Print first 2 snippet contexts of the matches
                    for idx, start in enumerate(matches[:3]):
                        start_idx = max(0, start - 50)
                        end_idx = min(len(content), start + 50)
                        snippet = content[start_idx:end_idx].replace('\n', ' ')
                        print(f"    Snippet {idx+1}: ... {snippet} ...")
        else:
            print(f"Failed to download {url}, status code: {response.status_code}")
    except Exception as e:
        print(f"Error scanning {url}: {e}")
