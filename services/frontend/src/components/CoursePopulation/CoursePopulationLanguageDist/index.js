import React, { useState, useEffect } from 'react'
import { Table, Progress } from 'semantic-ui-react'
import { languageAbbreviations } from '../../../common'

const CoursePopulationLanguageDist = ({ samples, codes, from, to }) => {
  const [languages, setLanguages] = useState()
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (samples) {
      const lang = {}
      let students = 0

      samples.forEach(student => {
        const courses = student.courses.filter(c => codes.includes(c.course_code))
        const filteredCourses = courses
          .filter(
            course =>
              new Date(from).getTime() <= new Date(course.date).getTime() &&
              new Date(course.date).getTime() <= new Date(to).getTime()
          )
          .filter(course => course.passed === true)
          .sort((a, b) => new Date(a.date) <= new Date(b.date))

        if (filteredCourses[0] && filteredCourses[0].language !== null) {
          if (!lang[filteredCourses[0].language]) {
            lang[filteredCourses[0].language] = 0
          }
          lang[filteredCourses[0].language] += 1
          students++
        }
      })
      setLanguages(lang)
      setTotal(students)
    }
  }, [samples])

  const getLanguage = lang => (lang in languageAbbreviations ? languageAbbreviations[lang] : lang)

  if (total === 0) return <p>No data available!</p>

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Languages</Table.HeaderCell>
          <Table.HeaderCell>
            Language Distribution
            <br />
            <span style={{ fontWeight: 100 }}>(n={total})</span>
          </Table.HeaderCell>
          <Table.HeaderCell>Percentage of Population</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {total !== 0 &&
          Object.entries(languages).map(language => (
            <Table.Row key={`language-table-row-${language[0]}`}>
              <Table.Cell>{getLanguage(language[0])}</Table.Cell>
              <Table.Cell>{language[1]}</Table.Cell>
              <Table.Cell>
                {total !== 0 && (
                  <Progress percent={Math.round((language[1] / total) * 100)} progress style={{ margin: 0 }} />
                )}
              </Table.Cell>
            </Table.Row>
          ))}
      </Table.Body>
    </Table>
  )
}

export default CoursePopulationLanguageDist
