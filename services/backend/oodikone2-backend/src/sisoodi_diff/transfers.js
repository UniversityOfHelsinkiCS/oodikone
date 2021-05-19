/* eslint-disable */

const _ = require('lodash')
const { Transfers, StudyrightElement } = require('../models')
const { Transfer: SISTransfer } = require('../modelsV2')
const { Op } = require('sequelize')

let total = 0

const populationDiff = async (programme) => {

  const resultOodi = (await Transfers.findAll({
    where: {
      sourcecode: programme
    }
  })).map(s => s.studentnumber)

  const resultSis = (await SISTransfer.findAll({
    where: {
      sourcecode: programme
    }
  })).map(s => s.studentnumber)


  let sisOnly = _.difference(resultSis, resultOodi)
  let oodiOnly = _.difference(resultOodi, resultSis)

  if (oodiOnly.length === 0 && sisOnly.length === 0) return

  const both = new Set([...resultSis, ...resultOodi])
  total += both.size

  // Check for possible causes and group together
  console.log(`=== ${programme} ===`)
  console.log("Both size: ", both.size)

  if (oodiOnly.length > 0) {
    console.log("oodionly:")
    console.log(oodiOnly.join('\n'))
  }

  if (sisOnly.length > 0) {
    console.log("sisonly:")
    console.log(sisOnly.join('\n'))
  }
}

const programmeDiff = async programme => {
  console.log('\n' + programme)
  await populationDiff(programme)
  // const years = ['2017', '2018', '2019', '2020']
  // console.log('\n' + programme)
  // for (const year of years) {
  //   await populationDiff(programme, year)
  // }
}

const masterCodes = async () => {
  return (
    await StudyrightElement.findAll({
      attributes: ['code'],
      where: {
        code: {
          [Op.like]: 'MH%'
        }
      },
      group: ['code'],
      order: ['code']
    })
  ).map(s => s.code)
}

const bscCodes = async () => {
  return (
    await StudyrightElement.findAll({
      attributes: ['code'],
      where: {
        code: {
          [Op.like]: 'KH%'
        }
      },
      group: ['code'],
      order: ['code']
    })
  ).map(s => s.code)
}

const msc = async () => {
  const programmes = await masterCodes()
  console.log(programmes.join('\n'))
  for (let programme of programmes) {
    await programmeDiff(programme)
  }
}

const bsc = async () => {
  const programmes = await bscCodes()
  for (let programme of programmes) {
    await programmeDiff(programme)
  }
}

const main = async () => {
  // print moar/less
  verbose = true

  const what = process.argv.slice(2)

  if (what.includes('all')) {
    await bsc()
    await msc()
  }

  if (what.includes('msc')) {
    await msc()
  }

  if (what.includes('bsc')) {
    await bsc()
  }

  for (let i = 0; i < what.length; i++) {
    const programme = what[i]
    if (programme.startsWith('KH') || programme.startsWith('MH')) {
      await programmeDiff(programme)
    }
  }

  console.log("== TOTAL: ", total)
}

main()

/* 
  how to run:
    docker exec backend node /usr/src/app/src/sisoodi_diff/transfers.js

  or:
    npm run diff:transfers KH10_001 KH20_001 KH50_005
    npm run diff:transfers msc bsc

  in production:
    docker exec -it backend sh

    and then:

    npm run diff:transfers KH10_001 KH20_001 KH50_005

*/
