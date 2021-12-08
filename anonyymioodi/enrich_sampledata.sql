-- add these to sis-importer db by running:
-- docker exec -i sis-importer-db psql -U postgres sis-importer-db < enrich_sampledata.sql

-- if you need to run updater for these students only, see studentnumberlist in the end
-- this file

-- Add admission types (valintaperusteet) to studyrights for some of the computer
-- science 2018-2019 population students. See person_ids / student_number below 
-- (in case you need to update dumps). 

-- TODO: this should be moved into the sampledata creator script in
-- importer repo, but since this file contains studentnumbers and person ids, it's 
-- better to keep this here

-- KP (koepisteet)
-- hy-hlo-1412620   | 013683126
-- hy-hlo-1485246   | 014340523
-- hy-hlo-32230770  | 010589388
-- hy-hlo-35626233  | 010775888
-- hy-hlo-40150144  | 011065995
UPDATE studyrights 
SET admission_type_urn = 'urn:code:admission-type:kp' 
WHERE person_id IN (
'hy-hlo-1412620',
'hy-hlo-1485246',
'hy-hlo-32230770',
'hy-hlo-35626233',
'hy-hlo-40150144'
);

-- TV (todistusvalinta)
-- hy-hlo-45783433  | 011321150
-- hy-hlo-48537946  | 010764653
-- hy-hlo-49801905  | 011194400
-- hy-hlo-53321302  | 011338871
-- hy-hlo-51223300  | 013951984
-- hy-hlo-53310137  | 012520688
-- hy-hlo-53621583  | 011196796
-- hy-hlo-53863064  | 011736884
-- hy-hlo-57711592  | 010262566
-- hy-hlo-57732872  | 013670647
UPDATE studyrights 
SET admission_type_urn = 'urn:code:admission-type:tv' 
WHERE person_id IN (
'hy-hlo-45783433',
'hy-hlo-48537946',
'hy-hlo-49801905',
'hy-hlo-53321302',
'hy-hlo-51223300',
'hy-hlo-53310137',
'hy-hlo-53621583',
'hy-hlo-53863064',
'hy-hlo-57711592',
'hy-hlo-57732872'
);

-- YP:
-- hy-hlo-67768022  | 011952325
-- hy-hlo-73740025  | 011736606
-- hy-hlo-74780917  | 012775433
-- hy-hlo-79615371  | 014113941
-- hy-hlo-78118455  | 014300615
UPDATE studyrights 
SET admission_type_urn = 'urn:code:admission-type:yp' 
WHERE person_id IN (
'hy-hlo-67768022',
'hy-hlo-73740025',
'hy-hlo-74780917',
'hy-hlo-79615371',
'hy-hlo-78118455'
);
-- AV:
-- hy-hlo-78777265  | 010779392
-- hy-hlo-81909550  | 011894153
-- hy-hlo-84571890  | 013897158
-- hy-hlo-80330834  | 015085926
-- hy-hlo-84775722  | 011791272
UPDATE studyrights 
SET admission_type_urn = 'urn:code:admission-type:av' 
WHERE person_id IN (
'hy-hlo-78777265',
'hy-hlo-81909550',
'hy-hlo-84571890',
'hy-hlo-80330834',
'hy-hlo-84775722'
);
-- M:
-- hy-hlo-87439827  | 011928456
-- hy-hlo-96612371  | 014418361
-- hy-hlo-84840261  | 010975895
-- hy-hlo-90330681  | 010522688
-- hy-hlo-96594603  | 013951573
UPDATE studyrights 
SET admission_type_urn = 'urn:code:admission-type:m' 
WHERE person_id IN (
'hy-hlo-87439827',
'hy-hlo-96612371',
'hy-hlo-84840261',
'hy-hlo-90330681',
'hy-hlo-96594603'
);

-- all studentnumbers for running updater:
013683126
014340523
010589388
010775888
011065995
011321150
010764653
011194400
011338871
013951984
012520688
011196796
011736884
010262566
013670647
011952325
011736606
012775433
014113941
014300615
010779392
011894153
013897158
015085926
011791272
011928456
014418361
010975895
010522688
013951573
