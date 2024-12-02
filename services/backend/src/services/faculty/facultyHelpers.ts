import { ignoredFacultyCodes } from '../../config/organizationConstants'
import { getOrganizations } from '../organizations'

export const getFaculties = async () => {
  const faculties = (await getOrganizations()).filter(faculty => !ignoredFacultyCodes.includes(faculty.code))
  return faculties
}

export const getSortedFaculties = async () => {
  const faculties = await getFaculties()
  return faculties.sort((a, b) => {
    const nameA = a.name.fi ?? ''
    const nameB = b.name.fi ?? ''
    return nameA.localeCompare(nameB)
  })
}
