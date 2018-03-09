const faker = require('faker')

const numberFromTo = (from, to) => Math.round(Math.random() * (to - from)) + from
const daysAgo = (daysAgo) => new Date((new Date()) - (1000 * 60 * 60 * 24 * daysAgo))

const generateCourses = async () => {
  const number = numberFromTo(10, 100)
  const courses = []
  for (let i = 0; i < number; i++) {
    courses.push({
      code: i,
      name: faker.lorem.words(3)
    })
  }
  return courses
}

const generateCourseInstances = async (courses) => {
  const instances = []
  const number = numberFromTo(5, 40)
  let i = 0
  courses.forEach(course => {
    for (i; i < number; i++) {
      instances.push({
        id: i,
        coursedate: daysAgo(numberFromTo(10, 365)),
        course_code: course.code
      })
    }
  })
  return instances
}

const generateStudents = async () => {
  const students = []
  const number = numberFromTo(5, 40)

  const now = new Date()
  const birthdate = daysAgo(numberFromTo(365*18, 365*70))
  const dateoffirstcredit = faker.date.between(birthdate, now)
  const dateoflastcredit = faker.date.between(dateoffirstcredit, now)
  const dateofuniversityenrollment = faker.date.between(birthdate, dateoflastcredit)
  const lastname = faker.name.lastName()
  const firstnames = faker.name.firstName(2)
  for (let i = 0; i < number; i++) {
    students.push({
      studentnumber: numberFromTo(100000000, 999999999),
      lastname,
      firstnames,
      abbreviatedname: `${lastname} ${firstnames}`,
      birthdate,
      communicationlanguage: ['fi', 'sv', 'en'][numberFromTo(0, 2)],
      country: faker.address.country(),
      creditcount: numberFromTo(0, 600),
      dateoffirstcredit,
      dateoflastcredit,
      dateofuniversityenrollment,
      gradestudent: `${numberFromTo(0, 1)}`,
      matriculationexamination: `${numberFromTo(0, 1)}`,
      nationalities: ['fi', 'sv', 'en'][numberFromTo(0, 2)],
      semesterenrollmenttypecode: [null, '1.0', '2.0'][numberFromTo(0, 2)],
      sex: ['female', 'male'][numberFromTo(0, 1)],
      studentstatuscode: numberFromTo(2, 8),
    })
  }

  return students
}

module.exports = {
  generateCourses,
  generateCourseInstances,
  generateStudents,
}