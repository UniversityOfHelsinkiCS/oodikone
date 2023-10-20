import React from 'react'
import { Table, Progress } from 'semantic-ui-react'
import moment from 'moment'
import { languageAbbreviations } from '../../../common'

export const CoursePopulationLanguageDist = ({ samples, codes, from, to }) => {
  let total = 0
  const languages = {}

  if (samples) {
    samples.forEach(student => {
      const courses = student.courses.filter(c => codes.includes(c.course_code))
      const filteredCourses = courses
        .filter(course => moment(course.date).isBetween(moment(from), moment(to)))
        .sort((a, b) => (new Date(a.date) <= new Date(b.date) ? -1 : 1))

      if (filteredCourses[0] && filteredCourses[0].language !== null) {
        if (!languages[filteredCourses[0].language]) {
          languages[filteredCourses[0].language] = 0
        }
        languages[filteredCourses[0].language] += 1
        total++
      }
    })
  }

  const getLanguage = lang => (lang in languageAbbreviations ? languageAbbreviations[lang] : lang)

  if (total === 0) return <p>No data available!</p>

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Languages</Table.HeaderCell>
          <Table.HeaderCell>
            Language Distribution
            <div style={{ fontWeight: 100 }}>(n={total})</div>
          </Table.HeaderCell>
          <Table.HeaderCell>Percentage of Population</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {Object.entries(languages).map(language => (
          <Table.Row key={`language-table-row-${language[0]}`}>
            <Table.Cell>{getLanguage(language[0])}</Table.Cell>
            <Table.Cell>{language[1]}</Table.Cell>
            <Table.Cell>
              <Progress value={language[1]} total={total} progress="percent" precision={0} style={{ margin: 0 }} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
