const faker = require('faker')

const numberFromTo = (from, to) => Math.round(Math.random() * (to - from)) + from

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
        coursedate: new Date((new Date()) - numberFromTo(10, 365)),
        course_code: course.code
      })
    }
  })

  return instances
}

module.exports = {
  generateCourses,
  generateCourseInstances,
}