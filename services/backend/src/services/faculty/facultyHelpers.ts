import { Op } from 'sequelize'
import { ignoredFacultyCodes } from '../../config/organizationConstants'

import { programmeCodes } from '../../config/programmeCodes'
import { Organization } from '../../models'
import { ExtentCode } from '../../types/extentCode'
import { ElementDetailType } from '../../types/elementDetailType'
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
      .filter(element => element.element_detail.type === ElementDetailType.PROGRAMME)
      .filter(element => element.code === code)

    if (studyRightElement.length > 0) {
      programme = studyRightElement[0].code
      programmeName = studyRightElement[0].element_detail.name
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

export const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  for (const programme of data) {
    if (Object.keys(programmeCodes).includes(programme.code)) {
      programme.progId = programmeCodes[programme.code]
    } else {
      programme.progId = programme.code
    }
  }
}
