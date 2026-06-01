import sys
import re
import csv

def parse_gomap_list(text):
    # Matches map[?column?:id|email] or similar
    matches = re.findall(r'map\[\?column\?:([^\]]+)\]', text)
    results = []
    for m in matches:
        parts = m.split('|')
        if len(parts) == 2:
            results.append({'id': parts[0], 'email': parts[1]})
    return results

def parse_full_gomap(text):
    # More robust for any keys
    maps = re.findall(r'map\[(.*?)\]', text)
    results = []
    for m in maps:
        # Simple split by space, but handle <nil>
        pairs = re.findall(r'(\w+):(<nil>|[^:]+?)(?=\s+\w+:|$)', m)
        entry = {}
        for k, v in pairs:
            v = v.strip()
            if v == '<nil>': v = ''
            entry[k] = v
        if entry:
            results.append(entry)
    return results

# Process auth_users
auth_text = sys.stdin.read()
users = parse_gomap_list(auth_text)
if users:
    with open('/mnt/documents/auth_users.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'email'])
        writer.writeheader()
        writer.writerows(users)
    print(f"Exported {len(users)} users to auth_users.csv")
