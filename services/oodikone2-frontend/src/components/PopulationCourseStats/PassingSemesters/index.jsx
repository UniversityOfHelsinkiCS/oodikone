import React, { useState } from 'react'
import { Table, Checkbox } from 'semantic-ui-react'
import CourseRow from './CourseRow'
import TSA from '../../../common/tsa'
import useFeatureToggle from '../../../common/useFeatureToggle'
import CollapsibleModuleTable from '../CollapsibleModuleTable'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const PassingSemesters = ({ expandedGroups, toggleGroupExpansion }) => {
  const [mandatoryToggle] = useFeatureToggle('mandatoryToggle')
  const { modules, courseStatistics, onCourseNameCellClick, isActiveCourse, filterInput } = UsePopulationCourseContext()
  const [cumulativeStats, setCumulativeStats] = useState(false)

  const handleChange = () => {
    TSA.Matomo.sendEvent(
      'Population statistics',
      'Courses of Population toggle cumulative when passed stats',
      cumulativeStats ? 'false' : 'true'
    )
    // eslint-disable-next-line react/no-access-state-in-setstate
    setCumulativeStats(!cumulativeStats)
  }

  return (
    <div>
      <Checkbox toggle checked={cumulativeStats} onChange={handleChange} label="Show cumulative stats" />
      <Table celled className="fixed-header">
        <Table.Header>
          <Table.Row>
            {filterInput('nameFilter', 'Name', '2')}
            {filterInput('codeFilter', 'Code')}

            <Table.HeaderCell>Students</Table.HeaderCell>
            <Table.HeaderCell>Passed</Table.HeaderCell>

            <Table.HeaderCell>Before 1st year</Table.HeaderCell>
            <Table.HeaderCell>1st fall</Table.HeaderCell>
            <Table.HeaderCell>1st spring</Table.HeaderCell>
            <Table.HeaderCell>2nd fall</Table.HeaderCell>
            <Table.HeaderCell>2nd spring</Table.HeaderCell>
            <Table.HeaderCell>3rd fall</Table.HeaderCell>
            <Table.HeaderCell>3rd spring</Table.HeaderCell>
            <Table.HeaderCell>4th fall</Table.HeaderCell>
            <Table.HeaderCell>4th spring</Table.HeaderCell>
            <Table.HeaderCell>5th year</Table.HeaderCell>
            <Table.HeaderCell>6th year</Table.HeaderCell>
            <Table.HeaderCell>Later</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {mandatoryToggle ? (
            <CollapsibleModuleTable
              modules={modules}
              emptyColSpan={15}
              expandedGroups={expandedGroups}
              toggleGroupExpansion={toggleGroupExpansion}
            >
              {courses =>
                courses.map(stats => (
                  <CourseRow
                    key={stats.course.code}
                    statistics={stats}
                    isActiveCourseFn={isActiveCourse}
                    onCourseNameClickFn={onCourseNameCellClick}
                    cumulative={cumulativeStats}
                  />
                ))
              }
            </CollapsibleModuleTable>
          ) : (
            courseStatistics.map(stats => (
              <CourseRow
                key={stats.course.code}
                statistics={stats}
                isActiveCourseFn={isActiveCourse}
                onCourseNameClickFn={onCourseNameCellClick}
                cumulative={cumulativeStats}
              />
            ))
          )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default PassingSemesters
