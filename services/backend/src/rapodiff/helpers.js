/* eslint-disable no-console */
const Papa = require('papaparse')
const fs = require('fs/promises')

const parseCsv = async (fileName, fun) => {
  const file = await fs.readFile(`${__dirname}/${fileName}`, 'utf8')

  Papa.parsePromise = file => {
    return new Promise((complete, error) => {
      Papa.parse(file, { complete, error })
    })
  }

  const data = await Papa.parsePromise(file)
  await fun(data?.data)
}

module.exports = { parseCsv }
