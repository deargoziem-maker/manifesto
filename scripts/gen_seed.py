import re, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
    src = f.read()

def sql_str(s):
    return "'" + s.replace("'", "''") + "'"

AXIS_NAME = {"econ":"Economy","struct":"The federation","social":"Social order",
             "security":"Security and liberty","represent":"Representation",
             "method":"Method of change","horizon":"Horizon"}
CIVIC_NAME = {"demo":"Democratic commitment","plur":"Pluralism","acct":"Accountability over delivery",
              "imp":"Impartiality","eff":"Political efficacy","exit":"Exit pull"}
LIKERT = [("A","Strongly agree"),("B","Agree"),("C","Unsure or it depends"),("D","Disagree"),("E","Strongly disagree")]

questions = []  # each: dict(code, experience_type, category, prompt, answers=[(code,label)])

# ---- Q (compass part 1) ----
q_block_start = src.index('var Q=[')
q_block_end = src.index('\n];', q_block_start)
q_block = src[q_block_start:q_block_end]
for m in re.finditer(r'\{code:"(?P<code>ECON_\d+|STRUCT_\d+|SOCIAL_\d+|SECURITY_\d+|REPRESENT_\d+|METHOD_\d+|HORIZON_\d+)",a:"(?P<axis>\w+)",w:(?P<w>-?[\d.]+),t:"(?P<t>[^"]*)"', q_block):
    code, axis, t = m.group('code'), m.group('axis'), m.group('t')
    questions.append({
        "code": code, "experience_type": "compass", "category": axis,
        "prompt": t, "question_version": "v1",
        "answers": [(f"{code}_{L}", label) for L, label in LIKERT]
    })

# ---- CIVIC (compass part 2) ----
c_block_start = src.index('var CIVIC=[')
c_block_end = src.index('\n];', c_block_start)
c_block = src[c_block_start:c_block_end]
for m in re.finditer(r'\{code:"(?P<code>DEMO_\d+|PLUR_\d+|ACCT_\d+|IMP_\d+|EFF_\d+|EXIT_\d+)",m:"(?P<cat>\w+)",k:(?P<k>-?\d+),t:"(?P<t>[^"]*)"', c_block):
    code, cat, t = m.group('code'), m.group('cat'), m.group('t')
    questions.append({
        "code": code, "experience_type": "compass", "category": cat,
        "prompt": t, "question_version": "v1",
        "answers": [(f"{code}_{L}", label) for L, label in LIKERT]
    })

# ---- DECK (president) ----
d_block_start = src.index('var DECK=[')
d_block_end = src.index('\n];', d_block_start)
d_block = src[d_block_start:d_block_end]
# split into per-card chunks anchored on {code:"PRES_NNN"
parts = re.split(r'(?=\{code:"PRES_\d+")', d_block)
for part in parts:
    m = re.match(r'\{code:"(PRES_\d+)",w:"([^"]*)"(?:,req:"(\w+)")?,s:"([^"]*)"', part)
    if not m:
        continue
    code, who, req, quote = m.groups()
    lm = re.search(r'l:\{t:"([^"]*)"', part)
    rm = re.search(r'r:\{t:"([^"]*)"', part)
    ltext = lm.group(1) if lm else "Left choice"
    rtext = rm.group(1) if rm else "Right choice"
    questions.append({
        "code": code, "experience_type": "president", "category": "decision",
        "prompt": quote, "question_version": "v1",
        "answers": [(f"{code}_L", ltext), (f"{code}_R", rtext)]
    })

# ---- THIRD ----
t_m = re.search(r'var THIRD=\{code:"(PRES_THIRD)",w:"([^"]*)",\s*s:"([^"]*)"', src)
if t_m:
    code, who, quote = t_m.groups()
    lm = re.search(r'l:\{t:"([^"]*)"', src[t_m.end():t_m.end()+300])
    rm = re.search(r'r:\{t:"([^"]*)"', src[t_m.end():t_m.end()+300])
    questions.append({
        "code": code, "experience_type": "president", "category": "decision",
        "prompt": quote, "question_version": "v1",
        "answers": [(f"{code}_L", lm.group(1) if lm else "Put it to the Assembly."),
                    (f"{code}_R", rm.group(1) if rm else "Two terms. Then I go.")]
    })

print(f"-- Extracted {len(questions)} questions "
      f"({sum(1 for q in questions if q['experience_type']=='compass')} compass, "
      f"{sum(1 for q in questions if q['experience_type']=='president')} president)")

out_dir = os.path.join(ROOT, "supabase", "migrations")

# ---- generate SQL ----
lines = []
lines.append("-- Auto-generated seed data extracted from index.html's Q/CIVIC/DECK/THIRD arrays.")
lines.append("-- Regenerate with `python3 scripts/gen_seed.py` whenever question wording changes AND a")
lines.append("-- new question_version is introduced (do not overwrite v1 rows once responses exist).")
lines.append("")
for q in questions:
    lines.append(
        f"insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) "
        f"values ({sql_str(q['code'])}, {sql_str(q['experience_type'])}, {sql_str(q['category'])}, "
        f"{sql_str(q['question_version'])}, true, {sql_str(q['prompt'])});"
    )
    for acode, alabel in q["answers"]:
        lines.append(
            f"insert into answers (question_id, stable_answer_code, answer_label) "
            f"select id, {sql_str(acode)}, {sql_str(alabel)} from questions where stable_question_code = {sql_str(q['code'])};"
        )
    lines.append("")

out_path = os.path.join(out_dir, "0002_seed_questions.sql")
with open(out_path, "w") as f:
    f.write("\n".join(lines))

print(f"Wrote {out_path} ({len(lines)} lines)")
