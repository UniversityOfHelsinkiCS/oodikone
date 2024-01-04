# Rapodiff

Use this to check differences between oodikone and rapo.

Before running:

1. Depends on nodeproxy running in toska.cs.helsinki.fi
2. Set these correctly in .env, notice to wrap in quotes ", otherwise strange characters may be misformatted:
   RAPO_NODEPROXY="acual_token"
   IMPORTER_DB_API_TOKEN="acual_token"

Running:

1. Have real oodikone running. Then run rapodiff: `npm run rapodiff -- args`
2. place args with a mode. omit args to print possible modes.

known differences in APIs

- rapo does not show students that have graduated (it however takes some days for rapo to notice a graduation)
- rapo does not handle the starting year of transfers properly (shows in old staring population)
- rapo show some students incorrectly passive, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/3521
