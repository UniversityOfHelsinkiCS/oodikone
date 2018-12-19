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

## What the CLI does
- Pulls related projects from GitHub
- Builds and runs the Dockerized development environment
- Gets a database dump from production servers
- Creates the database schema and populates it with the dump

## Individual commands

This section contains more information about some of the commands used by the CLI.

### How to `scp` backup files from oodikone via melkki-proxy

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