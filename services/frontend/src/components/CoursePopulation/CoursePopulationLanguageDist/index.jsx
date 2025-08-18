import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { Table, Progress } from 'semantic-ui-react'

import { languageAbbreviations } from '@/common'

dayjsExtend(isBetween)

export const CoursePopulationLanguageDist = ({ samples, codes, from, to }) => {
  let total = 0
  const languages = {}

  if (samples) {
    samples.forEach(student => {
      const courses = student.courses.filter(course => codes.includes(course.course_code))
      const filteredCourses = courses
        .filter(course => dayjs(course.date).isBetween(dayjs(from), dayjs(to)))
        .sort((a, b) => (new Date(a.date) <= new Date(b.date) ? -1 : 1))

      if (filteredCourses[0] && filteredCourses[0].language !== null) {
        languages[filteredCourses[0].language] ??= 0
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
            Language distribution
            <div style={{ fontWeight: 100 }}>(n={total})</div>
          </Table.HeaderCell>
          <Table.HeaderCell>Percentage of population</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {Object.entries(languages).map(language => (
          <Table.Row key={`language-table-row-${language[0]}`}>
            <Table.Cell>{getLanguage(language[0])}</Table.Cell>
            <Table.Cell>{language[1]}</Table.Cell>
            <Table.Cell>
              <Progress precision={0} progress="percent" style={{ margin: 0 }} total={total} value={language[1]} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
