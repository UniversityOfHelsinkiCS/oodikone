import { flatten, uniq } from 'lodash'
import { number, string } from 'prop-types'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Dropdown, Form, Header, Table } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const CourseTableRow = ({ facultyCode, students, credits, facultyName }) => (
  <Table.Row>
    <Table.Cell width={13}>
      {facultyCode}, {facultyName}
    </Table.Cell>
    <Table.Cell width={2}>{students}</Table.Cell>
    <Table.Cell width={1}>{credits}</Table.Cell>
  </Table.Row>
)

const CourseTable = ({ course, courseInstance }) => {
  const { getTextIn } = useLanguage()

  const rows = courseInstance ? (
    [
      ...Object.entries(courseInstance.faculties)
        .sort(([facultyCodeA], [facultyCodeB]) => facultyCodeA.localeCompare(facultyCodeB))
        .map(([facultyCode, instanceFaculty]) => (
          <CourseTableRow
            credits={instanceFaculty.credits}
            facultyCode={facultyCode}
            facultyName={getTextIn(instanceFaculty.name)}
            key={`${course.coursecode}-${facultyCode}`}
            students={instanceFaculty.students.length}
          />
        )),
      <Table.Row key={`${course.coursecode}-total`} style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
        <Table.Cell width={13}>Total</Table.Cell>
        <Table.Cell width={2}>{courseInstance.allStudents.length}</Table.Cell>
        <Table.Cell width={1}>{courseInstance.allCredits}</Table.Cell>
      </Table.Row>,
    ]
  ) : (
    <Table.Row>
      <Table.Cell width={13}>No data for selected year</Table.Cell>
    </Table.Row>
  )

  return (
    <>
      <Header>
        {getTextIn(course.name)} ({course.coursecode})
      </Header>
      <Table compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={13}>Faculty</Table.HeaderCell>
            <Table.HeaderCell width={2}>Students</Table.HeaderCell>
            <Table.HeaderCell width={1}>Credits</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{rows}</Table.Body>
      </Table>
    </>
  )
}

export const FacultyLevelStatistics = () => {
  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)
  const courseStats = useSelector(state => state.courseStats.data)

  const yearCodes = uniq(
    flatten(Object.values(courseStats).map(course => Object.keys(course[openOrRegular].facultyStats)))
  )
    .sort()
    .reverse()

  const [selectedYear, setSelectedYear] = useState(yearCodes[0])

  const dropdownOptions = yearCodes.map(yearCode => ({
    key: yearCode,
    text: `${1949 + Number(yearCode)}-${1950 + Number(yearCode)}`,
    value: yearCode,
  }))

  const yearsCourseStats = Object.values(courseStats)
    .map(course => ({
      course,
      courseInstance: course[openOrRegular].facultyStats[selectedYear],
    }))
    .sort((a, b) => (a.courseInstance == null) - (b.courseInstance == null))

  const courseTables = yearsCourseStats.map(({ course, courseInstance }) => (
    <CourseTable course={course[openOrRegular]} courseInstance={courseInstance} key={course.unifyStats.coursecode} />
  ))

  return (
    <>
      <Form>
        <Form.Field>
          <label>Select academic year</label>
          <Dropdown
            defaultValue={selectedYear}
            onChange={(_, { value }) => setSelectedYear(value)}
            options={dropdownOptions}
            selection
          />
        </Form.Field>
      </Form>
      {courseTables}
    </>
  )
}

CourseTableRow.propTypes = {
  facultyCode: string.isRequired,
  students: number.isRequired,
  credits: number.isRequired,
  facultyName: string.isRequired,
}
