/* eslint-disable */

const _ = require('lodash')
const { Transfers, StudyrightElement, Studyright } = require('../models')
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
//
const findGraduatedAndTransferredOnSameDay = async (transfers) => {
  const graduationDatesByStudentnumber = (await Studyright.findAll({
    where: {
      student_studentnumber: {
        [Op.in]: transfers.map(s => s.studentnumber)
      }
    }
  })).reduce((acc, curr) => {
    if (curr.graduated) {
      const sn = curr.student_studentnumber
      return {...acc, [sn]: acc.sn ? [...acc.sn, new Date(curr.enddate).toString()] : [new Date(curr.enddate).toString()]}
    }
    return acc
  }, {})

  return transfers.filter(transfer => 
    graduationDatesByStudentnumber[transfer.studentnumber] && 
      graduationDatesByStudentnumber[transfer.studentnumber].includes(new Date(transfer.transferdate).toString())
  ).map(s => s.studentnumber)
}

// FromProgramme --> check sourcecode, otherwise to programm --> targetcode
const transferDiff = async (programme, fromProgramme = true) => {
  const where = fromProgramme ? {sourcecode: programme} : {targetcode: programme}

  let totals = [0, 0, 0]

  const transfersOodi = (await Transfers.findAll({
    where: where
  }))
  const resultOodi = transfersOodi.map(s => s.studentnumber)

  const transfersSis = (await SISTransfer.findAll({
    where: where
  }))
  const resultSis = transfersSis.map(s => s.studentnumber)

  let sisOnly = _.difference(resultSis, resultOodi)
  let oodiOnly = _.difference(resultOodi, resultSis)

  if (oodiOnly.length === 0 && sisOnly.length === 0) return totals

  const direction = fromProgramme ? "Transferred from" : "Transferred to"
  console.log(`=== ${direction} ${programme} ===`)

  if (oodiOnly.length > 0) {
    const graduatedAndTransferredOnSameDay = await findGraduatedAndTransferredOnSameDay(transfersOodi)
    oodiOnly = _.difference(oodiOnly, graduatedAndTransferredOnSameDay)
    console.log("in oodi:")
    if (graduatedAndTransferredOnSameDay.length > 0) {
      console.log("graduated (probably from bsc) and was transferred to new program on same day")
      console.log(graduatedAndTransferredOnSameDay.join('\n'))
      totals[0] = graduatedAndTransferredOnSameDay.length
    }
    if (oodiOnly.length > 0) {
      console.log("other reason")
      console.log(oodiOnly.join('\n'))
      totals[1] = oodiOnly.length
    }
  }

  if (sisOnly.length > 0) {
    console.log("in sis:")
    console.log(sisOnly.join('\n'))
    totals[2] = oodiOnly.length
  }

  return totals
}

const findProgrammes = async () => {
  return (
    await StudyrightElement.findAll({
      attributes: ['code'],
      where: {
        code: {
          [Op.like]: { [Op.any]: ['MH%', 'KH%']}
        }
      },
      group: ['code'],
      order: ['code']
    })
  ).map(s => s.code)
}

const main = async () => {
  let fromTotals = [0, 0, 0]
  let toTotals = [0, 0, 0]
  const programmes = await findProgrammes()
  console.log(programmes)
  for (const programme of programmes) {
    fromTotals = _.unzipWith([fromTotals, await transferDiff(programme, fromProgramme = true)], _.add)
    toTotals = _.unzipWith([toTotals, await transferDiff(programme, fromProgramme = false)], _.add)
  }
  console.log("1. Total diff transferred from")
  console.log("oodi, graduated & transferred on the same day", fromTotals[0])
  console.log("oodi, other", fromTotals[1])
  console.log("sis, other", fromTotals[2])

  console.log("2. Total diff transferred to")
  console.log("oodi, graduated & transferred on the same day", toTotals[0])
  console.log("oodi, other", toTotals[1])
  console.log("sis, other", toTotals[2])
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
