/* eslint-disable no-console */
const Papa = require('papaparse')
const fs = require('fs/promises')

const parseCsv = async (fileName, fun) => {
  const data = await fs.readFile(`${__dirname}/${fileName}`, 'utf8')

  await Papa.parse(data, {
    complete: async data => {
      if (!data?.data) {
        console.log('Parsing file failed')
        console.log(data.errors)
        return
      }
      await fun(data?.data)
    },
    encoding: 'utf8',
  })
}

module.exports = { parseCsv }
