with open('Core/api/main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.startswith('@app.get("/alerts")'):
        start_idx = i
    if start_idx != -1 and i > start_idx:
        if line.startswith('@app.get("/intelligence/unverified")'):
            end_idx = i - 1
            break

if start_idx != -1 and end_idx != -1:
    while lines[end_idx].strip() == '':
        end_idx -= 1
    
    original = lines[start_idx:end_idx+1]
    
    new_lines = []
    new_lines.append(original[0]) # @app.get...
    new_lines.append(original[1]) # async def get_alerts...
    new_lines.append('    try:\n')
    for line in original[2:]:
        if line == '\n' or line.strip() == '':
            new_lines.append(line)
        else:
            new_lines.append('    ' + line)
    new_lines.append('    except Exception as e:\n')
    new_lines.append('        raise HTTPException(status_code=500, detail=str(e))\n\n')
    
    lines = lines[:start_idx] + new_lines + lines[end_idx+1:]
    
    with open('Core/api/main.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print('Successfully updated /alerts in main.py')
else:
    print('Could not find bounds for /alerts')
