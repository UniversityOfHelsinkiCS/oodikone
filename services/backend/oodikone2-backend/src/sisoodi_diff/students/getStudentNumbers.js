const { readFileSync } = require('fs')

const getStudentNumbersFromFile = (n = 10) => {
  try {
    const data = readFileSync(`${__dirname}/students.csv`).toString()
    const studentNumbers = data.split(',')
    return studentNumbers.slice(0, n)
  } catch (error) {
    console.log(error)
    throw new Error()
  }
}

const getStudentNumbers = () => {
  const firstArg = process.argv[2]
  const secondArg = process.argv[3]

  switch (firstArg) {
    case 'p':
      console.log('programme')
      break
    case 'n':
      return getStudentNumbersFromFile(secondArg)
    case undefined:
      return getStudentNumbersFromFile()
    default:
      console.log('Unknown argument.')
      throw new Error()
  }
}

module.exports = getStudentNumbers
