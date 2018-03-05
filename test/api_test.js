const test = require('ava')
const supertest = require('supertest')
const app = require('../src/app')
const api = supertest(app)
const { sequelize } = require('../src/models')
const conf = require('../src/conf-backend')
const jwt = require('jsonwebtoken')

/*
const auth = {
  username: 'tktl',
  password: 'CsZerc8TUtR1S95CYOtTaC69'
}
*/

let token
const uid = 'tktl', fullname = ''
const payload = { userId: uid, name: fullname }



test.before( async () => {
  token = jwt.sign(payload, conf.TOKEN_SECRET, {
    expiresIn: '24h'
  })
  console.log(token)
  sequelize.query(
    `DELETE 
      FROM tag_student 
      WHERE tags_tagname = 'test3'`
  )
})

test('should pong when pinged', async t => {
  const res = await api
    .get('/ping')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.deepEqual(res.body, {data:'pong'} )
})

/*
test('request without basic auth credentials fails', async t => {
  await api
    .get('/api/enrollmentdates')
    .expect(403)
    .expect('Content-Type', /application\/json/)
        
  t.pass()
})

test('request with basic nonexisting user fails', async t => {
  await api
    .get('/api/enrollmentdates')
    .auth('nonexistent', 'wrong')
    .expect(403)
    .expect('Content-Type', /application\/json/)
  
  t.pass()
})

test('request with wrong password fails', async t => {
  await api
    .get('/api/enrollmentdates')
    .auth('tktl', 'wrong')
    .expect(403)
    .expect('Content-Type', /application\/json/)

  t.pass()    
})  */

test('request with correct credentials succeed', async t => {
  await api
    .get('/api/enrollmentdates')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    //.auth(auth.username, auth.password)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
  t.pass()
})  

test('students can be searched by searchterm', async t => {
  const res = await api
    .get('/api/students')
    .query({ searchTerm: 'Luukkainen Matti' })
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const students = res.body
  t.is(students.length, 1)
  t.is(students[0].studentNumber, '011120775')        
})

test('a student credit info is returned with student number', async t => {
  const res = await api
    .get('/api/students/011120775')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const student = res.body

  t.is(student.studentNumber, '011120775')    
  t.is(student.credits, 514) 
  t.is(student.courses.length, 86)    
  t.is(student.tags.length, 0)    
})

test('a tagless student credit info is returned with student number', async t => {
  const res = await api
    .get('/api/students/014424850')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const student = res.body

  t.is(student.studentNumber, '014424850')    
  t.is(student.credits, 181) 
  t.is(student.tags.length, 3)    
})


test('if student already has a tag, it can not be added', async t => {
  const tagToAdd = { text: 'StudentsWithCredits2014' }

  const res = await api
    .post('/api/students/014424850/tags')
    .send(tagToAdd)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.error, 'tag \'StudentsWithCredits2014\' already assosiated with student \'014424850\'')       
})

test('tag can be added to and deleted from a student', async t => {
  const tagToAdd = { text: 'mooc-2013' }

  let res = await api
    .post('/api/students/014424850/tags')
    .send(tagToAdd)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const expectedResult = { 
    taggedstudents_studentnumber: '014424850',
    tags_tagname: 'mooc-2013' 
  }

  t.deepEqual(res.body, expectedResult)       

  res = await api
    .get('/api/students/014424850')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)

  t.truthy(res.body.tags.includes(tagToAdd.text))     

  res = await api
    .delete('/api/students/014424850/tags')
    .send(tagToAdd)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)  


  res = await api
    .get('/api/students/011120775')
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)

  t.falsy(res.body.tags.includes(tagToAdd.text))      
})

test('courses can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/courses')
    .query({ name: 'Ohjelmoinnin' })    
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const courses = res.body

  t.is(courses.length, 10) 
  const courseNames = courses.map(c=>c.name.toUpperCase())
  
  t.truthy( courseNames.every(n=>n.includes('Ohjelmoinnin'.toUpperCase())) )       
})

test('instances of a course can be fetched', async t => {
  const course = {
    code: '582206'
  }

  const res = await api
    .post('/api/courselist')
    .send(course)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const instances = res.body

  t.is(instances.length, 83)   
  t.deepEqual(Object.keys(instances[0]), ['id', 'date', 'fail', 'pass', 'students', 'teachers'])   
})

test('statistics of an instance can be fetched', async t => {
  const course = {
    code: '581259',
    date: '2016-06-14',
    months: 13
  }

  const res = await api
    .post('/api/coursestatistics')
    .send(course)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body

  t.deepEqual(Object.keys(stats), ['all', 'pass', 'fail', 'startYear'])
  t.truthy(Object.keys(stats.all).includes('014013627'))      
})

test('teacher statistics can be fetched', async t => {
  const query = {
    courses: [{ code:'581259'}],
    fromDate: '2016.05.01',
    toDate: '2016.10.01',
    studyRights: ['Bachelor of Science, Computer Science']
  }

  const res = await api
    .post('/api/teacherstatistics')
    .send(query)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body

  t.truthy(stats.length>0)  
  t.deepEqual(Object.keys(stats[0]), ['teacherId', 'credits', 'studentsPassed', 'studentsTeached', 'instancesTeached'])
})

