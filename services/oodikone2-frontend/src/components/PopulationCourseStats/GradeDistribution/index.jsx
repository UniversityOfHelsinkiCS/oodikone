import React from 'react'
import { Table, Icon } from 'semantic-ui-react'
import { instanceOf, func } from 'prop-types'
import { useSelector } from 'react-redux'
import { getTextIn } from '../../../common'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import GradeDistributionHeader from './GradeDistributionHeader'
import GradeDistributionRow from './GradeDistributionRow'

const gradeTypes = [1, 2, 3, 4, 5]

const GradeDistribution = ({ expandedGroups, toggleGroupExpansion }) => {
  const { modules } = UsePopulationCourseContext()

  const { language } = useSelector(({ settings }) => settings)

  return (
    <Table celled sortable className="fixed-header">
      <GradeDistributionHeader gradeTypes={gradeTypes} />
      <Table.Body>
        {modules.map(({ module, courses }) => (
          <React.Fragment key={module.code}>
            <Table.Row>
              <Table.Cell style={{ cursor: 'pointer' }} colSpan="3" onClick={() => toggleGroupExpansion(module.code)}>
                <Icon name={expandedGroups.has(module.code) ? 'angle down' : 'angle right'} />
                <b>{getTextIn(module.name, language)}</b>
              </Table.Cell>
              <Table.Cell>
                <b>{module.code}</b>
              </Table.Cell>
              <Table.Cell colSpan="8" />
            </Table.Row>
            {expandedGroups.has(module.code) &&
              courses.map(course => (
                <GradeDistributionRow key={course.course.code} courseStatistics={course} gradeTypes={gradeTypes} />
              ))}
          </React.Fragment>
        ))}
      </Table.Body>
    </Table>
  )
}

GradeDistribution.propTypes = {
  expandedGroups: instanceOf(Set).isRequired,
  toggleGroupExpansion: func.isRequired
}

export default GradeDistribution
