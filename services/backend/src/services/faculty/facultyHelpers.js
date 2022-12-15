const Sequelize = require('sequelize')
const { Op } = Sequelize
const { codes } = require('../../../config/programmeCodes')

const findRightProgramme = (studyrightElements, mode) => {
  let programme = ''
  let programmeName = ''
  let studyRightElement = null

  if (studyrightElements) {
    if (mode === 'started') {
      studyRightElement = studyrightElements
        .filter(sre => sre.element_detail.type === 20)
        .sort((a, b) => new Date(a.startdate) - new Date(b.startdate))[0]
      // this way round counts to old programmes, other way around to new programmes
    } else {
      // graduated
      studyRightElement = studyrightElements
        .filter(sre => sre.element_detail.type === 20)
        .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]
    }
    if (studyRightElement) {
      programme = studyRightElement.code
      programmeName = studyRightElement.element_detail.name
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
    student,
    studyright_elements,
    startdate,
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
    studentnumber: student.studentnumber,
    studyrightElements: studyright_elements,
  }
}
const facultyProgrammeStudents = student => {
  const { studentnumber, home_country_en, gender_code, semester_enrollments } = student
  return {
    studentnumber,
    home_country_en,
    gender_code,
    semesters: semester_enrollments.map(s => s.dataValues),
  }
}
const formatFacultyTransfer = transfer => {
  const { sourcecode, targetcode, transferdate, studyrightid } = transfer
  return {
    sourcecode,
    targetcode,
    transferdate,
    studyrightid,
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
  return insideTransfersStudyrights.includes(s.studyrightid) || transfersToOrAwayStudyrights.includes(s.studyrightid)
}

const getExtentFilter = includeAllSpecials => {
  const filteredExtents = [16] // always filter out secondary subject students
  if (!includeAllSpecials) {
    filteredExtents.push(7, 34, 22, 99, 14, 13, 9)
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
    } else {
      prog.progId = prog.code
    }
  }
}

module.exports = {
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
