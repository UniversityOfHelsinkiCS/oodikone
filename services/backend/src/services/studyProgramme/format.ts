import { ElementDetailType } from '../../types/elementDetailType'

const resolveStudyRightCode = (studyRightElements: any[]) => {
  if (!studyRightElements) {
    return null
  }
  const studyRightElement = studyRightElements
    .filter(element => element.element_detail.type === ElementDetailType.PROGRAMME)
    .sort((a, b) => new Date(b.startdate).getTime() - new Date(a.startdate).getTime())[0]
  if (!studyRightElement) {
    return null
  }
  return studyRightElement.code
}

export const formatStudyright = studyright => {
  return {
    studyrightid: studyright.studyrightid,
    startdate: studyright.startdate,
    studystartdate: studyright.studystartdate,
    enddate: studyright.enddate,
    givendate: studyright.givendate,
    graduated: studyright.graduated,
    active: studyright.active,
    prioritycode: studyright.prioritycode,
    extentcode: studyright.extentcode,
    studentNumber: studyright.student.studentnumber,
    code: resolveStudyRightCode(studyright.studyright_elements),
    studyrightElements: studyright.studyright_elements,
    cancelled: studyright.cancelled,
    facultyCode: studyright.facultyCode,
    actual_studyrightid: studyright.actual_studyrightid,
    semesterEnrollments: studyright.semesterEnrollments,
    name:
      studyright.studyright_elements?.length &&
      studyright.studyright_elements[0].element_detail &&
      studyright.studyright_elements[0].element_detail.name
        ? studyright.studyright_elements[0].element_detail.name
        : null,
  }
}

export const formatStudent = student => {
  return {
    studentNumber: student.studentnumber,
    genderCode: student.gender_code,
    homeCountryEn: student.home_country_en,
    creditcount: student.creditcount,
    credits: student.credits,
  }
}

export const formatCredit = credit => {
  const code = credit.course_code.replace('AY', '')
  return {
    id: `${credit.student_studentnumber}-${code}`, // For getting unique credits for each course code and student number
    acualId: credit.id,
    studentNumber: credit.student_studentnumber,
    courseCode: code,
    credits: credit.credits,
    attainmentDate: credit.attainment_date,
    studyrightId: credit.studyright_id,
    semestercode: credit.semestercode,
  }
}

export const formatTransfer = transfer => {
  return {
    sourcecode: transfer.sourcecode,
    targetcode: transfer.targetcode,
    transferdate: transfer.transferdate,
    studyrightid: transfer.studyrightid,
  }
}
