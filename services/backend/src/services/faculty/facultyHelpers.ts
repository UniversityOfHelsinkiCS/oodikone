import { Op } from 'sequelize'
import { ignoredFacultyCodes } from '../../../config/organisationConstants'

import { codes } from '../../../config/programmeCodes'
import { Organization } from '../../models'
import { ExtentCode } from '../../types/extentCode'
import { mapObject } from '../../util/map'
import { getOrganizations } from '../organizations'

export const getFaculties = async (): Promise<Organization[]> => {
  const faculties = (await getOrganizations()).filter(faculty => !ignoredFacultyCodes.includes(faculty.code))
  return faculties
}

export const getSortedFaculties = async (): Promise<Organization[]> => {
  const faculties = await getFaculties()
  return faculties.sort((a, b) => (a.name.fi > b.name.fi ? 1 : -1))
}

export const findRightProgramme = (studyRightElements: any, code: string) => {
  let programme = ''
  let programmeName = {}
  let studyRightElement = null

  if (studyRightElements) {
    studyRightElement = studyRightElements
      .filter(element => element.element_detail.type === 20)
      .filter(element => element.code === code)

    if (studyRightElement.length > 0) {
      programme = studyRightElement[0].code
      programmeName = studyRightElement[0].element_detail.name
    }
  }

  return { programme, programmeName }
}

export const formatFacultyStudyRight = studyright => {
  return mapObject(studyright, {
    studyrightid: 'studyrightid',
    studystartdate: 'studystartdate',
    startdate: 'startdate',
    enddate: 'enddate',
    givendate: 'givendate',
    graduated: 'graduated',
    active: 'active',
    prioritycode: 'prioritycode',
    extentcode: 'extentcode',
    studentnumber: 'student_studentnumber',
    studyrightElements: 'studyright_elements',
    facultyCode: 'facultyCode',
  })
}

export const formatFacultyProgrammeStudents = student => {
  const { studentnumber, home_country_en, gender_code, semester_enrollments } = student
  return {
    stundetNumber: studentnumber,
    homeCountryEn: home_country_en,
    genderCode: gender_code,
    semesters: semester_enrollments.map(s => s.dataValues),
  }
}

export const formatFacultyTransfer = transfer => {
  return mapObject(transfer, {
    sourcecode: 'sourcecode',
    targetcode: 'targetcode',
    transferdate: 'transferdate',
    studyrightid: 'studyrightid',
    studentnumber: 'studentnumber',
  })
}

export const formatFacultyProgramme = programme => {
  return mapObject(programme, {
    code: 'code',
    name: 'name',
  })
}

export const formatFacultyThesisWriter = credit => {
  return mapObject(credit, {
    course_code: 'course_code',
    credits: 'credits',
    attainment_date: 'attainment_date',
    student_studentnumber: 'student_studentnumber',
    courseUnitType: 'course.course_unit_type',
  })
}

export const formatOrganization = org => {
  const { id, name, code, parent_id } = org
  return { id, name, code, parentId: parent_id }
}

const newProgrammes = [/^KH/, /^MH/, /^T/, /^LI/, /^K-/, /^FI/, /^00901$/, /^00910$/]

export const isNewProgramme = (programmeCode: string) => {
  for (let i = 0; i < newProgrammes.length; i++) {
    if (newProgrammes[i].test(programmeCode)) {
      return true
    }
  }
  return false
}

export const checkTransfers = (studyright, insideTransfersStudyrights, transfersToOrAwayStudyrights) => {
  const allTransfers = [
    ...insideTransfersStudyrights.map(studyright => studyright.studentnumber),
    ...transfersToOrAwayStudyrights.map(studyright => studyright.studentnumber),
  ]
  return allTransfers.includes(studyright.studentnumber)
}

const commissionedProgrammes = ['KH50_009', 'MH50_015', 'T923103-N']

export const checkCommissioned = studyright => {
  return studyright.studyrightElements.some(element => commissionedProgrammes.includes(element.code))
}

export const getExtentFilter = (includeAllSpecials: boolean) => {
  const filteredExtents = [ExtentCode.STUDIES_FOR_SECONDARY_SCHOOL_STUDENTS]
  if (!includeAllSpecials) {
    filteredExtents.push(
      ExtentCode.CONTINUING_EDUCATION,
      ExtentCode.EXCHANGE_STUDIES,
      ExtentCode.OPEN_UNIVERSITY_STUDIES,
      ExtentCode.NON_DEGREE_PEGAGOGICAL_STUDIES_FOR_TEACHERS,
      ExtentCode.CONTRACT_TRAINING,
      ExtentCode.SPECIALIZATION_STUDIES,
      ExtentCode.NON_DEGREE_PROGRAMME_FOR_SPECIAL_EDUCATION_TEACHERS,
      ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY,
      ExtentCode.EXCHANGE_STUDIES_POSTGRADUATE,
      ExtentCode.NON_DEGREE_STUDIES
    )
  }
  const studyRightWhere = {
    extentcode: {
      [Op.notIn]: filteredExtents,
    },
  }
  return studyRightWhere
}

export const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  for (const programme of data) {
    if (Object.keys(codes).includes(programme.code)) {
      programme.progId = codes[programme.code]
    } else {
      programme.progId = programme.code
    }
  }
}
