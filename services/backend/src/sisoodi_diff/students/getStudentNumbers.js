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

const getStudentNumbersFromProgramme = async (studyProgrammeCode, year = null) => {
  const whereConditions = year
    ? {
        code: {
          [Op.eq]: studyProgrammeCode,
        },
        [Op.and]: where(fn('DATE_PART', 'year', col('startdate')), year),
      }
    : {
        code: {
          [Op.eq]: studyProgrammeCode,
        },
      }

  try {
    const studentNumberObjects = await StudyrightElement.findAll({
      attributes: ['studentnumber'],
      where: whereConditions,
      raw: true,
    })
    const studentNumbers = studentNumberObjects.map(sn => sn.studentnumber)
    return studentNumbers
  } catch (error) {
    console.log(error)
    throw new Error()
  }
}

const getStudentNumbers = async () => {
  const firstArg = process.argv[2]
  const secondArg = process.argv[3]
  const thirdArg = process.argv[4]

  if (/\d/.test(firstArg)) {
    return [firstArg]
  }

  switch (firstArg) {
    case 'p':
      return await getStudentNumbersFromProgramme(secondArg, thirdArg)
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
