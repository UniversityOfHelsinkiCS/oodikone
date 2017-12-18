let frontend_addr
let db_pw
let db_host
let redis
if(process.env.NODE_ENV == 'docker_local') {
  db_pw = process.env.DB_PW
  db_host = 'db'
  redis = 'redis'
  frontend_addr = 'http://localhost:5000'
} else if(process.env.NODE_ENV == 'dev') {
  db_pw = process.ENV.PW
  db_host = 'localhost'
  redis = 'localhost'
  frontend_addr = 'http://localhost:8000'
} else {
  db_pw = process.env.DB_PW
  db_host = 'db'
  redis = 'redis'
  frontend_addr = 'http://oodikone.cs.helsinki.fi:8081'  
}

module.exports = {
  frontend_addr, db_host, db_pw, redis
}