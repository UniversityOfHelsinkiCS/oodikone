import { orderBy } from 'lodash'

import { findStudyRightForClass, getAllProgrammesOfStudent } from '@/common'
import { type Programme } from '../util'

export const createMaps = (
  selectedStudents: string[],
  students: any,
  programmeCodeArg: string | null,
  combinedProgrammeCode: string | null,
  year: string | null | undefined,
  currentSemester: any,
  showBachelorAndMaster: boolean
) => {
  const studentToStudyrightStartMap = new Map<string, Date | null>()
  const studentToStudyrightEndMap = new Map<string, Date | null>()
  const studentToSecondStudyrightEndMap = new Map<string, Date | null>()
  const studentToProgrammeStartMap = new Map<string, Date | null>()
  const studentToPrimaryProgrammeMap = new Map<string, Programme | undefined>()
  const studentToOtherProgrammesMap = new Map<string, Programme[] | undefined>()

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

    studentToStudyrightStartMap.set(studentNumber, studyRight?.startDate ?? null)
    studentToProgrammeStartMap.set(studentNumber, studyRightElement?.startDate ?? null)
    studentToStudyrightEndMap.set(studentNumber, studyRightElement?.graduated ? studyRightElement.endDate : null)
    studentToSecondStudyrightEndMap.set(
      studentNumber,
      secondStudyRightElement?.graduated ? secondStudyRightElement.endDate : null
    )
    studentToPrimaryProgrammeMap.set(
      studentNumber,
      programmes.find(programme => programme.code === programmeCode)
    )
    studentToOtherProgrammesMap.set(
      studentNumber,
      programmes.filter(p => p.code !== programmeCode)
    )
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
