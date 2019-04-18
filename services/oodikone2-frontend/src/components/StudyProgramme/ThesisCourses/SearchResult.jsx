import React from 'react'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { arrayOf, shape, string, func } from 'prop-types'
import { getCourseSearchResults } from '../../../selectors/courses'
import SortableTable from '../../SortableTable'

const SearchResult = ({ courses, getCourseActions }) => (courses.length === 0
  ? <Segment content="No results" /> : (
    <SortableTable
      getRowKey={c => c.code}
      tableProps={{ celled: true }}
      columns={[
        {
          key: 'code',
          title: 'Code',
          getRowVal: c => c.code,
          headerProps: { width: 2, textAlign: 'center' }
        },
        {
          key: 'name',
          title: 'Name',
          getRowVal: c => c.name,
          headerProps: { width: 12, textAlign: 'left' }
        },
        {
          key: 'actions',
          title: 'Action',
          getRowContent: getCourseActions,
          headerProps: { width: 2, textAlign: 'center' }
        }
      ]}
      data={courses}
    />
  ))

SearchResult.propTypes = {
  courses: arrayOf(shape({
    code: string,
    name: string
  })),
  getCourseActions: func.isRequired
}

SearchResult.defaultProps = {
  courses: []
}

const mapStateToProps = state => ({ courses: getCourseSearchResults(state) })

export default connect(mapStateToProps)(SearchResult)
