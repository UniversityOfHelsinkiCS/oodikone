const fs = require('fs/promises')
const Papa = require('papaparse')

const parseCsv = async (fileName, fun) => {
  try {
    const file = await fs.readFile(`${__dirname}/${fileName}`, 'utf8')
    Papa.parsePromise = file => {
      return new Promise((complete, error) => {
        Papa.parse(file, { complete, error })
      })
    }
    const data = await Papa.parsePromise(file)
    await fun(data?.data)
  } catch (error) {
    console.log(error)
  }
}

const printProgressBar = (total, current) => {
  const barLength = 30
  const progress = Math.floor((current / total) * barLength)
  const empty = barLength - progress

  const progressBar = `[${'#'.repeat(progress)}${'-'.repeat(empty)}]`
  const percentage = Math.floor((current / total) * 100)

  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`${progressBar} ${percentage} %`)

  if (current >= total) {
    console.log()
  }
}

module.exports = { parseCsv, printProgressBar }
