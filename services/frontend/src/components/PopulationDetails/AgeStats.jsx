import { arrayOf, object, shape } from 'prop-types'
import React, { useState } from 'react'
import { Icon, Progress, Radio, Table } from 'semantic-ui-react'

import { getAge, getFullStudyProgrammeRights } from '@/common'
import { useGetAuthorizedUserQuery } from '@/redux/auth'

const getAverage = values => {
  if (values.length === 0) return 0
  return (values.reduce((acc, cur) => acc + cur, 0) / values.length).toFixed(1)
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

export const AgeStats = ({ filteredStudents, query }) => {
  const [isGrouped, setIsGrouped] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState([])
  const { isAdmin, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const onlyIamRights = !isAdmin && fullStudyProgrammeRights.length === 0
  const studentsAges = filteredStudents.map(student => getAge(student.birthdate)).sort((a, b) => b - a)

  const getAges = grouped =>
    Object.entries(studentsAges.reduce(grouped ? groupedAgesReducer : separateAgesReducer, {}))
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([key, value]) => [key, value])

  const getAgeCellContent = age => {
    if (!isGrouped) return age
    if (age === '15') return '<20'
    return `${age} - ${Number(age) + 4}`
  }

  const handleGroupExpand = index => {
    if (expandedGroups.includes(index)) {
      setExpandedGroups(expandedGroups.filter(value => value !== index))
    } else {
      setExpandedGroups(expandedGroups.concat(index))
    }
  }

  const getActualStartDate = student => {
    const actualStudyStartDate = student.studyrights.reduce((startdate, studyright) => {
      if (startdate) return startdate
      if (!studyright.studyright_elements.some(element => element.code === query.studyRights.programme)) {
        return startdate
      }
      return new Date(studyright.startdate).getTime() > new Date(studyright.studystartdate).getTime()
        ? studyright.startdate
        : studyright.studystartdate
    }, null)
    return new Date(actualStudyStartDate)
  }

  const getAverageAtStudiesStart = () => {
    return getAverage(
      filteredStudents.reduce((acc, student) => {
        const timeSinceStudiesStart = new Date().getTime() - getActualStartDate(student).getTime()
        const ageAtStudiestStart = getAge(new Date(student.birthdate).getTime() + timeSinceStudiesStart)
        acc.push(Number(ageAtStudiestStart))
        return acc
      }, [])
    )
  }

  return (
    <div>
      {!onlyIamRights && (
        <div style={{ marginTop: 15, marginBottom: 10 }}>
          <Radio checked={isGrouped} label="Group ages" onChange={() => setIsGrouped(!isGrouped)} toggle />
        </div>
      )}
      <div>
        Average:{' '}
        {getAverage(getAges(false).flatMap(([age, count]) => Array.from({ length: count }, () => Number(age))))}
      </div>
      <div>Average at studies start: {getAverageAtStudiesStart()}</div>
      <Table celled compact="very">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Age</Table.HeaderCell>
            <Table.HeaderCell>
              Number of students <span style={{ fontWeight: 100 }}>(n={filteredStudents.length})</span>
            </Table.HeaderCell>
            <Table.HeaderCell>Percentage of population</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {getAges(isGrouped).map(([age, count], index) => (
            <React.Fragment key={age}>
              <Table.Row
                onClick={!onlyIamRights ? () => handleGroupExpand(index) : null}
                style={!onlyIamRights ? { cursor: isGrouped ? 'pointer' : undefined } : {}}
              >
                <Table.Cell>
                  {getAgeCellContent(age)}{' '}
                  {isGrouped && !onlyIamRights && (
                    <Icon color="grey" name={expandedGroups.includes(index) ? 'caret down' : 'caret right'} />
                  )}
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
                expandedGroups.includes(index) &&
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
  filteredStudents: arrayOf(object).isRequired,
  query: shape({}).isRequired,
}
