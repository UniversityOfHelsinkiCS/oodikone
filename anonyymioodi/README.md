# Anonyymioodi - test database setup

This folder contains a guide and scripts to modify or create anonymous database images for oodikone, mainly used for testing.

This quick guide should be enough for most purposes: Updating schema, data or postgres version. If not, a more elaborate guide is stored in [old readme](old_readme.md) (though it may have some outdated info).

### Quick guide to update a test database

- Do your dev stuff normally with the test database, for example with `npm run both`. Edit data however you like, run updater via frontend for example, then run tests to see if they pass.
- When you're happy with the database, create a dump:
- `docker exec -i <dbname> pg_dump -Fc -U postgres <dbname> > anonyymioodi/<dbname>.sqz`
- Now you can shut it down `npm run docker:down`
- Navigate to this folder `cd anonyymioodi`
- If you need to **update postgres version**, do it now by changing it in this directory's `docker-compose.yml`.
- Create new container from dump `./create_container_from_dump.sh <dbname>`
- Commit and push it to toska registry `./commit_and_push_to_toska_hub.sh <dbname>`
- `docker compose down`
