# oodikone2-cli
Simple CLI tool for setting up the development environment for Oodikone. 

```
bash run.sh
```

In a nutshell:
- Pulls related projects from GitHub
- Copies default .env files to projects
- Installs the projects
- Sets up PostgreSQL and Redis
- Gets a database dump from production servers
- Creates the database schema and populates it with the dump
