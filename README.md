# steamy-api
API to convert Steam ID's and retrieve user data.

## Usage

Install Redis

1. Ubuntu / Debian

```
sudo apt update
sudo apt install redis-server
```

2. CentOS

```
sudo dnf install redis
```

3. MacOS

```
brew update
brew install redis
```

4. Windows

    Download [Redis-x64-x.x.x.zip](https://github.com/tporadowski/redis/releases), Extract and run **redis-server.exe**

Install dependencies
```
npm install
```

Start server
```
node src/index.js
```
