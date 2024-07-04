const { Op } = require('sequelize')

const { codes } = require('../../../config/programmeCodes')
const { faculties } = require('../organisations')

const getFacultyList = async () => {
  const ignore = ['Y', 'H99', 'Y01', 'H92', 'H930']
  const facultyList = (await faculties()).filter(faculty => !ignore.includes(faculty.code))
  facultyList.sort((a, b) => (a.name.fi > b.name.fi ? 1 : -1))
  return facultyList
}

const findRightProgramme = (studyRightElements, code) => {
  let programme = ''
  let programmeName = ''
  let studyRightElement = null
  if (studyRightElements) {
    studyRightElement = studyRightElements.find(studyRightElement => studyRightElement.code === code)
    if (studyRightElement) {
      programme = studyRightElement.code
      programmeName = studyRightElement.name
    }
  }
  return { programme, programmeName }
}

const newProgrammes = [/^KH/, /^MH/, /^T/, /^LI/, /^K-/, /^FI/, /^00901$/, /^00910$/]

const isNewProgramme = code => newProgrammes.some(pattern => pattern.test(code))

const commissionedProgrammes = ['KH50_009', 'MH50_015', 'T923103-N']

const checkCommissioned = studyRightElements => {
  return studyRightElements.some(element => commissionedProgrammes.includes(element.code))
}

const checkTransfers = (studyRight, insideTransfersStudyRights, transfersToOrAwayStudyRights) => {
  const allTransfers = [
    ...insideTransfersStudyRights.map(studyRight => studyRight.studentNumber),
    ...transfersToOrAwayStudyRights.map(studyRight => studyRight.studentNumber),
  ]
  return allTransfers.includes(studyRight.studentNumber)
}

const getExtentFilter = includeAllSpecials => {
  const filteredExtents = [16] // always filter out secondary subject students
  if (!includeAllSpecials) {
    filteredExtents.push(6, 7, 9, 13, 14, 18, 22, 23, 34, 99)
  }
  const studyRightWhere = {
    extentCode: {
      [Op.notIn]: filteredExtents,
    },
  }
  return studyRightWhere
}

const graduatedAsBachelor = (extentCode, studyRightElements) => {
  return (
    extentCode === 1 ||
    (extentCode === 5 && studyRightElements.find(element => element.phase === 1 && element.graduated))
  )
}

const graduatedAsMaster = (extentCode, studyRightElements) => {
  return (
    extentCode === 2 ||
    (extentCode === 5 && studyRightElements.find(element => element.phase === 2 && element.graduated))
  )
}

const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  const keys = Object.keys(codes)
  for (const prog of data) {
    if (keys.includes(prog.code)) {
      prog.progId = codes[prog.code]
    } else {
      prog.progId = prog.code
    }
  }
}

module.exports = {
  checkCommissioned,
  getFacultyList,
  graduatedAsBachelor,
  graduatedAsMaster,
  findRightProgramme,
  isNewProgramme,
  checkTransfers,
  getExtentFilter,
  mapCodesToIds,
}
