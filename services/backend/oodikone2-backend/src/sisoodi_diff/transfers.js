/* eslint-disable */

const _ = require('lodash')
const { Transfers, StudyrightElement } = require('../models')
const { Transfer: SISTransfer } = require('../modelsV2')
const { Op } = require('sequelize')


// To check for duplicate transfers in oodi, use following sql in psql
// SELECT
//     transferdate, COUNT(transferdate),
//     studentnumber, COUNT(studentnumber),
//     sourcecode, COUNT(sourcecode),
//     targetcode, COUNT(targetcode)
// FROM
//     transfers
// GROUP BY
//     transferdate, studentnumber, sourcecode, targetcode
// HAVING
//     (COUNT(transferdate) > 1) AND
//     (COUNT(studentnumber) > 1) AND
//     (COUNT(sourcecode) > 1) AND
//     (COUNT(targetcode) > 1);

const transferDiff = async (programme) => {
  [true, false].forEach(async fromProgramme => {
    const where = fromProgramme ? {sourcecode: programme} : {targetcode: programme}

    const resultOodi = (await Transfers.findAll({
      where: where
    })).map(s => s.studentnumber)

    const resultSis = (await SISTransfer.findAll({
      where: where
    })).map(s => s.studentnumber)

    let sisOnly = _.difference(resultSis, resultOodi)
    let oodiOnly = _.difference(resultOodi, resultSis)

    if (oodiOnly.length === 0 && sisOnly.length === 0) return

    const both = new Set([...resultSis, ...resultOodi])

    // Check for possible causes and group together 
    const direction = fromProgramme ? "Transferred from" : "Transferred to"
    console.log(`=== ${direction} ${programme} ===`)

    if (oodiOnly.length > 0) {
      console.log("in oodi:")
      console.log(oodiOnly.join('\n'))
    }

    if (sisOnly.length > 0) {
      console.log("in sis:")
      console.log(sisOnly.join('\n'))
    }
  })
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
  for (let programme of programmes) {
    await transferDiff(programme)
  }
}

const bsc = async () => {
  const programmes = await bscCodes()
  for (let programme of programmes) {
    await transferDiff(programme)
  }
}

const main = async () => {

  const what = process.argv.slice(2)

  if (what.includes('all')) {
    await bsc()
    await msc()
  } else if (what.includes('msc')) {
    await msc()
  } else if (what.includes('bsc')) {
    await bsc()
  } else {
    for (let i = 0; i < what.length; i++) {
      const programme = what[i]
      if (programme.startsWith('KH') || programme.startsWith('MH')) {
        await transferDiff(programme)
      }
    }
  }
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
