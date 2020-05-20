#!/bin/bash
docker exec -it db_sis pg_dump -O -U postgres -d db_sis -t programme_modules -t programme_module_children > programme_module_dump.sql