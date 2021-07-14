import React, { useState } from 'react'
import { Table } from 'semantic-ui-react'
import { func, instanceOf } from 'prop-types'
import PassingSemesterRow from './PassingSemesterRow'
import CollapsibleModuleTable from '../CollapsibleModuleTable'
import PassingSemestersHeader from './PassingSemestersHeader'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import CumulativeCheckbox from './CumulativeCheckbox'

const PassingSemesters = ({ expandedGroups, toggleGroupExpansion }) => {
  const { modules, onCourseNameCellClick, isActiveCourse } = UsePopulationCourseContext()
  const [cumulativeStats, setCumulativeStats] = useState(false)

  return (
    <div>
      <CumulativeCheckbox cumulativeStats={cumulativeStats} setCumulativeStats={setCumulativeStats} />
      <Table celled className="fixed-header">
        <PassingSemestersHeader />
        <Table.Body>
          <CollapsibleModuleTable
            modules={modules}
            emptyColSpan={15}
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
          >
            {courses =>
              courses.map(stats => (
                <PassingSemesterRow
                  key={stats.course.code}
                  statistics={stats}
                  isActiveCourseFn={isActiveCourse}
                  onCourseNameClickFn={onCourseNameCellClick}
                  cumulative={cumulativeStats}
                />
              ))
            }
          </CollapsibleModuleTable>
        </Table.Body>
      </Table>
    </div>
  )
}

PassingSemesters.propTypes = {
  expandedGroups: instanceOf(Set).isRequired,
  toggleGroupExpansion: func.isRequired,
}

export default PassingSemesters
