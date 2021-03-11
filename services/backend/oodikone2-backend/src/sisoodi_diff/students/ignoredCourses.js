const { readFileSync } = require('fs')

let ignoredCourses = []

try {
  const data = readFileSync(`${__dirname}/courses_to_ignore.csv`).toString()
  ignoredCourses = data.split(',')
} catch (error) {
  console.log(error)
  throw new Error()
}

module.exports = ignoredCourses
