
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Shuffle in place, returns same array
const shuffleArray = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const x = a[i]
    a[i] = a[j]
    a[j] = x
  }
  return a
}

const isValidStudentId = (id) => {
  if (/^0\d{8}$/.test(id)) {
    // is a 9 digit number
    const multipliers = [7, 1, 3, 7, 1, 3, 7]
    const checksum = id
      .substring(1, 8)
      .split('')
      .reduce((sum, curr, index) => {
        return (sum + curr * multipliers[index]) % 10
      }, 0)
    return (10 - checksum) % 10 == id[8]
  }
  return false
}

const getStudentNumberChecksum = studentNumber => {
  const studentNumberString = String(studentNumber)
  let checksumNumbers = [7, 3, 1]
  let checksum = 0

  for (let i = 0; i < studentNumberString.length; i++) {
    // go from end t start
    let currentNumber = studentNumberString[studentNumberString.length - (i + 1)]
    checksum += currentNumber * (checksumNumbers[i % checksumNumbers.length])
  }

  return (10 - (checksum % 10)) % 10
}

module.exports = { sleep, isValidStudentId, getStudentNumberChecksum, shuffleArray }
