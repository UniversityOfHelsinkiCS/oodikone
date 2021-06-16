docker commit analytics-db registry.toska.cs.helsinki.fi/analytics-db
docker push registry.toska.cs.helsinki.fi/analytics-db
docker commit oodi-db registry.toska.cs.helsinki.fi/kone-db
docker push registry.toska.cs.helsinki.fi/kone-db
docker commit sis-db registry.toska.cs.helsinki.fi/oodi-db
docker push registry.toska.cs.helsinki.fi/oodi-db
docker commit oodi-db registry.toska.cs.helsinki.fi/sis-db
docker push registry.toska.cs.helsinki.fi/sis-db
docker commit oodi-db registry.toska.cs.helsinki.fi/user-db
docker push registry.toska.cs.helsinki.fi/user-db
