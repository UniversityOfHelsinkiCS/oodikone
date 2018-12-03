# oodikone2-cli
Simple CLI tool for setting up the development environment for Oodikone. 

## Prerequisites
Install Docker CE on your machine:

- [Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
- [macOS](https://docs.docker.com/docker-for-mac/install/)
- [Windows](https://docs.docker.com/docker-for-windows/install/)

Install Docker Compose: 

- https://docs.docker.com/compose/install/

## Installation

Launch the CLI with the command below and follow the instructions. 
```
bash run.sh
```

## Nutshell
- Pulls related projects from GitHub
- Builds and runs the Dockerized development environment
- Gets a database dump from production servers
- Creates the database schema and populates it with the dump
