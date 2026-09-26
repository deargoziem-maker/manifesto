-- Tags each result row with the build (index.html's CONTENT_VERSION
-- constant) that produced it. Quiz wording, scoring weights and archetype
-- definitions all change between ships, so without this an apparent shift
-- in outcome distributions over time is indistinguishable from the
-- instrument itself having changed under readers. Nullable: existing rows
-- predate this column and their version is genuinely unknown, not blank.

alter table compass_results add column content_version text;
alter table president_results add column content_version text;

create index compass_results_content_version_idx on compass_results (content_version);
create index president_results_content_version_idx on president_results (content_version);
