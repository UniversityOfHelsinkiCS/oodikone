import { ignoredFacultyCodes } from '../../config/organizationConstants'
import { Organization } from '../../models'
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
