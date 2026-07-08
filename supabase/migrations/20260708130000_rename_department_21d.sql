-- Rename เคมีบำบัด display name to reflect 21A & 21D wards
update public.departments
set name_th = 'เคมีบำบัด (21A&D)'
where code = '21D';
