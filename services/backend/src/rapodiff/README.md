# Rapodiff

Use this to check differences between oodikone and rapo.

## How to load the CSV file from Rapo

1. Go to Rapo and open ”Koulutusohjelmien vuosiseuranta”
2. Navigate to ”Opintopisteet ja opetus / Credits and teaching”
3. From the faculty dropdown menu, select all the faculties
4. From the bottom of the page, click ”Vie -> Tiedot -> CSV”
5. Rename the file to `data.csv` and copy it to this directory

## Usage

1. Have real oodikone running. Then run rapodiff **in the root directory**: `npm run rapodiff -- args`
2. place args with a mode. omit args to print possible modes.

## Known differences in APIs

- rapo does not show students that have graduated (it however takes some days for rapo to notice a graduation)
- rapo does not handle the starting year of transfers properly (shows in old staring population)
- rapo show some students incorrectly passive, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/3521
