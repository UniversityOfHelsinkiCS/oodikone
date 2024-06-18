/* eslint-disable no-console */
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

module.exports = { parseCsv }
