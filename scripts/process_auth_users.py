import sys
import re
import csv

def parse_gomap(text):
    text = text.strip()
    if text.startswith('['): text = text[1:]
    if text.endswith(']'): text = text[:-1]
    maps = re.findall(r'map\[(.*?)\]', text)
    results = []
    for m in maps:
        pairs = re.findall(r'(\w+):(<nil>|[^:]+?)(?=\s+\w+:|$)', m)
        entry = {}
        for k, v in pairs:
            entry[k] = v.strip() if v.strip() != '<nil>' else None
        results.append(entry)
    return results

files = ['/tmp/auth1.txt', '/tmp/auth2.txt', '/tmp/auth3.txt']
all_data = []
for f_path in files:
    with open(f_path, 'r') as f:
        all_data.extend(parse_gomap(f.read()))

with open('/mnt/documents/auth_users.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'email'])
    writer.writeheader()
    writer.writerows(all_data)
print(f"Exported auth_users.csv with {len(all_data)} entries")
