import dayjs from 'dayjs'
import { mean, groupBy } from 'lodash'
import { arrayOf, object, shape } from 'prop-types'
import { Fragment, useState } from 'react'
import { Icon, Radio, Table } from 'semantic-ui-react'

import { ProgressBarWithLabel } from '@/components/common/ProgressBarWithLabel'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getAge } from '@/util/timeAndDate'

export const AgeStats = ({ filteredStudents, query }) => {
  const [isGrouped, setIsGrouped] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState([])
  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const onlyIamRights = !fullAccessToStudentData && fullStudyProgrammeRights.length === 0

  const currentAges = filteredStudents.reduce((ages, student) => {
    ages.push(getAge(student.birthdate, false))
    return ages
  }, [])

  const getAges = grouped =>
    Object.entries(groupBy(currentAges, age => (grouped ? Math.floor(age / 5) * 5 : Math.floor(age))))
      .map(([age, arrayOfAges]) => [age, arrayOfAges.length])
      .sort((a, b) => Number(b[0]) - Number(a[0]))

  const getAgeCellContent = age => {
    if (!isGrouped) return age
    if (age === '15') return '< 20'
    return `${age}–${Number(age) + 4}`
  }

  const handleGroupExpand = index => {
    if (expandedGroups.includes(index)) {
      setExpandedGroups(expandedGroups.filter(value => value !== index))
    } else {
      setExpandedGroups(expandedGroups.concat(index))
    }
  }

  const averageAgeAtStudiesStart = mean(
    filteredStudents.reduce((ages, student) => {
      const studyRight = student.studyRights.find(sr => sr.studyRightElements.some(el => el.code === query.programme))
      if (studyRight) {
        const startDateInProgramme = studyRight.studyRightElements.find(el => el.code === query.programme).startDate
        ages.push(getAge(student.birthdate, false, dayjs(startDateInProgramme)))
      }
      return ages
    }, [])
  ).toFixed(1)

  const currentAverageAge = mean(currentAges).toFixed(1)

  return (
    <div>
      <div>Current average age: {currentAverageAge}</div>
      {query.programme && <div>Average age at studies start: {averageAgeAtStudiesStart}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {!onlyIamRights && (
          <Radio
            checked={isGrouped}
            label="Group ages"
            onChange={() => setIsGrouped(!isGrouped)}
            style={{ marginTop: '1rem' }}
            toggle
          />
        )}
        <Table celled collapsing compact>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Current age</Table.HeaderCell>
              <Table.HeaderCell>
                Number of students <span style={{ fontWeight: 100 }}>(n={filteredStudents.length})</span>
              </Table.HeaderCell>
              <Table.HeaderCell>Percentage of population</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {getAges(isGrouped).map(([age, count], index) => (
              <Fragment key={age}>
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
                    <ProgressBarWithLabel total={filteredStudents.length} value={count} />
                  </Table.Cell>
                </Table.Row>
                {isGrouped &&
                  expandedGroups.includes(index) &&
                  getAges(false)
                    .filter(([nonGroupedAge]) => Math.floor(nonGroupedAge / 5) * 5 === Number(age))
                    .map(([nonGroupedAge, nonGroupedAgeCount]) => {
                      return (
                        <Table.Row key={nonGroupedAge} style={{ backgroundColor: '#e1e1e1' }}>
                          <Table.Cell style={{ paddingLeft: '1.5rem' }}>{nonGroupedAge}</Table.Cell>
                          <Table.Cell>{nonGroupedAgeCount}</Table.Cell>
                          <Table.Cell>
                            <ProgressBarWithLabel total={filteredStudents.length} value={nonGroupedAgeCount} />
                          </Table.Cell>
                        </Table.Row>
                      )
                    })}
              </Fragment>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

AgeStats.propTypes = {
  filteredStudents: arrayOf(object).isRequired,
  query: shape({}).isRequired,
}
