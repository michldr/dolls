import json
import locale
import re
from pathlib import Path

p = Path(r'e:\almog\src\cities.js')
text = p.read_text(encoding='utf-8')

start_token = 'const missionControl = {'
start = text.find(start_token)
if start == -1:
    raise SystemExit('missionControl object not found')
start_brace = text.find('{', start)
# find matching closing brace
i = start_brace
depth = 0
end_brace = -1
while i < len(text):
    ch = text[i]
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end_brace = i
            break
    i += 1
if end_brace == -1:
    raise SystemExit('Could not find end of missionControl object')

inner = text[start_brace+1:end_brace]
# parse top-level entries by scanning
entries = []
idx = 0
L = len(inner)
while idx < L:
    # skip whitespace and commas
    while idx < L and inner[idx] in ' \t\r\n,':
        idx += 1
    if idx >= L:
        break
    if inner[idx] != '"':
        raise SystemExit('Unexpected token when parsing key at idx %d: %r' % (idx, inner[idx:idx+10]))
    # read key
    end_q = inner.find('"', idx+1)
    key = inner[idx+1:end_q]
    idx = end_q+1
    # skip to colon
    colon = inner.find(':', idx)
    idx = colon+1
    # skip whitespace
    while idx < L and inner[idx] in ' \t\r\n':
        idx += 1
    if inner[idx] != '{':
        raise SystemExit('Expected object value for key %s' % key)
    # capture object by brace matching
    j = idx
    depth = 0
    while j < L:
        if inner[j] == '{':
            depth += 1
        elif inner[j] == '}':
            depth -= 1
            if depth == 0:
                break
        j += 1
    val_text = inner[idx:j+1]
    # convert to valid JSON: remove trailing commas before closing braces/brackets
    val_text_fixed = re.sub(r',\s*(\]|\})', r'\1', val_text)
    try:
        val = json.loads(val_text_fixed)
    except Exception as e:
        raise SystemExit(f'JSON parse error for key {key}: {e}\n{text[idx-40: j+40]}')
    entries.append((key, val))
    idx = j+1

# attempt Hebrew collation
use_locale = False
try:
    locale.setlocale(locale.LC_COLLATE, 'he_IL.UTF-8')
    use_locale = True
except Exception:
    try:
        locale.setlocale(locale.LC_COLLATE, 'he_IL')
        use_locale = True
    except Exception:
        use_locale = False

if use_locale:
    entries.sort(key=lambda kv: locale.strxfrm(kv[1].get('name','')))
else:
    entries.sort(key=lambda kv: kv[1].get('name',''))

# build output
out_lines = []
out_lines.append('const missionControl = {')
for i, (k, v) in enumerate(entries):
    vstr = json.dumps(v, ensure_ascii=False, indent=4)
    # indent the JSON block by 4 spaces
    vstr_ind = '\n'.join('    ' + line for line in vstr.splitlines())
    comma = ',' if i < len(entries)-1 else ''
    out_lines.append(f'    "{k}": {vstr_ind}{comma}')
out_lines.append('};')

# backup original
bak = p.with_suffix('.js.bak')
if not bak.exists():
    p.rename(bak)
    orig_text = bak.read_text(encoding='utf-8')
else:
    orig_text = p.read_text(encoding='utf-8')

p.write_text('\n'.join(out_lines)+"\n", encoding='utf-8')
print('Sorted', len(entries), 'cities and wrote', p)
print('Backup of original saved as', bak)
