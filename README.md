# 1.0 Introduction
This server offers logging service to others. External servers or clients could post log with a (write) x-api-key header. External servers could also read log (and send report email optionally) using a (read) x-api-key header. One could also check health & status with read x-api-key header. 

An admin x-api-key could be used to add & remove services, or emulate as any tenant.


# 2.0 Setup & Docker
This server is intended to be run within Docker & PM2. PM2 log file will be mounted to ./logs/pm2-*.log
```
  $ mkdir -p /servers
  $ cd /servers
  $ git clone https://gitlab.alextsui.net/root/logger
  $ cd logger

  $ bash docker-build.sh  # to build docker image
  $ bash docker-setup.sh  # to setup & run docker container

  $ docker start logger   # for sequent manual start
  $ docket stop logger    # for manual stop 
```


# 3.0 Service Initialization
There are two ways to seed "services" 
## 3.1 Seeding using npm
```
 $ copy /src/seed/services.samples.json /src/seed/services.json
 
 # update services.json

 $ yarn seed:services --drop --seed
```

## 3.2 Add service by API
with an admin x-api-key header, dom
```
  axios.post('/api/services', {
    tenant: 'new-tenant-name',
    read: {
      apiKey: 'read-api-key',
      ips: ['0.0.0.0']
    },
    write: {
      apiKey: 'write-api-key',
      ips: ['0.0.0.0']
    },
    mailTo: 'report@example.net'
 })
```
