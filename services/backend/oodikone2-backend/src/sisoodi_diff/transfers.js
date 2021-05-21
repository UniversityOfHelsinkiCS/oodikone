/* eslint-disable */

const _ = require('lodash')
const { Transfers, ElementDetails, StudyrightElement, Studyright } = require('../models')
const { Transfer: SISTransfer } = require('../modelsV2')
const { Op } = require('sequelize')
const { ignores } = require('./populations')

const flatten = function(obj) {
  if (Array.isArray(obj)) {
    return obj
  }
  return Object.values(obj).reduce((acc, curr) => [...acc, ...flatten(curr)], [])
}

const knownFromPopulations = flatten(ignores)

const knownTransferErrors = {
  oodi: [
    '013879228', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2927
    // next few lines are same case, fetched from oodi with
    // SELECT studentnumber FROM transfers t
    // LEFT JOIN studyright s ON t.studyrightid = s.studyrightid
    // WHERE s.extentcode NOT IN (1,2,3,4) AND t.targetcode LIKE 'MH%';
    '015152451',
    '015152817',
    '014890109',
    '015152888',
    '013304191',
    '015152914',
    '015454926',
    '013304191',
    '012602807', // just plain weird case: https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2930
    '014271993', // same as previous
    '014625659', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2931
    '011048721', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2932,
    // note: you can test if student falls into this category with if filter in
    // graduatedFromBscAndTransferred
    '014190443', // same as above
    '014347584', // same as above
    '014483299', // same as above
    '014590195', // same as above
    '014595750', // same as above
    '014606908', // same as above
    '014711961', // same as above
    '014735905', // same as above
    '014738449', // same as above
    '012083633', // same as above
    '012070633', // same as above
    '011388834', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2933
    '012859087', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2934
    '012603026', // some weird cases, but transfer-related stuff seems to be ok: https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2935
    '010670459', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2936
    '014587153', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2937
    '014610693', // same as above
    '014727670', // same as above
    '011499684', // same as above
    '014739655', // same as above
    '014712902', // same as above
    '013873745', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2938
    '014300107', // same as above
    '014711398', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2939
    '014723302', // same as above
    '014719471', // same as above
    '013869393', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2940
    '012115585' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2941
  ],
  sis: [
    '013164917', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2929
    '013303888' // same as previous
  ]
}

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

const findGraduatedFromBscAndTransferred = async transfers => {
  const where = {
    studentnumber: {
      [Op.in]: transfers.map(s => s.studentnumber)
    }
  }
  const studyRightElementsByStudentNumber = (
    await StudyrightElement.findAll({
      where,
      include: [
        {
          model: ElementDetails,
          required: true
        },
        {
          model: Studyright,
          required: true
        }
      ]
    })
  ).reduce((acc, curr) => {
    const sn = curr.studentnumber
    return { ...acc, [sn]: acc[sn] ? [...acc[sn], curr] : [curr] }
  }, {})

  const allTransfersForTheseStudentsByStudentNumber = (
    await Transfers.findAll({
      where
    })
  ).reduce((acc, curr) => {
    const sn = curr.studentnumber
    return { ...acc, [sn]: acc[sn] ? [...acc[sn], curr] : [curr] }
  }, {})

  const comparableDate = date => new Date(date).toISOString()

  return transfers
    .filter(transfer => {
      const sn = transfer.studentnumber
      let source = transfer.sourcecode

      // with this you can test if student is transferred multiple times on msc and find
      // the original. put the studentnumber to test to potentials array
      const potentials = []

      if (potentials.includes(sn)) {
        const tfs = allTransfersForTheseStudentsByStudentNumber[sn]
        const findOriginalSource = code => {
          const transferThatHasThisAsTarget = tfs.find(t => t.targetcode == code)
          if (!transferThatHasThisAsTarget) return code
          return findOriginalSource(transferThatHasThisAsTarget.sourcecode)
        }
        source = findOriginalSource(transfer.sourcecode)
      }

      const studyRightElementOfSource = studyRightElementsByStudentNumber[sn].find(
        e => e.code == source && e.studyrightid == transfer.studyrightid
      )

      // find studyrightelement of old bsc program corresponding to old msc
      const studyRightElementOfSourcesBsc = studyRightElementsByStudentNumber[sn].find(
        e =>
          comparableDate(e.startdate) == comparableDate(studyRightElementOfSource.startdate) &&
          e.id != studyRightElementOfSource.id &&
          e.element_detail.type == '20' &&
          e.studyright.extentcode == '1'
      )

      // check if student has graduated from old bsc
      return studyRightElementOfSourcesBsc && studyRightElementOfSourcesBsc.studyright.graduated
    })
    .map(s => s.studentnumber)
}

