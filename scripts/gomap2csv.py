import sys
import re
import csv
import os

def parse_gomap(text):
    # This is a very basic parser for the Go map format seen in tool results
    # [map[key:val key2:val2] map[...]]
    
    # Remove outer brackets
    text = text.strip()
    if text.startswith('['): text = text[1:]
    if text.endswith(']'): text = text[:-1]
    
    # Split into maps
    maps = re.findall(r'map\[(.*?)\]', text)
    
    results = []
    for m in maps:
        # Split key:val pairs. Note: values might contain spaces
        # This regex looks for space followed by key: (key usually doesn't have spaces)
        # However, it's safer to use a more complex one
        pairs = re.findall(r'(\w+):(<nil>|[^:]+?)(?=\s+\w+:|$)', m)
        entry = {}
        for k, v in pairs:
            v = v.strip()
            if v == '<nil>':
                v = None
            entry[k] = v
        results.append(entry)
    return results

def main():
    table_name = sys.argv[1]
    raw_file = sys.argv[2]
    output_file = f"/mnt/documents/{table_name}.csv"
    
    with open(raw_file, 'r') as f:
        content = f.read()
    
    data = parse_gomap(content)
    if not data:
        print(f"No data found for {table_name}")
        return
        
    headers = data[0].keys()
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data)
    print(f"Exported {output_file}")

if __name__ == "__main__":
    main()
