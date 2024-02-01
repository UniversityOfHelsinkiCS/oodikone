import React, { useState } from 'react'
import { Icon, Accordion, Table, Popup } from 'semantic-ui-react'
import _ from 'lodash'

import { useGetSemestersQuery } from 'redux/semesters'
import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { getSemestersPresentFunctions } from 'components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'

const calculateSemesterEnrollmentsByStudyright = (semestersAndYears, studyrights) => {
  const { semesters, years } = semestersAndYears
  const programmeNames = {}
  let firstYear

  const enrollmentsByStudyright = Object.values(studyrights).reduce((enrollments, studyright) => {
    // Let's choose the first studyright as they are all linked to the same actual (Sisu) studyright
    studyright[0].semesterEnrollments.forEach(enrollment => {
      const year = years[semesters[enrollment.semestercode].yearcode]
      const enrollmentYear = new Date(year.startdate).getFullYear()

      if (!firstYear || enrollmentYear < firstYear) {
        firstYear = enrollmentYear
      }

      const studyrightId = studyright[0].actual_studyrightid
      if (!enrollments[studyrightId]) {
        enrollments[studyrightId] = {}
      }
      enrollments[studyrightId][enrollment.semestercode] = enrollment.enrollmenttype
    })

    studyright.forEach(element => {
      const studyrightId = element.actual_studyrightid
      if (!programmeNames[studyrightId]) {
        programmeNames[studyrightId] = []
      }
      element.studyright_elements
        .filter(elem => elem.element_detail.type === 20)
        .forEach(elem => {
          programmeNames[studyrightId].push(elem.element_detail.name)
        })
    })
    return enrollments
  }, {})

  return { enrollmentsByStudyright, programmeNames, firstYear }
}

export const EnrollmentAccordion = ({ student }) => {
  const { data: semestersAndYears } = useGetSemestersQuery()
  const [active, setActive] = useState(false)
  const { getTextIn } = useLanguage()

  if (!semestersAndYears || !student) return null

  const { studyrights } = student

  const studyrightsGroupedByStudyright = _.groupBy(
    studyrights?.filter(sr => sr.semesterEnrollments !== null && sr.studyright_elements.length > 0),
    'actual_studyrightid'
  )

  const { enrollmentsByStudyright, programmeNames, firstYear } = calculateSemesterEnrollmentsByStudyright(
    semestersAndYears,
    studyrightsGroupedByStudyright
  )

  const firstDisplayedYear = `${Math.max(new Date().getFullYear() - 10, firstYear)}`

  const { getSemesterEnrollmentsContent } = getSemestersPresentFunctions({
    allSemesters: Object.values(semestersAndYears.semesters),
    allSemestersMap: semestersAndYears.semesters,
    year: firstDisplayedYear,
    filteredStudents: [student],
    getTextIn,
  })

  const semesterEnrollments = Object.values(studyrightsGroupedByStudyright).reduce((acc, studyright) => {
    acc[studyright[0].actual_studyrightid] = getSemesterEnrollmentsContent(student, studyright)
    return acc
  }, {})

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
                  position="top center"
                  trigger={<Icon name="question circle outline" style={{ opacity: 0.5, marginLeft: '0.25em' }} />}
                  content="Displays enrollment data for the current and up to nine previous academic years."
                />
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Object.entries(enrollmentsByStudyright).map(([studyrightId]) => (
              <Table.Row key={studyrightId}>
                <Table.Cell>
                  {_.flatten(programmeNames[studyrightId])
                    .map(getTextIn)
                    .map(elem => (
                      <p key={elem}>{elem}</p>
                    ))}
                </Table.Cell>
                <Table.Cell>{semesterEnrollments[studyrightId]}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Accordion.Content>
    </Accordion>
  )
}
