import _ from 'lodash'
import React, { useState } from 'react'
import { Icon, Accordion, Table, Popup } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { getSemestersPresentFunctions } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'
import { useGetSemestersQuery } from '@/redux/semesters'

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
        .filter(element => element.element_detail.type === 20)
        .forEach(element => {
          programmeNames[studyrightId].push(element.element_detail.name)
        })
    })
    return enrollments
  }, {})

  return { enrollmentsByStudyright, programmeNames, firstYear }
}

const getProgrammeEndDateForStudyright = (studyright, extentCode) => {
  const graduatedStudyright = studyright.find(element => element.extentcode === extentCode && element.graduated === 1)
  if (!graduatedStudyright) return null

  const { enddate, code } = graduatedStudyright.studyright_elements.find(
    element => element.enddate === graduatedStudyright.enddate
  )
  return { enddate, programmeCode: code }
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
      const { enddate, programmeCode } = masterInfo
      baseArguments.programmeCode = programmeCode
      studentToSecondStudyrightEndMap[student.studentNumber] = enddate
    }

    const bachelorInfo = getProgrammeEndDateForStudyright(studyright, 1)
    if (bachelorInfo) {
      const { enddate, programmeCode } = bachelorInfo
      baseArguments.programmeCode = programmeCode
      studentToStudyrightEndMap[student.studentNumber] = enddate
    }

    const { getSemesterEnrollmentsContent } = getSemestersPresentFunctions({
      ...baseArguments,
      studentToStudyrightEndMap,
      studentToSecondStudyrightEndMap,
    })

    acc[studyright[0].actual_studyrightid] = getSemesterEnrollmentsContent(student, studyright)
    return acc
  }, {})

export const EnrollmentAccordion = ({ student }) => {
  const { data: semestersAndYears } = useGetSemestersQuery()
  const [active, setActive] = useState(false)
  const { getTextIn } = useLanguage()

  if (!semestersAndYears || !student) return null

  const { studyrights } = student

  const studyrightsGroupedByStudyright = _.groupBy(
    studyrights?.filter(
      studyright => studyright.semesterEnrollments !== null && studyright.studyright_elements.length > 0
    ),
    'actual_studyrightid'
  )

  if (Object.keys(studyrightsGroupedByStudyright).length === 0) return null

  const { enrollmentsByStudyright, programmeNames, firstYear } = calculateSemesterEnrollmentsByStudyright(
    semestersAndYears,
    studyrightsGroupedByStudyright
  )

  const firstDisplayedYear = `${Math.max(new Date().getFullYear() - 10, firstYear)}`

  const semesterEnrollments = processStudyrights(
    Object.values(studyrightsGroupedByStudyright),
    student,
    firstDisplayedYear,
    getTextIn,
    semestersAndYears
  )

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
            {Object.entries(enrollmentsByStudyright).map(([studyrightId]) => (
              <Table.Row key={studyrightId}>
                <Table.Cell>
                  {_.flatten(programmeNames[studyrightId])
                    .map(getTextIn)
                    .map(element => (
                      <p key={element}>{element}</p>
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
