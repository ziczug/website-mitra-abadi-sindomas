import json
with open(r'd:\2025\PT MASFOOD WEB\mitra-abadi\database\cms\news.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(f"Number of articles: {len(data)}")
for i, item in enumerate(data):
    print(f"Article {i+1}: ID={item.get('id')}, Title='{item.get('title')}', Active={item.get('active')}")
