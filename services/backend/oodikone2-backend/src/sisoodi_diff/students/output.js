const { writeFileSync } = require('fs')
const moment = require('moment')

const data = {}
const { argv } = process

const fileOutputMode = argv.includes('csv')

const appendData = msg => {
  const { code, name, studentNumber } = msg

  if (Object.keys(data).includes(code)) {
    data[code].n++
    data[code].studentNumbers.add(studentNumber)
    return
  }

  data[code] = {
    name,
    n: 1,
    studentNumbers: new Set([studentNumber])
  }
}

const output = (msg, type = 'message') => {
  if (type === 'code' && fileOutputMode) {
    appendData(msg)
    return
  }

  console.log(msg)
}

const makeCsv = () => {
  if (!fileOutputMode) {
    return
  }

  const content = Object.entries(data)
    .map(([code, { name, n, studentNumbers }]) => {
      return `${code};${n};${name};${Array.from(studentNumbers).join(',')}`
    })
    .join('\n')

  const filename = `student_diff_${moment().format('YYYYMMDDhhmmss')}.csv`
  writeFileSync(filename, content)
  console.log(`CREATED services/backend/oodikone2-backend/${filename}`)
}

module.exports = {
  output,
  makeCsv
}
