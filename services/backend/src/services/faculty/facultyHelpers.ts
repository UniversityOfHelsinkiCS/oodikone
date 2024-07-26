import { Op } from 'sequelize'

import { ignoredFacultyCodes } from '../../config/organizationConstants'
import { Organization, StudyrightElement } from '../../models'
import { ElementDetailType, ExtentCode } from '../../types'
import { getOrganizations } from '../organizations'

export const getFaculties = async (): Promise<Organization[]> => {
  const faculties = (await getOrganizations()).filter(faculty => !ignoredFacultyCodes.includes(faculty.code))
  return faculties
}

export const getSortedFaculties = async (): Promise<Organization[]> => {
  const faculties = await getFaculties()
  return faculties.sort((a, b) => {
    const nameA = a.name.fi ?? ''
    const nameB = b.name.fi ?? ''
    return nameA.localeCompare(nameB)
  })
}

export const findRightProgramme = (studyRightElements: StudyrightElement[], code: string) => {
  let programme = ''
  let programmeName = {}

  if (studyRightElements) {
    const matchingStudyRightElements = studyRightElements
      .filter(element => element.element_detail.type === ElementDetailType.PROGRAMME)
      .filter(element => element.code === code)

    if (matchingStudyRightElements.length > 0) {
      programme = matchingStudyRightElements[0].code
      programmeName = matchingStudyRightElements[0].element_detail.name
    }
  }

  return { programme, programmeName }
}

const newProgrammes = [/^KH/, /^MH/, /^T/, /^LI/, /^K-/, /^FI/, /^00901$/, /^00910$/]

export const isNewProgramme = (programmeCode: string): boolean => {
  return newProgrammes.some(pattern => pattern.test(programmeCode))
}

const commissionedProgrammes = ['KH50_009', 'MH50_015', 'T923103-N']

export const checkCommissioned = (studyRight: any): boolean => {
  return studyRight.studyrightElements.some(element => commissionedProgrammes.includes(element.code))
}

export const checkTransfers = (studyright, insideTransfersStudyrights, transfersToOrAwayStudyrights): boolean => {
  const allTransfers = [
    ...insideTransfersStudyrights.map(studyright => studyright.studentnumber),
    ...transfersToOrAwayStudyrights.map(studyright => studyright.studentnumber),
  ]
  return allTransfers.includes(studyright.studentnumber)
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
