import re

# Read the local cache if we have it or download again. Since we didn't save app.739.js to disk, let's download just app.739.js or cache it.
# Actually let's download and cache it locally to avoid redownloading, or just fetch it and extract context.

url = "https://www.typing.com/dist/student/js/app.739.js"
print("Fetching app.739.js...")
response = requests = __import__('requests').get(url, headers={'User-Agent': 'Mozilla/5.0'})
content = response.text
print("Downloaded. Searching for 'keysprite'...")

matches = [m.start() for m in re.finditer("keysprite", content, re.IGNORECASE)]
for idx, start in enumerate(matches):
    start_idx = max(0, start - 200)
    end_idx = min(len(content), start + 800)
    snippet = content[start_idx:end_idx]
    print(f"\n--- Match {idx+1} ---")
    print(snippet)
