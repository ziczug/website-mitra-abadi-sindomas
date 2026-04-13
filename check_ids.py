import re

with open('admin.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

with open('admin.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

ids = re.findall(r"getElementById\('([^']+)'\)", js_content)
missing = set()
for html_id in set(ids):
    if f'id="{html_id}"' not in html_content and f"id='{html_id}'" not in html_content:
        missing.add(html_id)

if missing:
    print('Missing IDs in admin.html:')
    for m in missing:
        print(m)
else:
    print('No missing IDs found.')
