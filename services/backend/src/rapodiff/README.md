# Rapodiff

Use this to check differences between oodikone and rapo.

> TODO: Add better instructions

## Usage

1. Have real oodikone running. Then run rapodiff: `npm run rapodiff -- args`
2. place args with a mode. omit args to print possible modes.

## Known differences in APIs

- rapo does not show students that have graduated (it however takes some days for rapo to notice a graduation)
- rapo does not handle the starting year of transfers properly (shows in old staring population)
- rapo show some students incorrectly passive, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/3521
