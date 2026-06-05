import json

transcript_path = r'C:\Users\rodda\.gemini\antigravity\brain\0aac562d-e1f5-40ab-a6fe-aeca34b92052\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

steps = [json.loads(l) for l in lines]
user_requests = [s for s in steps if s.get('type') == 'USER_INPUT']

out = open("audit_report.txt", "w", encoding="utf-8")
def log(s): out.write(str(s) + "\n")

log(f'Total USER_INPUT steps: {len(user_requests)}')

last_10 = user_requests[-10:] if len(user_requests) >= 10 else user_requests
log('--- Last 10 User Requests ---')
for u in last_10:
    content = u.get("content", "")[:100].replace("\n", " ")
    log(f'Step {u.get("step_index")}: {content}')

tool_calls = []
for s in steps:
    if s.get('type') == 'PLANNER_RESPONSE' and s.get('tool_calls'):
        tool_calls.extend(s.get('tool_calls'))

subagent_calls = [tc for tc in tool_calls if tc.get('name') == 'invoke_subagent']
log(f'\nTotal subagent invocations: {len(subagent_calls)}')
for sc in subagent_calls:
    log(sc)

view_file_calls = [tc for tc in tool_calls if tc.get('name') == 'view_file']
memory_loads = [tc for tc in view_file_calls if 'MEMORY.md' in str(tc) or 'SKILL.md' in str(tc)]
log(f'\nTotal memory/skill reads via view_file: {len(memory_loads)}')
for ml in memory_loads:
    log(ml)

write_file_calls = [tc for tc in tool_calls if tc.get('name') in ['write_to_file', 'multi_replace_file_content']]
memory_writes = [tc for tc in write_file_calls if 'MEMORY.md' in str(tc)]
log(f'\nTotal memory writes: {len(memory_writes)}')
for mw in memory_writes:
    log(mw)

out.close()
