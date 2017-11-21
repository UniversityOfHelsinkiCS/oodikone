const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')

const basicAuth = require('express-basic-auth')
const bcrypt = require('bcrypt')
const PORT = 8081
app.use(cors({credentials: true, origin: 'http://localhost:5000'}))
app.use(bodyParser.json())

app.get('/ping', async function (req, res) {
  res.json({data: 'pong'})
})

const User = require('./services/users')

async function authorizer (username, password, cb) {
  const hash = await User.withUsername(username)  
  if ( hash===null ) {
    return cb(null, false)
  }

  return cb(null, bcrypt.compareSync(password, hash))
}

app.use(
  basicAuth({ 
    authorizer,
    challenge: true,
    authorizeAsync: true,
    unauthorizedResponse: () => ({ error: 'unauthorized' })
  })
)

const Department = require('./services/departments')
const Student = require('./services/students')
const Course = require('./services/courses')
const Teacher = require('./services/teachers')
const Population = require('./services/populations')
const Tag = require('./services/tags')

app.get('/api/departmentsuccess', async function (req, res) {
  const startDate = req.query.date? req.query.date.split('.').join('-'): '2005-08-01'
  const months = 13

  const redis = require('redis')
  require('bluebird').promisifyAll(redis.RedisClient.prototype)
  const client = redis.createClient(6379 , 'redis')
  const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'

  const key = `department-statistics-${startDate}-${months}-${env}`
  const timeToLive = env==='test' ? 60*60 : 60*60*24*7 // one hour or one week

  try{
    let results = await client.getAsync(key)
    if ( results === null ) {
      results = await Department.averagesInMonths(startDate, months)
      await client.setAsync(key, JSON.stringify(results), 'EX', timeToLive)
    } else {
      results = JSON.parse(results)
    }

    res.json(results)
  } catch(e) {
    console.log(e)    
  }

})

app.get('/api/students', async function (req, res) {
  let results = []
  if (req.query.searchTerm) {
    results = await Student.bySeachTerm(req.query.searchTerm)
  }

  res.json(results)
})

app.get('/api/students/:id', async function (req, res) {
  const results = await Student.withId(req.params.id)
  res.json(results)
})

app.post('/api/students/:id/tags', async function (req, res) {
  const tagname = req.body.text
  const result = await Student.addTag(req.params.id, tagname)
  const status = result.error === undefined ? 201 : 400

  res.status(status).json(result)
})

app.delete('/api/students/:id/tags', async function (req, res) {
  const tagname = req.body.text
  const result = await Student.deleteTag(req.params.id, tagname)
  const status = result.error === undefined ? 200 : 400
  res.status(status).json(result)
})

app.get('/api/courses', async function (req, res) {
  let results = []
  if (req.query.name) {
    results = await Course.bySeachTerm(req.query.name)
  }

  res.json(results)
})

app.post('/api/courselist', async function(req, res) {
  const results = await Course.instancesOf(req.body.code)

  res.json(results)
})

app.post('/api/coursestatistics', async function(req, res) {
  const code = req.body.code
  const date = req.body.date.split('.').join('-')
  const months = req.body.subsequentMonthsToInvestigate

  const results = await Course.statisticsOf(code, date, months)
  res.json(results)
})

app.post('/api/teacherstatistics', async function(req, res) {
  const courses = req.body.courses.map(c => c.code)
  const fromDate = req.body.fromDate.split('.').join('-')
  const toDate = req.body.toDate.split('.').join('-')
  const minCourses = req.body.minCourses || 1
  const minStudents = req.body.minStudents || 1
  const studyRights = req.body.studyRights || 1

  const results = await Teacher.statisticsOf(courses, fromDate, toDate, minCourses, minStudents, studyRights)
  res.json(results)
})

app.get('/api/studyrightkeywords', async function(req, res) {
  let results = []
  if (req.query.search) {
    results = await Population.studyrightsByKeyword(req.query.search)
  }

  res.json(results)
})

app.get('/api/enrollmentdates', async function(req, res) {
  const results = await Population.universityEnrolmentDates()
  res.json(results)
})

app.post('/api/populationstatistics', async function(req, res) {
  try {
    const confFromBody = req.body
    
    if (confFromBody.maxBirthDate) {
      confFromBody.maxBirthDate = confFromBody.maxBirthDate.split('.').join('-')
    }
    
    if (confFromBody.minBirthDate) {
      confFromBody.minBirthDate =confFromBody. minBirthDate.split('.').join('-')
    }  

    confFromBody.courses = confFromBody.courses.map(c=>c.code)

    const result = await Population.statisticsOf(confFromBody)
    res.json(result)
  } catch(e) {
    console.log(e)
    res.status(400).json({ error: e })
  }

})

app.get('/api/tags', async function(req, res) {
  const results = await Tag.bySeachTerm(req.query.query || '')
  res.json(results)  
})

app.post('/api/tags/:tagname', async function(req, res) {
  const tagname = req.params.tagname
  const students = req.body
  const results = await Tag.addToStudents(tagname, students)
  const status = results.error === undefined ? 201 : 400
  
  res.status(status).json(results)
})

app.get('*', async function (req, res) {
  const results = { error: 'unknown endpoint' }
  res.status(404).json(results)
})

if ( process.env.NODE_ENV!=='test' ) {
  app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT +'!')
  })
}

module.exports = app