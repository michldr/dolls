#!/usr/bin/env python3
import re
import json

# Read the original file
with open(r'e:\almog\src\cities.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the object content between first { and last }
match = re.search(r'const missionControl = \{(.*)\};', content, re.DOTALL)
if not match:
    print("Could not find missionControl object")
    exit(1)

obj_content = match.group(1)

# Split by top-level keys: find pattern "key": {
entries = []
pattern = r'"([^"]+)"\s*:\s*\{'
pos = 0
for m in re.finditer(pattern, obj_content):
    key = m.group(1)
    start = m.start(1) - 1  # include the opening quote
    # Find the matching closing brace for this entry
    brace_pos = m.end() - 1  # position of the opening brace
    depth = 1
    i = brace_pos + 1
    while i < len(obj_content) and depth > 0:
        if obj_content[i] == '{':
            depth += 1
        elif obj_content[i] == '}':
            depth -= 1
        i += 1
    end = i  # position after the closing brace
    
    # Extract value part as JSON
    val_str = obj_content[brace_pos:end]
    try:
        val_dict = json.loads(val_str)
        entries.append((key, val_dict))
    except json.JSONDecodeError as e:
        print(f"Error parsing entry {key}: {e}")

print(f"Found {len(entries)} entries")

# Sort by Hebrew name
entries.sort(key=lambda x: x[1].get('name', ''))

# Rebuild the file
output = 'const missionControl = {\n'
for i, (key, val) in enumerate(entries):
    val_json = json.dumps(val, ensure_ascii=False, indent=4)
    # indent each line by 4 spaces (except the first, which is {)
    lines = val_json.split('\n')
    indented = '{\n' + '\n'.join('    ' + line for line in lines[1:])
    
    comma = ',' if i < len(entries) - 1 else ''
    output += f'    "{key}": {indented}{comma}\n'

output += '};\n'

# Write the sorted file
with open(r'e:\almog\src\cities.js', 'w', encoding='utf-8') as f:
    f.write(output)

print(f"Sorted {len(entries)} cities and updated cities.js")
for key, val in entries[:5]:
    print(f"  {val['name']} ({key})")
print("  ...")