test('populations can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/studyrightkeywords')
    .query({ search: 'computer Science' })    
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.length, 40) 
  t.truthy( res.body.every(r=>r.toUpperCase().includes('COMPUTER SCIENCE')) )       
})

test('enrollment dates can be fetched', async t => {
  const res = await api
    .get('/api/enrollmentdates') 
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.length, 722) 
  t.truthy( res.body.includes('2014-09-02') )       
})

test('tags can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/tags')
    .query({ query: 'mooc' })    
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.is(res.body.length, 2) 
  t.deepEqual( res.body, [ 'mooc-2012', 'mooc-2013'] )       
})

test('tags can be added to a set of studets', async t => {
  const tagToAdd = 'test3' 
  const students = ['011120775', '011311063']
  
  students.forEach(async (s) => {
    let res = await api
      .get(`/api/students/${s}`)
      .set('x-access-token', token)
      .set('eduPersonPrincipalName', uid)

    t.falsy(res.body.tags.includes(tagToAdd))    
  })
 
  await api
    .post('/api/tags/test3')
    .send(students)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(201)
    .expect('Content-Type', /application\/json/)  

  students.forEach(async (s) => {
    let res = await api
      .get(`/api/students/${s}`)
      .set('x-access-token', token)
      .set('eduPersonPrincipalName', uid)
      .expect(200)
      .expect('Content-Type', /application\/json/)  

    t.truthy(res.body.tags.includes(tagToAdd))    
  })

  students.forEach(async (s) => {
    await api
      .delete(`/api/students/${s}/tags`)
      .send({text: tagToAdd})
      .set('x-access-token', token)
      .set('eduPersonPrincipalName', uid)
      .expect(200)
      .expect('Content-Type', /application\/json/)  
  })

  students.forEach(async (s) => {
    let res = await api
      .get(`/api/students/${s}`)
      .set('x-access-token', token)
      .set('eduPersonPrincipalName', uid)

    t.falsy(res.body.tags.includes(tagToAdd))    
  })

  t.pass()
})

test('population statistics can be fetched', async t => {
  const query = {
    courses: [], 
    enrollmentDates: [ '2017-01-01', '2016-01-01' ] ,
    matriculationExamination: '',
    monthsToStudy: 15,
    sex: '',
    studentNumbers: [],
    studyRights: ['Bachelor of Science, Computer Science'],
    tags: [], 
    maxBirthDate: '2000-01-01',
    minBirthDate: '1981-09-01',
    excludeStudentsThatHaveNotStartedStudies: true,
    excludeStudentsWithPreviousStudies: false,
    excludeStudentsWithZeroCredits: true,
    excludedStudentNumbers: ['014618200'],
    excludedTags: ['mooc-2012'],    
  }

  const res = await api
    .post('/api/populationstatistics')
    .send(query)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body

  t.is(stats.length, 5)  
  t.deepEqual(Object.keys(stats[0]).sort(), ['courses', 'tags', 'studentNumber','credits', 'started'].sort())
})

test('population statistics can be fetched with another configuration', async t => {
  const query = {
    courses: [ {code: '582507'} ], 
    enrollmentDates: [ '2017-01-01', '2016-01-01' ] ,
    matriculationExamination: '',
    monthsToStudy: 15,
    sex: '',
    studentNumbers: [ '014195503', '014234985', '014552890', '014619584', '014055834', '014013627' ],
    studyRights: ['Bachelor of Science, Computer Science'],
    tags: [], 
    excludeStudentsThatHaveNotStartedStudies: true,
    excludeStudentsWithPreviousStudies: false,
    excludeStudentsWithZeroCredits: true,
    excludedStudentNumbers: ['014055834'],
    excludedTags: ['mooc-2012'],    
  }

  const res = await api
    .post('/api/populationstatistics')
    .send(query)
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body

  t.is(stats.length, 1)  
  t.deepEqual(Object.keys(stats[0]).sort(), ['courses', 'tags', 'studentNumber','credits', 'started'].sort())
})

test('populations can be searched by a searchterm', async t => {
  const res = await api
    .get('/api/departmentsuccess')
    .query({ date: '2005.08.01' })    
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  t.deepEqual(Object.keys(res.body).sort(), ['Chemistry', 'Computer Science', 'Mathematics', 'Physics'].sort())
  t.truthy(res.body['Computer Science']>20)
})

test('new api populations can be fetched', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({ year: '2010',
      semester: 'SPRING',
      studyRights: '500-K005'})
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.length, 6)

})

test('multiple population studyrights can be fetched', async t => {
  const res = await api
    .get('/api/populationstatistics')
    .query({ year: '2010',
      semester: 'SPRING',
      studyRights: ['500-K005', '500-M009']})
    .set('x-access-token', token)
    .set('eduPersonPrincipalName', uid)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const stats = res.body
  t.is(stats.length, 7)

})
