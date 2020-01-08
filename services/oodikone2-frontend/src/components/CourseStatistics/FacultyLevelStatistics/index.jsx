import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Table, Header, Dropdown } from 'semantic-ui-react'
import { flatten, uniq } from 'lodash'
import { shape, string, number } from 'prop-types'
import { getActiveLanguage } from 'react-localize-redux'
import { getTextIn } from '../../../common'

const CourseTableRow = ({ facultyCode, students, credits, facultyName }) => {
  return (
    <Table.Row>
      <Table.Cell>
        {facultyCode}, {facultyName}
      </Table.Cell>
      <Table.Cell>{students}</Table.Cell>
      <Table.Cell>{credits}</Table.Cell>
    </Table.Row>
  )
}

const CourseTable = ({ course, courseInstance, language }) => {
  const { coursecode, name } = course

  const rows = Object.entries(courseInstance.faculties)
    .sort(([facultyCodeA], [facultyCodeB]) => facultyCodeA.localeCompare(facultyCodeB))
    .map(([facultyCode, instanceFaculty]) => (
      <CourseTableRow
        key={`${coursecode}-${facultyCode}`}
        facultyCode={facultyCode}
        facultyName={getTextIn(instanceFaculty.name, language)}
        students={instanceFaculty.students.length}
        credits={instanceFaculty.credits}
      />
    ))
  return (
    <>
      <Header>
        {courseInstance.year} {coursecode}
      </Header>
      <Header size="small">
        {name} ({coursecode})
      </Header>
      <Table compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Faculty</Table.HeaderCell>
            <Table.HeaderCell>Students</Table.HeaderCell>
            <Table.HeaderCell>Credits</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{rows}</Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell style={{ fontWeight: '700' }}>Total</Table.HeaderCell>
            <Table.HeaderCell style={{ fontWeight: '700' }}>{courseInstance.allStudents.length}</Table.HeaderCell>
            <Table.HeaderCell style={{ fontWeight: '700' }}>{courseInstance.allCredits}</Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </>
  )
}

const FacultyLevelStatistics = () => {
  const { courseStats, language } = useSelector(({ courseStats, localize }) => ({
    courseStats: courseStats.data,
    language: getActiveLanguage(localize).code
  }))
  const yearcodes = uniq(flatten(Object.values(courseStats).map(c => Object.keys(c.facultyStats))))
    .sort()
    .reverse()

  const [selectedYear, setSelectedYear] = useState(yearcodes[0])

  const dropdownOptions = yearcodes.map(year => ({
    key: year,
    text: `${1949 + Number(year)}-${1950 + Number(year)}`,
    value: year
  }))

  const yearsCourseStats = Object.values(courseStats)
    .filter(course => !!course.facultyStats[selectedYear])
    .map(course => ({
      course,
      courseInstance: course.facultyStats[selectedYear]
    }))
  const courseTables = yearsCourseStats.map(({ course, courseInstance }) => (
    <CourseTable course={course} courseInstance={courseInstance} language={language} key={course.coursecode} />
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
  facultyName: string.isRequired
}

CourseTable.propTypes = {
  course: shape({}).isRequired,
  courseInstance: shape({}).isRequired,
  language: string.isRequired
}

export default FacultyLevelStatistics
