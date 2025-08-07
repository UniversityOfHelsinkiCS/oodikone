// Linter was not having any of this so needed to add resolveJsonModule:true to tsconfig

import organizationConfig from '../environment/organizationConfig.json'

export const { facultyCodes } = organizationConfig
export const { ignoredFacultyCodes } = organizationConfig
export const { magicFacultyCode } = organizationConfig
