import json
import sys

try:
    with open(r'd:\2025\PT MASFOOD WEB\mitra-abadi\database\cms\news.json', 'r', encoding='utf-8') as f:
        json.load(f)
    print("JSON is valid")
except Exception as e:
    print(f"JSON Error: {e}")
    sys.exit(1)
