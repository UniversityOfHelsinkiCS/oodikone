import { findStudyRightForClass, getAllProgrammesOfStudent } from '@/common'
import { type Programme } from '../util'

export const createMaps = (
  selectedStudents: string[],
  students: any,
  programme: string | null,
  combinedProgramme: string | null,
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
    const student = students[studentNumber]

    const studentProgrammes = getAllProgrammesOfStudent(student?.studyRights ?? [], currentSemester)

    // In case of custompopulation with no programmeCode, use code of latest active studyRightElement
    const programmeCode: string | undefined = programme ?? studentProgrammes[0]?.code

    const relevantStudyRight = findStudyRightForClass(student.studyRights, programmeCode, year)
    const relevantStudyRightElement = relevantStudyRight?.studyRightElements.find(({ code }) => code === programmeCode)

    const degreeProgrammeTypeToCheck =
      relevantStudyRightElement?.degreeProgrammeType === 'urn:code:degree-program-type:bachelors-degree'
        ? 'urn:code:degree-program-type:masters-degree'
        : 'urn:code:degree-program-type:bachelors-degree'

    const secondStudyRightElement = (relevantStudyRight?.studyRightElements ?? [])
      .filter(element => {
        if (combinedProgramme) return element.code === combinedProgramme
        if (showBachelorAndMaster && !!relevantStudyRightElement)
          return element.degreeProgrammeType === degreeProgrammeTypeToCheck

        return false
      })
      .toSorted(({ startDate: a }, { startDate: b }) => Number(b < a) * 1 + Number(a < b) * -1)[0]

    studentToStudyrightStartMap.set(studentNumber, relevantStudyRight?.startDate ?? null)
    studentToProgrammeStartMap.set(studentNumber, relevantStudyRightElement?.startDate ?? null)
    studentToStudyrightEndMap.set(
      studentNumber,
      relevantStudyRightElement?.graduated ? relevantStudyRightElement.endDate : null
    )
    studentToSecondStudyrightEndMap.set(
      studentNumber,
      secondStudyRightElement?.graduated ? secondStudyRightElement.endDate : null
    )
    studentToPrimaryProgrammeMap.set(
      studentNumber,
      studentProgrammes.find(({ code }) => code === programmeCode)
    )
    studentToOtherProgrammesMap.set(
      studentNumber,
      studentProgrammes.filter(({ code }) => code !== programmeCode)
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
