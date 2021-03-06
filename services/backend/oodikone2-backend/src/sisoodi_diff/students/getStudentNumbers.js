const { readFileSync } = require('fs')
const { Op, fn, col, where } = require('sequelize')
const { StudyrightElement } = require('../../models')

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

const getStudentNumbersFromProgramme = async studyProgrammeCode => {
  try {
    const studentNumbers = await StudyrightElement.findAll({
      attributes: ['studentnumber'],
      where: {
        code: {
          [Op.eq]: studyProgrammeCode
        },
        [Op.and]: where(fn('DATE_PART', 'year', col('startdate')), 2018)
      },
      raw: true
    }).map(sn => sn.studentnumber)

    console.log('n', studentNumbers.length)
    return studentNumbers.slice(0, 5)
  } catch (error) {
    console.log(error)
  }
}

const getStudentNumbers = async () => {
  const firstArg = process.argv[2]
  const secondArg = process.argv[3]

  switch (firstArg) {
    case 'p':
      return await getStudentNumbersFromProgramme(secondArg)
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
