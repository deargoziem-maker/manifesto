-- Auto-generated seed data extracted from index.html's Q/CIVIC/DECK/THIRD arrays.
-- Regenerate with `python3 scripts/gen_seed.py` whenever question wording changes AND a
-- new question_version is introduced (do not overwrite v1 rows once responses exist).

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('ECON_001', 'compass', 'econ', 'v1', true, 'Free secondary education and primary healthcare should be guaranteed by government for every Nigerian, funded from public revenue.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_001_A', 'Strongly agree' from questions where stable_question_code = 'ECON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_001_B', 'Agree' from questions where stable_question_code = 'ECON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_001_C', 'Unsure or it depends' from questions where stable_question_code = 'ECON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_001_D', 'Disagree' from questions where stable_question_code = 'ECON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_001_E', 'Strongly disagree' from questions where stable_question_code = 'ECON_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('ECON_002', 'compass', 'econ', 'v1', true, 'Government should sell its remaining stakes in refineries, ports and power assets to private operators.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_002_A', 'Strongly agree' from questions where stable_question_code = 'ECON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_002_B', 'Agree' from questions where stable_question_code = 'ECON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_002_C', 'Unsure or it depends' from questions where stable_question_code = 'ECON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_002_D', 'Disagree' from questions where stable_question_code = 'ECON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_002_E', 'Strongly disagree' from questions where stable_question_code = 'ECON_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('ECON_003', 'compass', 'econ', 'v1', true, 'Cutting taxes and regulation on business will do more for jobs than any government programme.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_003_A', 'Strongly agree' from questions where stable_question_code = 'ECON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_003_B', 'Agree' from questions where stable_question_code = 'ECON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_003_C', 'Unsure or it depends' from questions where stable_question_code = 'ECON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_003_D', 'Disagree' from questions where stable_question_code = 'ECON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ECON_003_E', 'Strongly disagree' from questions where stable_question_code = 'ECON_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('STRUCT_001', 'compass', 'struct', 'v1', true, 'Oil and mineral revenue belongs to all Nigerians and should be shared nationally, not kept where it is produced.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_001_A', 'Strongly agree' from questions where stable_question_code = 'STRUCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_001_B', 'Agree' from questions where stable_question_code = 'STRUCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_001_C', 'Unsure or it depends' from questions where stable_question_code = 'STRUCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_001_D', 'Disagree' from questions where stable_question_code = 'STRUCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_001_E', 'Strongly disagree' from questions where stable_question_code = 'STRUCT_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('STRUCT_002', 'compass', 'struct', 'v1', true, 'States should own the minerals and oil under their territory and pay tax to the centre.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_002_A', 'Strongly agree' from questions where stable_question_code = 'STRUCT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_002_B', 'Agree' from questions where stable_question_code = 'STRUCT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_002_C', 'Unsure or it depends' from questions where stable_question_code = 'STRUCT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_002_D', 'Disagree' from questions where stable_question_code = 'STRUCT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_002_E', 'Strongly disagree' from questions where stable_question_code = 'STRUCT_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('STRUCT_003', 'compass', 'struct', 'v1', true, 'States should run their own police forces instead of relying on one national force.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_003_A', 'Strongly agree' from questions where stable_question_code = 'STRUCT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_003_B', 'Agree' from questions where stable_question_code = 'STRUCT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_003_C', 'Unsure or it depends' from questions where stable_question_code = 'STRUCT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_003_D', 'Disagree' from questions where stable_question_code = 'STRUCT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'STRUCT_003_E', 'Strongly disagree' from questions where stable_question_code = 'STRUCT_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('SOCIAL_001', 'compass', 'social', 'v1', true, 'Religious teaching should shape the laws Nigeria passes.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_001_A', 'Strongly agree' from questions where stable_question_code = 'SOCIAL_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_001_B', 'Agree' from questions where stable_question_code = 'SOCIAL_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_001_C', 'Unsure or it depends' from questions where stable_question_code = 'SOCIAL_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_001_D', 'Disagree' from questions where stable_question_code = 'SOCIAL_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_001_E', 'Strongly disagree' from questions where stable_question_code = 'SOCIAL_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('SOCIAL_002', 'compass', 'social', 'v1', true, 'A minimum share of elected and appointed offices should be reserved for women.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_002_A', 'Strongly agree' from questions where stable_question_code = 'SOCIAL_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_002_B', 'Agree' from questions where stable_question_code = 'SOCIAL_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_002_C', 'Unsure or it depends' from questions where stable_question_code = 'SOCIAL_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_002_D', 'Disagree' from questions where stable_question_code = 'SOCIAL_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_002_E', 'Strongly disagree' from questions where stable_question_code = 'SOCIAL_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('SOCIAL_003', 'compass', 'social', 'v1', true, 'Nigerians under 40 are ready to hold the highest offices now.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_003_A', 'Strongly agree' from questions where stable_question_code = 'SOCIAL_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_003_B', 'Agree' from questions where stable_question_code = 'SOCIAL_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_003_C', 'Unsure or it depends' from questions where stable_question_code = 'SOCIAL_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_003_D', 'Disagree' from questions where stable_question_code = 'SOCIAL_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SOCIAL_003_E', 'Strongly disagree' from questions where stable_question_code = 'SOCIAL_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('SECURITY_001', 'compass', 'security', 'v1', true, 'The right to protest must hold even when government says it threatens public order.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_001_A', 'Strongly agree' from questions where stable_question_code = 'SECURITY_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_001_B', 'Agree' from questions where stable_question_code = 'SECURITY_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_001_C', 'Unsure or it depends' from questions where stable_question_code = 'SECURITY_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_001_D', 'Disagree' from questions where stable_question_code = 'SECURITY_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_001_E', 'Strongly disagree' from questions where stable_question_code = 'SECURITY_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('SECURITY_002', 'compass', 'security', 'v1', true, 'Security forces should be able to act without waiting on courts when lives are at risk.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_002_A', 'Strongly agree' from questions where stable_question_code = 'SECURITY_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_002_B', 'Agree' from questions where stable_question_code = 'SECURITY_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_002_C', 'Unsure or it depends' from questions where stable_question_code = 'SECURITY_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_002_D', 'Disagree' from questions where stable_question_code = 'SECURITY_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_002_E', 'Strongly disagree' from questions where stable_question_code = 'SECURITY_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('SECURITY_003', 'compass', 'security', 'v1', true, 'It is better that some innocent people are detained than that dangerous people go free.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_003_A', 'Strongly agree' from questions where stable_question_code = 'SECURITY_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_003_B', 'Agree' from questions where stable_question_code = 'SECURITY_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_003_C', 'Unsure or it depends' from questions where stable_question_code = 'SECURITY_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_003_D', 'Disagree' from questions where stable_question_code = 'SECURITY_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'SECURITY_003_E', 'Strongly disagree' from questions where stable_question_code = 'SECURITY_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('REPRESENT_001', 'compass', 'represent', 'v1', true, 'A representative''s first duty is to his own people and constituency, not to national policy.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_001_A', 'Strongly agree' from questions where stable_question_code = 'REPRESENT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_001_B', 'Agree' from questions where stable_question_code = 'REPRESENT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_001_C', 'Unsure or it depends' from questions where stable_question_code = 'REPRESENT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_001_D', 'Disagree' from questions where stable_question_code = 'REPRESENT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_001_E', 'Strongly disagree' from questions where stable_question_code = 'REPRESENT_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('REPRESENT_002', 'compass', 'represent', 'v1', true, 'Constituency funds should build public infrastructure, not buy items handed to individuals.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_002_A', 'Strongly agree' from questions where stable_question_code = 'REPRESENT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_002_B', 'Agree' from questions where stable_question_code = 'REPRESENT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_002_C', 'Unsure or it depends' from questions where stable_question_code = 'REPRESENT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_002_D', 'Disagree' from questions where stable_question_code = 'REPRESENT_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_002_E', 'Strongly disagree' from questions where stable_question_code = 'REPRESENT_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('REPRESENT_003', 'compass', 'represent', 'v1', true, 'You should vote on a party''s programme even if the candidate from your area offers you more.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_003_A', 'Strongly agree' from questions where stable_question_code = 'REPRESENT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_003_B', 'Agree' from questions where stable_question_code = 'REPRESENT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_003_C', 'Unsure or it depends' from questions where stable_question_code = 'REPRESENT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_003_D', 'Disagree' from questions where stable_question_code = 'REPRESENT_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'REPRESENT_003_E', 'Strongly disagree' from questions where stable_question_code = 'REPRESENT_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('METHOD_001', 'compass', 'method', 'v1', true, 'Mass protest is a legitimate and necessary tool when institutions fail.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_001_A', 'Strongly agree' from questions where stable_question_code = 'METHOD_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_001_B', 'Agree' from questions where stable_question_code = 'METHOD_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_001_C', 'Unsure or it depends' from questions where stable_question_code = 'METHOD_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_001_D', 'Disagree' from questions where stable_question_code = 'METHOD_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_001_E', 'Strongly disagree' from questions where stable_question_code = 'METHOD_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('METHOD_002', 'compass', 'method', 'v1', true, 'Change should come by working inside existing parties and institutions, however slow.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_002_A', 'Strongly agree' from questions where stable_question_code = 'METHOD_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_002_B', 'Agree' from questions where stable_question_code = 'METHOD_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_002_C', 'Unsure or it depends' from questions where stable_question_code = 'METHOD_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_002_D', 'Disagree' from questions where stable_question_code = 'METHOD_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_002_E', 'Strongly disagree' from questions where stable_question_code = 'METHOD_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('METHOD_003', 'compass', 'method', 'v1', true, 'Experienced insiders govern better than outsiders with new ideas.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_003_A', 'Strongly agree' from questions where stable_question_code = 'METHOD_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_003_B', 'Agree' from questions where stable_question_code = 'METHOD_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_003_C', 'Unsure or it depends' from questions where stable_question_code = 'METHOD_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_003_D', 'Disagree' from questions where stable_question_code = 'METHOD_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'METHOD_003_E', 'Strongly disagree' from questions where stable_question_code = 'METHOD_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('HORIZON_001', 'compass', 'horizon', 'v1', true, 'Nigeria should fix its own problems before spending money or sending troops elsewhere in Africa.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_001_A', 'Strongly agree' from questions where stable_question_code = 'HORIZON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_001_B', 'Agree' from questions where stable_question_code = 'HORIZON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_001_C', 'Unsure or it depends' from questions where stable_question_code = 'HORIZON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_001_D', 'Disagree' from questions where stable_question_code = 'HORIZON_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_001_E', 'Strongly disagree' from questions where stable_question_code = 'HORIZON_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('HORIZON_002', 'compass', 'horizon', 'v1', true, 'Nigeria should open fully to African free trade and movement, even where local firms lose out at first.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_002_A', 'Strongly agree' from questions where stable_question_code = 'HORIZON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_002_B', 'Agree' from questions where stable_question_code = 'HORIZON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_002_C', 'Unsure or it depends' from questions where stable_question_code = 'HORIZON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_002_D', 'Disagree' from questions where stable_question_code = 'HORIZON_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_002_E', 'Strongly disagree' from questions where stable_question_code = 'HORIZON_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('HORIZON_003', 'compass', 'horizon', 'v1', true, 'Leading Africa is part of Nigeria''s job, not a distraction from it.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_003_A', 'Strongly agree' from questions where stable_question_code = 'HORIZON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_003_B', 'Agree' from questions where stable_question_code = 'HORIZON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_003_C', 'Unsure or it depends' from questions where stable_question_code = 'HORIZON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_003_D', 'Disagree' from questions where stable_question_code = 'HORIZON_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'HORIZON_003_E', 'Strongly disagree' from questions where stable_question_code = 'HORIZON_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('DEMO_001', 'compass', 'demo', 'v1', true, 'Democracy is preferable to any other kind of government.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_001_A', 'Strongly agree' from questions where stable_question_code = 'DEMO_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_001_B', 'Agree' from questions where stable_question_code = 'DEMO_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_001_C', 'Unsure or it depends' from questions where stable_question_code = 'DEMO_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_001_D', 'Disagree' from questions where stable_question_code = 'DEMO_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_001_E', 'Strongly disagree' from questions where stable_question_code = 'DEMO_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('DEMO_002', 'compass', 'demo', 'v1', true, 'It is legitimate for the armed forces to take control of government when elected leaders abuse power.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_002_A', 'Strongly agree' from questions where stable_question_code = 'DEMO_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_002_B', 'Agree' from questions where stable_question_code = 'DEMO_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_002_C', 'Unsure or it depends' from questions where stable_question_code = 'DEMO_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_002_D', 'Disagree' from questions where stable_question_code = 'DEMO_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_002_E', 'Strongly disagree' from questions where stable_question_code = 'DEMO_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('DEMO_003', 'compass', 'demo', 'v1', true, 'I would approve of the army coming in to govern the country.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_003_A', 'Strongly agree' from questions where stable_question_code = 'DEMO_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_003_B', 'Agree' from questions where stable_question_code = 'DEMO_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_003_C', 'Unsure or it depends' from questions where stable_question_code = 'DEMO_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_003_D', 'Disagree' from questions where stable_question_code = 'DEMO_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_003_E', 'Strongly disagree' from questions where stable_question_code = 'DEMO_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('DEMO_004', 'compass', 'demo', 'v1', true, 'The President must always obey the laws and the courts, even when he thinks they are wrong.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_004_A', 'Strongly agree' from questions where stable_question_code = 'DEMO_004';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_004_B', 'Agree' from questions where stable_question_code = 'DEMO_004';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_004_C', 'Unsure or it depends' from questions where stable_question_code = 'DEMO_004';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_004_D', 'Disagree' from questions where stable_question_code = 'DEMO_004';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'DEMO_004_E', 'Strongly disagree' from questions where stable_question_code = 'DEMO_004';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PLUR_001', 'compass', 'plur', 'v1', true, 'Many political parties are needed to give Nigerians real choice.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_001_A', 'Strongly agree' from questions where stable_question_code = 'PLUR_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_001_B', 'Agree' from questions where stable_question_code = 'PLUR_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_001_C', 'Unsure or it depends' from questions where stable_question_code = 'PLUR_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_001_D', 'Disagree' from questions where stable_question_code = 'PLUR_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_001_E', 'Strongly disagree' from questions where stable_question_code = 'PLUR_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PLUR_002', 'compass', 'plur', 'v1', true, 'After an election the opposition should accept defeat and cooperate with government rather than criticise it.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_002_A', 'Strongly agree' from questions where stable_question_code = 'PLUR_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_002_B', 'Agree' from questions where stable_question_code = 'PLUR_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_002_C', 'Unsure or it depends' from questions where stable_question_code = 'PLUR_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_002_D', 'Disagree' from questions where stable_question_code = 'PLUR_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PLUR_002_E', 'Strongly disagree' from questions where stable_question_code = 'PLUR_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('ACCT_001', 'compass', 'acct', 'v1', true, 'It is more important to hold government accountable, even if that makes decisions slower.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ACCT_001_A', 'Strongly agree' from questions where stable_question_code = 'ACCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ACCT_001_B', 'Agree' from questions where stable_question_code = 'ACCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ACCT_001_C', 'Unsure or it depends' from questions where stable_question_code = 'ACCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ACCT_001_D', 'Disagree' from questions where stable_question_code = 'ACCT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'ACCT_001_E', 'Strongly disagree' from questions where stable_question_code = 'ACCT_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('IMP_001', 'compass', 'imp', 'v1', true, 'It is wrong for an official to help his own relatives get government jobs.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'IMP_001_A', 'Strongly agree' from questions where stable_question_code = 'IMP_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'IMP_001_B', 'Agree' from questions where stable_question_code = 'IMP_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'IMP_001_C', 'Unsure or it depends' from questions where stable_question_code = 'IMP_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'IMP_001_D', 'Disagree' from questions where stable_question_code = 'IMP_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'IMP_001_E', 'Strongly disagree' from questions where stable_question_code = 'IMP_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('EFF_001', 'compass', 'eff', 'v1', true, 'Ordinary Nigerians like me can change the way this country is governed.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EFF_001_A', 'Strongly agree' from questions where stable_question_code = 'EFF_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EFF_001_B', 'Agree' from questions where stable_question_code = 'EFF_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EFF_001_C', 'Unsure or it depends' from questions where stable_question_code = 'EFF_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EFF_001_D', 'Disagree' from questions where stable_question_code = 'EFF_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EFF_001_E', 'Strongly disagree' from questions where stable_question_code = 'EFF_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('EXIT_001', 'compass', 'exit', 'v1', true, 'The best thing an ambitious young Nigerian can do now is leave.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EXIT_001_A', 'Strongly agree' from questions where stable_question_code = 'EXIT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EXIT_001_B', 'Agree' from questions where stable_question_code = 'EXIT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EXIT_001_C', 'Unsure or it depends' from questions where stable_question_code = 'EXIT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EXIT_001_D', 'Disagree' from questions where stable_question_code = 'EXIT_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'EXIT_001_E', 'Strongly disagree' from questions where stable_question_code = 'EXIT_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_001', 'president', 'decision', 'v1', true, 'Fuel subsidy is a fifth of what we spend. I can end it on Monday, or you can find the money somewhere else.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_001_L', 'End it Monday.' from questions where stable_question_code = 'PRES_001';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_001_R', 'Find it elsewhere.' from questions where stable_question_code = 'PRES_001';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_002', 'president', 'decision', 'v1', true, 'They have held the Lekki road four days. Lagos business is losing billions. We can open it tonight.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_002_L', 'Open the road.' from questions where stable_question_code = 'PRES_002';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_002_R', 'Go and talk to them.' from questions where stable_question_code = 'PRES_002';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_003', 'president', 'decision', 'v1', true, 'My people are being killed while your federal police sit in Abuja. Let me raise and arm my own force.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_003_L', 'Raise it.' from questions where stable_question_code = 'PRES_003';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_003_R', 'The centre keeps the guns.' from questions where stable_question_code = 'PRES_003';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_004', 'president', 'decision', 'v1', true, 'We want our role written into the constitution. We deliver peace in places your government has never reached.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_004_L', 'Write them in.' from questions where stable_question_code = 'PRES_004';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_004_R', 'Advice, not authority.' from questions where stable_question_code = 'PRES_004';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_005', 'president', 'decision', 'v1', true, 'The allocation is routine. It has been done this way under every administration, including the ones people remember fondly.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_005_L', 'Sign it.' from questions where stable_question_code = 'PRES_005';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_005_R', 'Send it to open tender.' from questions where stable_question_code = 'PRES_005';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_006', 'president', 'decision', 'v1', true, 'The new wage or the country stops on Monday. We have done it before and you know we can do it again.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_006_L', 'Meet the wage.' from questions where stable_question_code = 'PRES_006';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_006_R', 'No work, no pay.' from questions where stable_question_code = 'PRES_006';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_007', 'president', 'decision', 'v1', true, 'The official rate and the street rate have not spoken in months. Every importer in the country is lying on a form.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_007_L', 'Float it.' from questions where stable_question_code = 'PRES_007';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_007_R', 'Hold the rate.' from questions where stable_question_code = 'PRES_007';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_008', 'president', 'decision', 'v1', true, 'The Minister is from home. The file against him is thick. If you move on him, we lose the state in four years.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_008_L', 'Suspend him.' from questions where stable_question_code = 'PRES_008';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_008_R', 'The file can wait.' from questions where stable_question_code = 'PRES_008';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_009', 'president', 'decision', 'v1', true, 'Nine months out and the universities are shut again. Fund the agreement your predecessors signed, or explain to a generation why not.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_009_L', 'Fund it.' from questions where stable_question_code = 'PRES_009';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_009_R', 'Renegotiate downward.' from questions where stable_question_code = 'PRES_009';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_010', 'president', 'decision', 'v1', true, 'ECOWAS wants Nigerian troops after the coup next door. If we do not go, the bloc is finished as an idea.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_010_L', 'Send them.' from questions where stable_question_code = 'PRES_010';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_010_R', 'Sanctions, not soldiers.' from questions where stable_question_code = 'PRES_010';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_011', 'president', 'decision', 'v1', true, 'The court has ruled against your administration. My registrar tells me the ministry is drafting reasons to delay compliance.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_011_L', 'Comply this week.' from questions where stable_question_code = 'PRES_011';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_011_R', 'We will appeal it forever.' from questions where stable_question_code = 'PRES_011';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_012', 'president', 'decision', 'v1', true, 'Close the land borders and local rice wins. Leave them open and the smugglers do.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_012_L', 'Close them.' from questions where stable_question_code = 'PRES_012';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_012_R', 'Keep them open.' from questions where stable_question_code = 'PRES_012';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_013', 'president', 'decision', 'v1', true, 'The tariff has not covered the cost of a unit of electricity in twenty years. That is why there is no electricity.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_013_L', 'Cost-reflective tariff.' from questions where stable_question_code = 'PRES_013';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_013_R', 'Hold the tariff.' from questions where stable_question_code = 'PRES_013';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_014', 'president', 'decision', 'v1', true, 'Twelve billion, fifteen years, our contractors. The rail will be built and it will be built quickly.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_014_L', 'Take the money.' from questions where stable_question_code = 'PRES_014';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_014_R', 'We will build it slower.' from questions where stable_question_code = 'PRES_014';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_015', 'president', 'decision', 'v1', true, 'Debt service is now larger than revenue. The loans you took are being repaid with loans.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_015_L', 'Borrow to cover it.' from questions where stable_question_code = 'PRES_015';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_015_R', 'Austerity budget.' from questions where stable_question_code = 'PRES_015';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_016', 'president', 'decision', 'v1', true, 'VAT is collected in our states and spent from Abuja. We are going to court, unless you would rather talk.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_016_L', 'Concede collection.' from questions where stable_question_code = 'PRES_016';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_016_R', 'See you in court.' from questions where stable_question_code = 'PRES_016';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_017', 'president', 'decision', 'v1', true, 'We have enough on a sitting Governor''s closest man. He delivered three states for the party.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_017_L', 'Charge him.' from questions where stable_question_code = 'PRES_017';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_017_R', 'Not this year.' from questions where stable_question_code = 'PRES_017';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_018', 'president', 'decision', 'v1', true, 'They are organising on the apps. We can take the networks down in an hour, the way other governments do.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_018_L', 'Shut it down.' from questions where stable_question_code = 'PRES_018';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_018_R', 'Leave it on.' from questions where stable_question_code = 'PRES_018';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_019', 'president', 'decision', 'v1', true, 'You promised us the room, not the photograph. There is not one person under forty in your cabinet.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_019_L', 'Appoint them.' from questions where stable_question_code = 'PRES_019';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_019_R', 'Experience first.' from questions where stable_question_code = 'PRES_019';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_020', 'president', 'decision', 'v1', true, 'Local government funds pass through the states and mostly stop there. The constitution says otherwise. You can enforce it.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_020_L', 'Enforce autonomy.' from questions where stable_question_code = 'PRES_020';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_020_R', 'Do not start that fight.' from questions where stable_question_code = 'PRES_020';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_021', 'president', 'decision', 'v1', true, 'Reserved seats for women. It failed in 2022. It fails again next week without you standing up in public.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_021_L', 'Stand up for it.' from questions where stable_question_code = 'PRES_021';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_021_R', 'Let the chamber decide.' from questions where stable_question_code = 'PRES_021';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_022', 'president', 'decision', 'v1', true, 'The amnesty stipends have kept the creeks quiet for fifteen years. The budget office wants them cut.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_022_L', 'Keep paying.' from questions where stable_question_code = 'PRES_022';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_022_R', 'End the programme.' from questions where stable_question_code = 'PRES_022';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_023', 'president', 'decision', 'v1', true, 'Production is down four hundred thousand barrels a day. The creeks are not quiet any more.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_023_L', 'Send in the military.' from questions where stable_question_code = 'PRES_023';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_023_R', 'Reopen negotiations.' from questions where stable_question_code = 'PRES_023';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_024', 'president', 'decision', 'v1', true, 'AfCFTA means opening properly. Our manufacturers will lose the first three years and gain the next twenty.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_024_L', 'Open the borders.' from questions where stable_question_code = 'PRES_024';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_024_R', 'Protect them.' from questions where stable_question_code = 'PRES_024';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_025', 'president', 'decision', 'v1', true, 'Herders and farmers are killing each other across the middle of the country. We want a national ranching law.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_025_L', 'Federal ranching law.' from questions where stable_question_code = 'PRES_025';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_025_R', 'Each state decides.' from questions where stable_question_code = 'PRES_025';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_026', 'president', 'decision', 'v1', true, 'The election budget has been cut by a third. I can run a cheaper election. I cannot run a cheaper credible one.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_026_L', 'Fund it fully.' from questions where stable_question_code = 'PRES_026';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_026_R', 'Run the cheap one.' from questions where stable_question_code = 'PRES_026';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_027', 'president', 'decision', 'v1', true, 'The procurement is classified. That is the nature of defence procurement. You are asking questions your predecessors did not.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_027_L', 'Open the books.' from questions where stable_question_code = 'PRES_027';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_027_R', 'Sign it blind.' from questions where stable_question_code = 'PRES_027';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_028', 'president', 'decision', 'v1', true, 'Twenty billion dollars a year comes home from them and they cannot vote. They have noticed.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_028_L', 'Give them the vote.' from questions where stable_question_code = 'PRES_028';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_028_R', 'Not this cycle.' from questions where stable_question_code = 'PRES_028';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_029', 'president', 'decision', 'v1', true, 'We are divesting onshore. Either you approve the sale to a local buyer, or we simply stop spending and let the fields decline.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_029_L', 'Approve the sale.' from questions where stable_question_code = 'PRES_029';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_029_R', 'Block it pending review.' from questions where stable_question_code = 'PRES_029';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_030', 'president', 'decision', 'v1', true, 'Twenty million children are not in any school. Fixing it costs more than one term and pays out after three.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_030_L', 'Fund it anyway.' from questions where stable_question_code = 'PRES_030';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_030_R', 'Not affordable now.' from questions where stable_question_code = 'PRES_030';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_031', 'president', 'decision', 'v1', true, 'The programme comes with conditions. You know what the conditions are. Everyone in this building knows what they are.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_031_L', 'Accept the programme.' from questions where stable_question_code = 'PRES_031';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_031_R', 'We will manage alone.' from questions where stable_question_code = 'PRES_031';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_032', 'president', 'decision', 'v1', true, 'A reporter has most of it. Not all of it, but most of it. We can make the story difficult for her.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_032_L', 'Make it difficult.' from questions where stable_question_code = 'PRES_032';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_032_R', 'Let her publish.' from questions where stable_question_code = 'PRES_032';

insert into questions (stable_question_code, experience_type, category, question_version, active, prompt) values ('PRES_THIRD', 'president', 'decision', 'v1', true, 'There is a way to amend the constitution. It was tried once before and it died on the floor. My people tell me the arithmetic is different this time.');
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_THIRD_L', 'Put it to the Assembly.' from questions where stable_question_code = 'PRES_THIRD';
insert into answers (question_id, stable_answer_code, answer_label) select id, 'PRES_THIRD_R', 'Two terms. Then I go.' from questions where stable_question_code = 'PRES_THIRD';
