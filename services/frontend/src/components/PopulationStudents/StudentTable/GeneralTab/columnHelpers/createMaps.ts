import { orderBy } from 'lodash'

import { findStudyRightForClass, getAllProgrammesOfStudent } from '@/common'

export const createMaps = (
  selectedStudents: string[],
  students: any,
  programmeCodeArg: string | null,
  combinedProgrammeCode: string | null,
  year: string | null | undefined,
  currentSemester: any,
  getTextIn: (arg0: any) => any,
  showBachelorAndMaster: boolean
) => {
  const studentToStudyrightStartMap = {}
  const studentToStudyrightEndMap = {}
  const studentToSecondStudyrightEndMap = {}
  const studentToProgrammeStartMap = {}
  const studentToOtherProgrammesMap = {}
  const studentToPrimaryProgrammeMap = {}

  for (const studentNumber of selectedStudents) {
    const { studyRights } = students[studentNumber]

    const programmes = getAllProgrammesOfStudent(students[studentNumber]?.studyRights ?? [], currentSemester)

    // In case of custompopulation with no programmeCode, use code of latest active studyRightElement
    const programmeCode = programmeCodeArg ?? programmes[0]?.code

    const studyRight = findStudyRightForClass(studyRights, programmeCode, year)
    const studyRightElement = studyRight?.studyRightElements?.find(element => element.code === programmeCode)
    const secondStudyRightElement = orderBy(
      (studyRight?.studyRightElements ?? []).filter(element => {
        if (combinedProgrammeCode) {
          return element.code === combinedProgrammeCode
        }
        if (showBachelorAndMaster && studyRightElement) {
          const degreeProgrammeTypeToCheck =
            studyRightElement.degreeProgrammeType === 'urn:code:degree-program-type:bachelors-degree'
              ? 'urn:code:degree-program-type:masters-degree'
              : 'urn:code:degree-program-type:bachelors-degree'
          return element.degreeProgrammeType === degreeProgrammeTypeToCheck
        }
        return false
      }),
      ['startDate'],
      ['desc']
    )[0]

    const programmesToUse = programmeCode ? programmes.filter(p => p.code !== programmeCode) : programmes

    studentToStudyrightStartMap[studentNumber] = studyRight?.startDate ?? null
    studentToProgrammeStartMap[studentNumber] = studyRightElement?.startDate ?? null
    studentToStudyrightEndMap[studentNumber] = studyRightElement?.graduated ? studyRightElement.endDate : null
    studentToSecondStudyrightEndMap[studentNumber] = secondStudyRightElement?.graduated
      ? secondStudyRightElement.endDate
      : null
    studentToOtherProgrammesMap[studentNumber] = {
      programmes: programmesToUse,
      getProgrammesList: delimiter =>
        programmesToUse
          .map(programme => {
            const programmeName = getTextIn(programme.name)
            if (programme.graduated) return `${programmeName} (graduated)`
            if (!programme.active) return `${programmeName} (inactive)`
            return programmeName
          })
          .join(delimiter),
    }
    studentToPrimaryProgrammeMap[studentNumber] = programmeCodeArg
      ? null
      : programmes.find(programme => programme.code === programmeCode)
  }

  return {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
    studentToProgrammeStartMap,
    studentToOtherProgrammesMap,
    studentToPrimaryProgrammeMap,
  }
}
