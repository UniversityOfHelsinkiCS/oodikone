# oodikone2-cli
Simple CLI tool for setting up the development environment for Oodikone. The entire development environment runs inside of a Docker network that's defined in the docker-compose.yml file. The specifics of what this means for setting up the environment and accessing logs is discussed in a later section.

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

## What the CLI does
- Builds and runs the Dockerized development environment
- Gets a database dump from production servers
- Creates the database schema and populates it with the dump
- Adds git-hooks

## Docker commands

The development environment is entirely configured in the docker-compose.yml file located in this repository. The file defines the containers/environments for:
- Frontend
- Backend
- Userservice
- Oodilearn
- The databases used by the services
- Adminer & other dev tools

The mapping of ports and environment variables are also defined in the docker-compose file. You can start, stop and manage the development environment by running the following commands from a terminal shell in this directory.

### Start the development environment
```
docker-compose up -d
```

### Stop the development environment
```
docker-compose down
```

### Restart container(s)

```
docker-compose restart          # all

docker-compose restart backend  # just backend
```

### View the containers in the running environment
```
docker-compose ps
```

### View logs


```
docker-compose logs -f          # all

docker-compose logs -f backend  # just backend
```



### Attach a terminal shell to a container
```
docker exec -it backend bash

docker exec -it <container> <command>
```

### Use `psql` or other database CLI tools
```
docker exec -it -u postgres oodi_db psql -d tkt_oodi

docker exec -it -u <username> <container> psql -d <db name>
```

## Other commands

### How to `scp` backup files from oodikone via melkki-proxy

This is how the setup script fetches the database dump from production servers. It will require you to have access to both melkki.cs.helsinki.fi as well as oodikone.cs.helsinki.fi. The command uses `scp` to transfer all backup files recursively from a known location on the production server by using the melkki server as a proxy, allowing you to get the dump even when you're not connected to the university network.

#### Command
```
scp -r -o ProxyCommand="ssh -W %h:%p melkki.cs.helsinki.fi" oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/* ./backups/

-r : recursively copy files
-o : options for defining the proxy command
```

#### [Unix StackExchange answer](https://unix.stackexchange.com/questions/355640/how-to-scp-via-an-intermediate-machine)

> It's possible and relatively easy, even when you need to use certificates > for authentication (typical in AWS environments).
>
> The command below will copy files from a remotePath on server2 directly > into your machine at localPath. Internally the scp request is proxied via > server1.
>
> ```
> scp -i user2-cert.pem -o ProxyCommand="ssh -i user1-cert.pem -W %h:%p > user1@server1" user2@server2:/<remotePath> <localpath>
> ```
>
> If you use password authentication instead, try with:
>
>  ```
> scp -o ProxyCommand="ssh -W %h:%p user1@server1" > user2@server2:/<remotePath> <localpath>
> ```
>
> If you use the same user credentials in both servers:
>
> ```
> scp -o ProxyCommand="ssh -W %h:%p commonuser@server1" > commonuser@server2:/<remotePath> <localpath>
> ```