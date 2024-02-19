import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Table, Header, Dropdown } from 'semantic-ui-react'
import { flatten, uniq } from 'lodash-es'
import { shape, string, number } from 'prop-types'
import { useLanguage } from '../../LanguagePicker/useLanguage'

const CourseTableRow = ({ facultyCode, students, credits, facultyName }) => {
  return (
    <Table.Row>
      <Table.Cell width={13}>
        {facultyCode}, {facultyName}
      </Table.Cell>
      <Table.Cell width={2}>{students}</Table.Cell>
      <Table.Cell width={1}>{credits}</Table.Cell>
    </Table.Row>
  )
}

const CourseTable = ({ course, courseInstance, selectedYear }) => {
  const { coursecode } = course
  const { getTextIn } = useLanguage()

  const name = getTextIn(course.name)

  const rows = courseInstance ? (
    Object.entries(courseInstance.faculties)
      .sort(([facultyCodeA], [facultyCodeB]) => facultyCodeA.localeCompare(facultyCodeB))
      .map(([facultyCode, instanceFaculty]) => (
        <CourseTableRow
          key={`${coursecode}-${facultyCode}`}
          facultyCode={facultyCode}
          facultyName={getTextIn(instanceFaculty.name)}
          students={instanceFaculty.students.length}
          credits={instanceFaculty.credits}
        />
      ))
  ) : (
    <Table.Row>
      <Table.Cell width={13}>No data for selected year</Table.Cell>
    </Table.Row>
  )

  const getYearToShow = () => {
    const alternativeYear = selectedYear ? `${1949 + Number(selectedYear)}-${1950 + Number(selectedYear)}` : ''
    return courseInstance ? courseInstance.year : alternativeYear
  }

  return (
    <>
      <Header>
        {getYearToShow()} {coursecode}
      </Header>
      <Header size="small">
        {name} ({coursecode})
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
        {courseInstance ? (
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell width={13} style={{ fontWeight: '700' }}>
                Total
              </Table.HeaderCell>
              <Table.HeaderCell width={2} style={{ fontWeight: '700' }}>
                {courseInstance ? courseInstance.allStudents.length : 0}
              </Table.HeaderCell>
              <Table.HeaderCell width={1} style={{ fontWeight: '700' }}>
                {courseInstance ? courseInstance.allCredits : 0}
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        ) : null}
      </Table>
    </>
  )
}

export const FacultyLevelStatistics = () => {
  const { language: activeLanguage } = useLanguage()
  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)
  const { courseStats } = useSelector(({ courseStats }) => ({
    courseStats: courseStats.data,
    language: activeLanguage,
  }))

  const yearcodes = uniq(flatten(Object.values(courseStats).map(c => Object.keys(c[openOrRegular].facultyStats))))
    .sort()
    .reverse()

  const [selectedYear, setSelectedYear] = useState(yearcodes[0])

  const dropdownOptions = yearcodes.map(year => ({
    key: year,
    text: `${1949 + Number(year)}-${1950 + Number(year)}`,
    value: year,
  }))

  const yearsCourseStats = Object.values(courseStats)
    .map(course => ({
      course,
      courseInstance: course[openOrRegular].facultyStats[selectedYear],
    }))
    .sort((a, b) => (a.courseInstance === undefined) - (b.courseInstance === undefined))

  const courseTables = yearsCourseStats.map(({ course, courseInstance }) => (
    <CourseTable
      course={course[openOrRegular]}
      courseInstance={courseInstance}
      key={course.unifyStats.coursecode}
      selectedYear={selectedYear}
    />
  ))

  return (
    <div>
      Select year
      <Dropdown
        fluid
        selection
        defaultValue={selectedYear}
        options={dropdownOptions}
        onChange={(e, data) => {
          setSelectedYear(data.value)
        }}
      />
      {courseTables}
    </div>
  )
}

CourseTableRow.propTypes = {
  facultyCode: string.isRequired,
  students: number.isRequired,
  credits: number.isRequired,
  facultyName: string.isRequired,
}

CourseTable.propTypes = {
  course: shape({}).isRequired,
  courseInstance: shape({}),
  selectedYear: string.isRequired,
}

CourseTable.defaultProps = {
  courseInstance: null,
}
