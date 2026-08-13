import re

url = "https://www.typing.com/dist/student/js/app.739.js"
print("Fetching app.739.js...")
response = __import__('requests').get(url, headers={'User-Agent': 'Mozilla/5.0'})
content = response.text
print("Downloaded.")

# Let's search for "handleKeyTyped" or the context around "playKeySprite(e)"
matches = [m.start() for m in re.finditer(r"playKeySprite\((?:[a-zA-Z0-9]+)\)", content)]
for idx, start in enumerate(matches):
    start_idx = max(0, start - 500)
    end_idx = min(len(content), start + 500)
    snippet = content[start_idx:end_idx]
    print(f"\n--- playKeySprite invocation {idx+1} ---")
    print(snippet)

# Let's also print the entire JSON sprite object in Match 5
sprite_match = re.search(r'{"src":\["keysprite\.mp3"\].*?\}', content)
if sprite_match:
    print("\n--- Sprite Map JSON ---")
    print(sprite_match.group(0))
