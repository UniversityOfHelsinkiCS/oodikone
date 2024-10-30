import { findStudyRightForClass, getAllProgrammesOfStudent } from '@/common'

export const createMaps = ({
  selectedStudents,
  students,
  programmeCode,
  combinedProgrammeCode,
  year,
  currentSemester,
  getTextIn,
}) => {
  const studentToStudyrightStartMap = {}
  const studentToStudyrightEndMap = {}
  const studentToSecondStudyrightEndMap = {}
  const studentToProgrammeStartMap = {}
  const studentToOtherProgrammesMap = {}

  for (const studentNumber of selectedStudents) {
    const { studyRights } = students[studentNumber]
    const studyRight = findStudyRightForClass(studyRights, programmeCode, year)
    const studyRightElement = studyRight?.studyRightElements?.find(element => element.code === programmeCode)
    const secondStudyRightElement = studyRight?.studyRightElements?.find(
      element => element.code === combinedProgrammeCode
    )
    const programmes = getAllProgrammesOfStudent(students[studentNumber]?.studyRights ?? [], currentSemester)
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
  }

  return {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
    studentToProgrammeStartMap,
    studentToOtherProgrammesMap,
  }
}
