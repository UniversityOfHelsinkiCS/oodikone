const oldToNewMap = require('./oldToNew.json')
const newToOldMap = require('./newToOld.json')


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

const oldToNew = (code) => {
  const mappedCode = oldToNewMap[code]
  return mappedCode ? mappedCode : code
}


//TODO: duplicate codes are now deleted, better solution should be done. Deleted code mappings:
//'99501Mat-lu': '99501Hum', // English Academic & Professional Skills: Reading, Writing & Spoken Communication (CEFR B2)*
//'80088': '530148', // TVT-ajokortti
//'68153Mat': '68153Kem', // Ainedid. 1 ryhmät
const newToOld = (code) => {
  const mappedCode = newToOldMap[code]
  return mappedCode ? mappedCode : code
}

module.exports = {
  oldToNew,
  arrayUnique,
  getStudentNumberChecksum,
  newToOld
}