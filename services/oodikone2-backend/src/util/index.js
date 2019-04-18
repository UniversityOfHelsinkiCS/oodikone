const oldToNewMap = require('./oldToNew.json')

const arrayUnique = (value, index, self) => {
  return self.indexOf(value) === index
}

const getStudentNumberChecksum = studentNumber => {
  let checksumNumbers = [7, 3, 1]
  let checksum = 0

  for (let i = 0; i < studentNumber.length; i++) {
    // go from end t start
    let currentNumber = studentNumber[studentNumber.length - (i + 1)]
    checksum += currentNumber * (checksumNumbers[i % checksumNumbers.length])
  }

  return (10 - (checksum % 10)) % 10
}

// helpers to print complex sequelizedata
const plainPrint = (sequelizeData) => console.log(JSON.parse(JSON.stringify(sequelizeData)))

const plainify = (sequelizeData) => JSON.parse(JSON.stringify(sequelizeData))


const oldToNew = (code) => {
  const mappedCode = oldToNewMap[code]
  return mappedCode ? mappedCode : code
}

module.exports = {
  arrayUnique,
  getStudentNumberChecksum,
  plainPrint,
  plainify,
  oldToNew
}