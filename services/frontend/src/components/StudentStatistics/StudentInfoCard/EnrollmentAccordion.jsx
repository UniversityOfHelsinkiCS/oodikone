import { useState } from 'react'
import { Icon, Accordion, Table, Popup } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { getSemestersPresentFunctions } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'
import { useGetSemestersQuery } from '@/redux/semesters'

const calculateSemesterEnrollmentsByStudyright = (semestersAndYears, studyrights) => {
  const { semesters, years } = semestersAndYears
  const programmeNames = {}
  let firstYear

  const studyRightsWithSemesterEnrollments = [
    ...studyrights.reduce((enrollments, studyRight) => {
      if (!studyRight.semesterEnrollments) return enrollments
      const { semesterEnrollments, id: studyRightId, studyRightElements } = studyRight

      enrollments.add(studyRightId)

      for (const enrollment of semesterEnrollments) {
        const year = years[semesters[enrollment.semester].yearcode]
        const enrollmentYear = new Date(year.startdate).getFullYear()
        if (!firstYear || enrollmentYear < firstYear) firstYear = enrollmentYear
      }

      programmeNames[studyRightId] = studyRightElements.map(element => element.name)

      return enrollments
    }, new Set()),
  ]

  return { studyRightsWithSemesterEnrollments, programmeNames, firstYear }
}

const getProgrammeEndDateForStudyright = (studyright, phase) => {
  const graduatedFromProgramme = studyright.studyRightElements.find(
    element => element.phase === phase && element.graduated
  )
  if (!graduatedFromProgramme) return null

  const { endDate, code: programmeCode } = graduatedFromProgramme
  return { endDate, programmeCode }
}

const processStudyrights = (studyrights, student, firstDisplayedYear, getTextIn, semestersAndYears) =>
  studyrights.reduce((acc, studyright) => {
    const studentToStudyrightEndMap = { [student.studentNumber]: null }
    const studentToSecondStudyrightEndMap = { [student.studentNumber]: null }

    const baseArguments = {
      allSemesters: Object.values(semestersAndYears.semesters),
      allSemestersMap: semestersAndYears.semesters,
      year: firstDisplayedYear,
      filteredStudents: [student],
      getTextIn,
    }

    const masterInfo = getProgrammeEndDateForStudyright(studyright, 2)
    if (masterInfo) {
      const { endDate, programmeCode } = masterInfo
      baseArguments.programmeCode = programmeCode
      studentToSecondStudyrightEndMap[student.studentNumber] = endDate
    }

    const bachelorInfo = getProgrammeEndDateForStudyright(studyright, 1)
    if (bachelorInfo) {
      const { endDate, programmeCode } = bachelorInfo
      baseArguments.programmeCode = programmeCode
      studentToStudyrightEndMap[student.studentNumber] = endDate
    }

    const { getSemesterEnrollmentsContent } = getSemestersPresentFunctions({
      ...baseArguments,
      studentToStudyrightEndMap,
      studentToSecondStudyrightEndMap,
    })

    acc[studyright.id] = getSemesterEnrollmentsContent(student, studyright)
    return acc
  }, {})

export const EnrollmentAccordion = ({ student }) => {
  const { data: semestersAndYears } = useGetSemestersQuery()
  const [active, setActive] = useState(false)
  const { getTextIn } = useLanguage()

  if (!semestersAndYears || !student || student.studyRights.length === 0) return null

  const { studyRights } = student

  const { studyRightsWithSemesterEnrollments, programmeNames, firstYear } = calculateSemesterEnrollmentsByStudyright(
    semestersAndYears,
    studyRights
  )

  const firstDisplayedYear = `${Math.max(new Date().getFullYear() - 10, firstYear)}`

  const semesterEnrollments = processStudyrights(studyRights, student, firstDisplayedYear, getTextIn, semestersAndYears)

  return (
    <Accordion style={{ marginBottom: active ? '0.5em' : 0 }}>
      <Accordion.Title active={active} onClick={() => setActive(!active)}>
        <Icon name="dropdown" />
        Enrollments
      </Accordion.Title>
      <Accordion.Content active={active}>
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Programme(s)</Table.HeaderCell>
              <Table.HeaderCell>
                Semesters (starting from autumn {firstDisplayedYear})
                <Popup
                  content="Displays enrollment data for the current and up to nine previous academic years."
                  position="top center"
                  trigger={<Icon name="question circle outline" style={{ opacity: 0.5, marginLeft: '0.25em' }} />}
                />
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {studyRightsWithSemesterEnrollments.map(studyRightId => (
              <Table.Row key={studyRightId}>
                <Table.Cell>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
                    {programmeNames[studyRightId].map(getTextIn).map(element => (
                      <div key={element}>{element}</div>
                    ))}
                  </div>
                </Table.Cell>
                <Table.Cell>{semesterEnrollments[studyRightId]}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Accordion.Content>
    </Accordion>
  )
}
