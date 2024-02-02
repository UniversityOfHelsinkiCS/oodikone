import { findStudyrightElementForClass } from 'common'

export const createMaps = ({ selectedStudents, students, programmeCode, combinedProgrammeCode, year }) => {
  const studentToStudyrightStartMap = selectedStudents.reduce((res, sn) => {
    const currentStudyright = students[sn].studyrights.find(studyright =>
      findStudyrightElementForClass([studyright], programmeCode, year)
    )
    if (currentStudyright?.studyrightid && currentStudyright.studyrightid.slice(-2) === '-2') {
      const bachelorId = currentStudyright.studyrightid.replace(/-2$/, '-1')
      const bacherlorStudyright = students[sn].studyrights.find(studyright => studyright.studyrightid === bachelorId)
      res[sn] = bacherlorStudyright?.startdate || null
    } else {
      res[sn] = currentStudyright?.startdate || null
    }
    return res
  }, {})

  const studentToProgrammeStartMap = selectedStudents.reduce((res, sn) => {
    const programmeStart = findStudyrightElementForClass(students[sn].studyrights, programmeCode, year)?.startdate
    // clean up odd bachelor start dates, (givendate)
    const studyrightStart = new Date(studentToStudyrightStartMap[sn])
    res[sn] = programmeStart ? new Date(Math.max(programmeStart, studyrightStart)) : studyrightStart
    return res
  }, {})

  const studentToStudyrightEndMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = students[sn].studyrights.find(studyright =>
      findStudyrightElementForClass([studyright], programmeCode, year)
    )
    res[sn] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
    return res
  }, {})

  const studentToSecondStudyrightEndMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === combinedProgrammeCode)
    )
    res[sn] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
    return res
  }, {})
  return {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
    studentToProgrammeStartMap,
  }
}
