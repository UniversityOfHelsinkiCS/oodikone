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
    organizations: course.organizations.map(organization => ({ code: organization.code, name: organization.name })),
  }
}

const formatOrganization = org => {
  const { id, name, code, parent_id } = org
  return { id, name, code, parentId: parent_id }
}

const formatAbsence = absence => {
  const { semestercode, semester } = absence
  return { semestercode, start: semester.startdate, end: semester.enddate }
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

module.exports = {
  findRightProgramme,
  facultyFormatStudyright,
  facultyFormatProgramme,
  formatFacultyTransfer,
  formatFacultyThesisWriter,
  formatOrganization,
  formatAbsence,
  isNewProgramme,
}
