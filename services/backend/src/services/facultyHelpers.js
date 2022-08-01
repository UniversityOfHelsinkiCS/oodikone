const resolveStudyRightCode = studyright_elements => {
  if (!studyright_elements) return null
  const studyRightElement = studyright_elements
    .filter(sre => sre.element_detail.type === 20)
    .sort((a, b) => new Date(a.startdate) - new Date(b.startdate))[0]
  // this way round counts to old programmes, other way around to new programmes
  if (studyRightElement) return studyRightElement.code
  return null
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
  } = studyright

  return {
    studyrightid,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    studentnumber: student.studentnumber,
    startedProgramme: resolveStudyRightCode(studyright_elements),
    // studyrightElements: studyright_elements,
    // name:
    //   studyright_elements?.length && studyright_elements[0].element_detail && studyright_elements[0].element_detail.name
    //     ? studyright_elements[0].element_detail.name
    //     : null,
  }
}

module.exports = { facultyFormatStudyright }
