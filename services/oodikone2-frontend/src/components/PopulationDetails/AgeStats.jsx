import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Table, Progress, Radio, Icon } from 'semantic-ui-react'
import sendEvent from '../../common/sendEvent'

const sendAnalytics = sendEvent.populationStatistics

// https://stackoverflow.com/a/7091965
const getAge = dateString => {
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// https://stackoverflow.com/a/45309555
function getMedian(values) {
  if (values.length === 0) return 0

  values.sort(function(a, b) {
    return a - b
  })

  const half = Math.floor(values.length / 2)

  if (values.length % 2) return values[half]

  return (values[half - 1] + values[half]) / 2.0
}

const getAgeGroup = age => Math.floor(age / 5) * 5

const separateAgesReducer = (acc, age) => {
  const newCount = acc[age] ? ++acc[age] : 1
  acc[age] = newCount
  return acc
}
const groupedAgesReducer = (acc, age) => {
  const ageGroup = getAgeGroup(age)
  const newCount = acc[ageGroup] ? ++acc[ageGroup] : 1
  acc[ageGroup] = newCount
  return acc
}

const AgeStats = ({ filteredStudents }) => {
  const [isGrouped, setIsGrouped] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState([])

  const studentsAges = filteredStudents.map(student => getAge(student.birthdate)).sort((a, b) => b - a)

  const ages = Object.entries(studentsAges.reduce(isGrouped ? groupedAgesReducer : separateAgesReducer, {}))
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([key, value]) => [key, value])

  const getAgeCellContent = age => {
    if (!isGrouped) return age
    if (age === '15') return '<20'

    return `${age} - ${Number(age) + 4}`
  }

  const handleGroupExpand = index => {
    if (expandedGroups.includes(index)) {
      setExpandedGroups(expandedGroups.filter(val => val !== index))
    } else {
      setExpandedGroups(expandedGroups.concat(index))
      sendAnalytics('Age group expanded')
    }
  }

  return (
    <div>
      <div style={{ marginTop: 15, marginBottom: 10 }}>
        <Radio toggle label="Group ages" checked={isGrouped} onChange={() => setIsGrouped(!isGrouped)} />
      </div>
      <div>
        Median:{' '}
        {getMedian(
          ages.reduce((acc, [age, count]) => {
            for (let i = 0; i < count; i++) {
              acc.push(Number(age))
            }

            return acc
          }, [])
        )}
      </div>
      <Table celled compact="very">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Age</Table.HeaderCell>
            <Table.HeaderCell>
              Number of Students
              <br />
              <span style={{ fontWeight: 100 }}>(n={filteredStudents.length})</span>
            </Table.HeaderCell>
            <Table.HeaderCell>Percentage of Population</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {ages.map(([age, count], i) => (
            <React.Fragment key={age}>
              <Table.Row onClick={() => handleGroupExpand(i)} style={{ cursor: isGrouped ? 'pointer' : undefined }}>
                <Table.Cell>
                  {getAgeCellContent(age)}{' '}
                  {isGrouped && <Icon name={expandedGroups.includes(i) ? 'caret down' : 'caret right'} color="grey" />}
                </Table.Cell>
                <Table.Cell>{count}</Table.Cell>
                <Table.Cell>
                  <Progress
                    percent={Math.round((count / filteredStudents.length) * 100)}
                    progress
                    style={{ margin: 0 }}
                  />
                </Table.Cell>
              </Table.Row>

              {isGrouped &&
                expandedGroups.includes(i) &&
                Object.entries(
                  studentsAges
                    .filter(studentAge => studentAge + 1 > age && studentAge - 1 < Number(age) + 4)
                    .reduce(separateAgesReducer, [])
                )
                  .sort((a, b) => Number(b[0]) - Number(a[0]))
                  .map(([key, value]) => [key, value])
                  .map(([nonGroupedAge, nonGroupedAgeCount]) => {
                    return (
                      <Table.Row key={nonGroupedAge} style={{ backgroundColor: 'lightgray' }}>
                        <Table.Cell>{nonGroupedAge}</Table.Cell>
                        <Table.Cell>{nonGroupedAgeCount}</Table.Cell>
                        <Table.Cell>
                          <Progress
                            percent={Math.round((nonGroupedAgeCount / filteredStudents.length) * 100)}
                            progress
                            style={{ margin: 0 }}
                          />
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
            </React.Fragment>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

AgeStats.propTypes = {
  filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default AgeStats
