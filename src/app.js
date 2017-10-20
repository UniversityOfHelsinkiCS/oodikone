const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')

const basicAuth = require('express-basic-auth')
const bcrypt = require('bcrypt')

app.use(cors({credentials: true, origin: 'http://localhost:8000'}))
app.use(bodyParser.json())

const User = require('./services/users')

async function authorizer (username, password, cb) {
  const hash = await User.withUsername(username)  
  if ( hash===null ) {
    return cb(null, false)
  }

  return cb(null, bcrypt.compareSync(password, hash))
}

function authorizer2 (username, password) {
  return false//bcrypt.compareSync(password, hash)
}

app.use(basicAuth( { 
    authorizer,
    challenge: true,
    authorizeAsync: true
    //unauthorizedResponse: { error: 'Unauthorized', message: 'Full authentication is required to access this resource'}
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
  const results = await Department.averagesInMonths(startDate, months)

  res.json(results)
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
  const code = req.body.code;
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
  const confFromBody = req.body
  
  if (confFromBody.maxBirthDate) {
    confFromBody.maxBirthDate = confFromBody.maxBirthDate.split('.').join('-')
  }
  
  if (confFromBody.minBirthDate) {
    confFromBody.minBirthDate =confFromBody. minBirthDate.split('.').join('-')
  }  

  confFromBody.courses = confFromBody.courses.map(c=>c.code)

  console.log(confFromBody)

  try {
    const result = await Population.statisticsOf(confFromBody)
    res.json(result)
  } catch(e) {
    res.json({})
  }

})

app.get('/api/tags', async function(req, res) {
  results = await Tag.bySeachTerm(req.query.query || '')
  res.json(results)  
})

app.post('/api/tags/:tagname', async function(req, res) {
  const tagname = req.params.tagname
  const students = req.body
  results = await Tag.addToStudents(tagname, students)
  res.json(results)  
})

app.get('*', async function (req, res) {
  const results = { error: "unknown endpoint" }
  res.status(404).json(results)
})

app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})