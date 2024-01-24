const Sequelize = require('sequelize')
const { Op } = Sequelize
const { codes } = require('../../../config/programmeCodes')
const { faculties } = require('../organisations')

const getFacultyList = async () => {
  const ignore = ['Y', 'H99', 'Y01', 'H92', 'H930']
  const facultyList = (await faculties()).filter(f => !ignore.includes(f.code))
  facultyList.sort((a, b) => (a.name.fi > b.name.fi ? 1 : -1))
  return facultyList
}

const findRightProgramme = (studyrightElements, code) => {
  let programme = ''
  let programmeName = ''
  let studyRightElement = null

  if (studyrightElements) {
    studyRightElement = studyrightElements
      .filter(sre => sre.element_detail.type === 20)
      .filter(sre => sre.code === code)

    if (studyRightElement.length > 0) {
      programme = studyRightElement[0].code
      programmeName = studyRightElement[0].element_detail.name
    }
  }
  return { programme, programmeName }
}

const facultyFormatStudyright = studyright => {
  const {
    studyrightid,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    studentStudentnumber,
    studyright_elements,
    startdate,
    facultyCode,
  } = studyright

  return {
    studyrightid,
    studystartdate,
    startdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    facultyCode,
    studentnumber: studentStudentnumber,
    studyrightElements: studyright_elements,
  }
}
const facultyProgrammeStudents = student => {
  const { studentnumber, home_country_en, gender_code, semester_enrollments } = student
  return {
    stundetNumber: studentnumber,
    homeCountryEn: home_country_en,
    genderCode: gender_code,
    semesters: semester_enrollments.map(s => s.dataValues),
  }
}
const formatFacultyTransfer = transfer => {
  const { sourcecode, targetcode, transferdate, studyrightid, studentnumber } = transfer
  return {
    sourcecode,
    targetcode,
    transferdate,
    studyrightid,
    studentnumber,
  }
}

const facultyFormatProgramme = programme => {
  const { code, name } = programme
  return { code, name }
}

const formatFacultyThesisWriter = credit => {
  const { course_code, credits, attainment_date, student_studentnumber, course } = credit
  return {
    course_code,
    credits,
    attainment_date,
    student_studentnumber,
    courseUnitType: course.course_unit_type,
  }
}

const formatOrganization = org => {
  const { id, name, code, parent_id } = org
  return { id, name, code, parentId: parent_id }
}

const newProgrammes = [/^KH/, /^MH/, /^T/, /^LI/, /^K-/, /^FI/, /^00901$/, /^00910$/]

const isNewProgramme = code => {
  for (let i = 0; i < newProgrammes.length; i++) {
    if (newProgrammes[i].test(code)) {
      return true
    }
  }
  return false
}

const checkTransfers = (s, insideTransfersStudyrights, transfersToOrAwayStudyrights) => {
  const allTransfers = [
    ...insideTransfersStudyrights.map(sr => sr.studentnumber),
    ...transfersToOrAwayStudyrights.map(sr => sr.studentnumber),
  ]
  return allTransfers.includes(s.studentnumber)
}

const getExtentFilter = includeAllSpecials => {
  const filteredExtents = [16] // always filter out secondary subject students
  if (!includeAllSpecials) {
    filteredExtents.push(6, 7, 9, 13, 14, 18, 22, 23, 34, 99)
  }
  let studyrightWhere = {
    extentcode: {
      [Op.notIn]: filteredExtents,
    },
  }
  return studyrightWhere
}

const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  const keys = Object.keys(codes)
  for (const prog of data) {
    if (keys.includes(prog.code)) {
      prog.progId = codes[prog.code].toUpperCase()
      if (prog.code === 'T923103' && !prog.progId.includes('-DP')) {
        prog.progId = prog.progId + '-DP'
      }
    } else {
      prog.progId = prog.code
    }
  }
}

module.exports = {
  getFacultyList,
  findRightProgramme,
  facultyFormatStudyright,
  facultyFormatProgramme,
  formatFacultyTransfer,
  formatFacultyThesisWriter,
  formatOrganization,
  isNewProgramme,
  checkTransfers,
  getExtentFilter,
  mapCodesToIds,
  facultyProgrammeStudents,
}
