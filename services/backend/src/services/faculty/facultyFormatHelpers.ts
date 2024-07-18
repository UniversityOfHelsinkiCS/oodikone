import { ProgrammeModule, Studyright } from '../../models'

export const formatFacultyStudyRight = (studyright: Studyright) => {
  return {
    studyrightid: studyright.studyrightid,
    studystartdate: studyright.studystartdate,
    startdate: studyright.startdate,
    enddate: studyright.enddate,
    givendate: studyright.givendate,
    graduated: studyright.graduated,
    active: studyright.active,
    prioritycode: studyright.prioritycode,
    extentcode: studyright.extentcode,
    studentnumber: studyright.student_studentnumber,
    studyrightElements: studyright.studyright_elements,
    facultyCode: studyright.facultyCode,
  }
}

export const formatFacultyProgrammeStudents = student => {
  return {
    stundentNumber: student.studentnumber,
    homeCountryEn: student.home_country_en,
    genderCode: student.gender_code,
    semesters: student.semester_enrollments.map(enrollment => enrollment.dataValues),
  }
}

export const formatFacultyTransfer = transfer => {
  return {
    sourcecode: transfer.sourcecode,
    targetcode: transfer.targetcode,
    transferdate: transfer.transferdate,
    studyrightid: transfer.studyrightid,
    studentnumber: transfer.studentnumber,
  }
}

export const formatFacultyProgramme = (programme: ProgrammeModule) => {
  return {
    code: programme.code,
    name: programme.name,
  }
}

export const formatFacultyThesisWriter = credit => {
  return {
    course_code: credit.course_code,
    credits: credit.credits,
    attainment_date: credit.attainment_date,
    student_studentnumber: credit.student_studentnumber,
    courseUnitType: credit.course.course_unit_type,
  }
}

export const formatOrganization = organization => {
  return {
    id: organization.id,
    name: organization.name,
    code: organization.code,
    parentId: organization.parent_id,
  }
}
