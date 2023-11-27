import _ from 'lodash'

export const createMaps = ({ selectedStudents, students, programmeCode, combinedProgrammeCode }) => {
  const studentToStudyrightStartMap = selectedStudents.reduce((res, sn) => {
    const currentStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === programmeCode)
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
    const targetStudyright = _.flatten(
      students[sn].studyrights.reduce((acc, curr) => {
        acc.push(curr.studyright_elements)
        return acc
      }, [])
    ).filter(e => e.code === programmeCode)
    // clean up odd bachelor start dates, (givendate)
    res[sn] = new Date(Math.max(new Date(targetStudyright[0]?.startdate), new Date(studentToStudyrightStartMap[sn])))
    return res
  }, {})

  const studentToStudyrightEndMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === programmeCode)
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
