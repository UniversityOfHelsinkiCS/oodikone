import { findStudyrightElementForClass } from '@/common'

export const createMaps = ({ selectedStudents, students, programmeCode, combinedProgrammeCode, year }) => {
  const studentToStudyrightStartMap = selectedStudents.reduce((res, studentNumber) => {
    const currentStudyright = students[studentNumber].studyrights.find(studyright =>
      findStudyrightElementForClass([studyright], programmeCode, year)
    )
    if (currentStudyright?.studyrightid && currentStudyright.studyrightid.slice(-2) === '-2') {
      const bachelorId = currentStudyright.studyrightid.replace(/-2$/, '-1')
      const bacherlorStudyright = students[studentNumber].studyrights.find(
        studyright => studyright.studyrightid === bachelorId
      )
      res[studentNumber] = bacherlorStudyright?.startdate || null
    } else {
      res[studentNumber] = currentStudyright?.startdate || null
    }
    return res
  }, {})

  const studentToProgrammeStartMap = selectedStudents.reduce((res, studentNumber) => {
    const programmeStart = findStudyrightElementForClass(
      students[studentNumber].studyrights,
      programmeCode,
      year
    )?.startdate
    // clean up odd bachelor start dates, (givendate)
    const studyrightStart = new Date(studentToStudyrightStartMap[studentNumber])
    res[studentNumber] = programmeStart
      ? new Date(Math.max(new Date(programmeStart), studyrightStart))
      : studyrightStart
    return res
  }, {})

  const studentToStudyrightEndMap = selectedStudents.reduce((res, studentNumber) => {
    const targetStudyright = students[studentNumber].studyrights.find(studyright =>
      findStudyrightElementForClass([studyright], programmeCode, year)
    )
    res[studentNumber] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
    return res
  }, {})

  const studentToSecondStudyrightEndMap = selectedStudents.reduce((res, studentNumber) => {
    const targetStudyright = students[studentNumber].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === combinedProgrammeCode)
    )
    res[studentNumber] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
    return res
  }, {})
  return {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
    studentToProgrammeStartMap,
  }
}
