import React from 'react'
import { Table } from 'semantic-ui-react'
import { func, instanceOf } from 'prop-types'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import CollapsibleModuleTable from '../CollapsibleModuleTable'
import PassFailRow from './PassFailRow'
import PassFailHeader from './PassFailHeader'

const PassFail = ({ expandedGroups, toggleGroupExpansion }) => {
  const { modules } = UsePopulationCourseContext()

  return (
    <Table className="fixed-header" celled sortable>
      <PassFailHeader />
      <Table.Body>
        <CollapsibleModuleTable
          emptyColSpan={12}
          modules={modules}
          expandedGroups={expandedGroups}
          toggleGroupExpansion={toggleGroupExpansion}
        >
          {courses => courses.map(stats => <PassFailRow key={stats.course.code} courseStats={stats} />)}
        </CollapsibleModuleTable>
      </Table.Body>
    </Table>
  )
}

PassFail.propTypes = {
  expandedGroups: instanceOf(Set).isRequired,
  toggleGroupExpansion: func.isRequired
}

export default PassFail
