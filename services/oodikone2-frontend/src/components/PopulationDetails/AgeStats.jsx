import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Table, Progress, Radio } from 'semantic-ui-react'

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
  const [isGrouped, setIsGrouped] = useState(false)

  const ages = Object.entries(
    filteredStudents
      .map(student => getAge(student.birthdate))
      .reduce(isGrouped ? groupedAgesReducer : separateAgesReducer, {})
  )
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([key, value]) => [key, value])

  const getAgeCellContent = age => {
    if (!isGrouped) return age
    if (age === '15') return '<20'

    return `${age} - ${Number(age) + 4}`
  }

  return (
    <div>
      <div style={{ marginTop: 15, marginBottom: 10 }}>
        <Radio toggle label="Group ages" checked={isGrouped} onChange={() => setIsGrouped(!isGrouped)} />
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
          {ages.map(([age, count]) => (
            <Table.Row key={age}>
              <Table.Cell>{getAgeCellContent(age)}</Table.Cell>
              <Table.Cell>{count}</Table.Cell>
              <Table.Cell>
                <Progress
                  percent={Math.round((count / filteredStudents.length) * 100)}
                  progress
                  style={{ margin: 0 }}
                />
              </Table.Cell>
            </Table.Row>
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
