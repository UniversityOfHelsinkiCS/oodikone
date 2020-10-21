import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Table, Header, Dropdown, Message } from 'semantic-ui-react'
import { flatten, uniq } from 'lodash'
import { shape, string, number } from 'prop-types'
import { getTextIn } from '../../../common'
import useLanguage from '../../LanguagePicker/useLanguage'

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
            <Table.HeaderCell width={13}>Faculty</Table.HeaderCell>
            <Table.HeaderCell width={2}>Students</Table.HeaderCell>
            <Table.HeaderCell width={1}>Credits</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{rows}</Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell width={13} style={{ fontWeight: '700' }}>
              Total
            </Table.HeaderCell>
            <Table.HeaderCell width={2} style={{ fontWeight: '700' }}>
              {courseInstance.allStudents.length}
            </Table.HeaderCell>
            <Table.HeaderCell width={1} style={{ fontWeight: '700' }}>
              {courseInstance.allCredits}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </>
  )
}

const FacultyLevelStatistics = () => {
  const { language: activeLanguage } = useLanguage()
  const { courseStats, language } = useSelector(({ courseStats }) => ({
    courseStats: courseStats.data,
    language: activeLanguage
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

  const renderMessage = () =>
    yearsCourseStats.length !== Object.keys(courseStats).length ? (
      <Message info>
        <p>
          Displaying {yearsCourseStats.length} courses of {Object.keys(courseStats).length} searched courses
        </p>
      </Message>
    ) : null

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
      {renderMessage()}
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