// FromProgramme --> check sourcecode, otherwise to programm --> targetcode
const transferDiff = async programme => {
  const transfersOodi = await Transfers.findAll({
    where: { targetcode: programme }
  })
  const transfersOodiStudennumbers = transfersOodi.map(s => s.studentnumber)

  const transfersSis = await SISTransfer.findAll({
    where: { targetcode: programme }
  })
  const transfersSisStudentnumbers = transfersSis.map(s => s.studentnumber)

  let sisOnly = _.difference(transfersSisStudentnumbers, transfersOodiStudennumbers)
  let oodiOnly = _.difference(transfersOodiStudennumbers, transfersSisStudentnumbers)

  // Filter cases already known
  if (oodiOnly.length > 0) {
    oodiOnly = _.difference(oodiOnly, knownTransferErrors.oodi)
  }
  if (sisOnly.length > 0) {
    sisOnly = _.difference(sisOnly, knownTransferErrors.sis)
  }

  // Filter students found in populations script away
  if (oodiOnly.length > 0) {
    oodiOnly = _.difference(oodiOnly, knownFromPopulations)
  }
  if (sisOnly.length > 0) {
    sisOnly = _.difference(sisOnly, knownFromPopulations)
  }

  // Filter known good cases out
  if (oodiOnly.length > 0 && programme.startsWith('MH')) {
    const oodiOnlySet = new Set(oodiOnly)
    const oodiOnlyData = transfersOodi.filter(t => oodiOnlySet.has(t.studentnumber))
    const graduatedFromBscAndTransferred = await findGraduatedFromBscAndTransferred(oodiOnlyData)
    oodiOnly = _.difference(oodiOnly, graduatedFromBscAndTransferred)
  }

  if (oodiOnly.length === 0 && sisOnly.length === 0) return [0, 0]

  console.log(`=== Transferred to ${programme} ===`)

  if (oodiOnly.length > 0) {
    console.log('in oodi: ')
    console.log(oodiOnly.join('\n'))
  }

  if (sisOnly.length > 0) {
    console.log('in sis:')
    console.log(sisOnly.join('\n'))
  }

  return [oodiOnly.length, sisOnly.length]
}

const findProgrammes = async programmetype =>
  (
    await StudyrightElement.findAll({
      attributes: ['code'],
      where: {
        code: {
          [Op.like]: `${programmetype}%`
        }
      },
      group: ['code'],
      order: ['code']
    })
  ).map(s => s.code)

const calculateDiffs = async programmetype => {
  let oodiOnly = 0
  let sisOnly = 0
  const programmes = await findProgrammes(programmetype)
  for (const programme of programmes) {
    const result = await transferDiff(programme)
    oodiOnly += result[0]
    sisOnly += result[1]
  }

  console.log('\nTotals:')
  console.log('oodiOnly total: ', oodiOnly)
  console.log('sisOnly total:', sisOnly)
}

const main = async () => {
  console.log('=== BSC ===')
  await calculateDiffs('KH')
  console.log('=== MSC ===')
  await calculateDiffs('MH')
}

main()
/* 
  to run, run in project root: npm run diff:transfers 
*/
