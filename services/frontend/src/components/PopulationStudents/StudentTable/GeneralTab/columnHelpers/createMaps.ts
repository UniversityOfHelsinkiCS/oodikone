import { findStudyRightForClass, getAllProgrammesOfStudent } from '@/common'
import { DegreeProgrammeType } from '@oodikone/shared/types'

export const createMaps = (
  students: any[],
  programme: string | null,
  combinedProgramme: string | null,
  year: string | null | undefined,
  currentSemester: any,
  showBachelorAndMaster: boolean
) => {
  const studentToStudyrightEndMap = new Map<string, Date | null>()
  const studentToSecondStudyrightEndMap = new Map<string, Date | null>()

  for (const student of students) {
    const { studentNumber } = student

    const studentProgrammes = getAllProgrammesOfStudent(student?.studyRights ?? [], currentSemester)

    // In case of custompopulation with no programmeCode, use code of latest active studyRightElement
    const programmeCode: string | undefined = programme ?? studentProgrammes[0]?.code

    const relevantStudyRight = findStudyRightForClass(student.studyRights, programmeCode, year)
    const relevantStudyRightElement = relevantStudyRight?.studyRightElements.find(({ code }) => code === programmeCode)

    const degreeProgrammeTypeToCheck =
      relevantStudyRightElement?.degreeProgrammeType === DegreeProgrammeType.BACHELOR
        ? DegreeProgrammeType.MASTER
        : DegreeProgrammeType.BACHELOR

    const secondStudyRightElement = (relevantStudyRight?.studyRightElements ?? [])
      .filter(element => {
        if (combinedProgramme) return element.code === combinedProgramme
        if (showBachelorAndMaster && !!relevantStudyRightElement)
          return element.degreeProgrammeType === degreeProgrammeTypeToCheck

        return false
      })
      .toSorted(({ startDate: a }, { startDate: b }) => Number(b < a) * 1 + Number(a < b) * -1)[0]

    studentToStudyrightEndMap.set(
      studentNumber,
      relevantStudyRightElement?.graduated ? relevantStudyRightElement.endDate : null
    )
    studentToSecondStudyrightEndMap.set(
      studentNumber,
      secondStudyRightElement?.graduated ? secondStudyRightElement.endDate : null
    )
  }

  return {
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
  }
}
