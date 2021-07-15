const { readFileSync } = require('fs')

const getAttainmentsToBeExcluded = () => {
  try {
    const data = readFileSync(`${__dirname}/excludedPartialAttainments.csv`).toString()
    if (!data) return new Set()
    const attainmentIds = data.split('\n')
    return new Set(attainmentIds)
  } catch (error) {
    console.log(error)
    throw new Error()
  }
}

module.exports = { getAttainmentsToBeExcluded }
