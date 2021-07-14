import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { string, func, bool, arrayOf, shape } from 'prop-types'
import { Dimmer, Loader, Segment, Button } from 'semantic-ui-react'
import { getThesisCourses, deleteThesisCourse } from '../../../redux/thesisCourses'
import SortableTable from '../../SortableTable'

const ThesisCourseList = ({ studyprogramme, getThesisCourses, pending, data, deleteThesisCourse }) => {
  useEffect(() => {
    getThesisCourses(studyprogramme)
  }, [studyprogramme])

  const handleDelete = course => () => {
    deleteThesisCourse(studyprogramme, course)
  }

  return (
    <>
      <Dimmer inverted active={pending}>
        <Loader />
      </Dimmer>
      {data.length === 0 ? (
        <Segment content="No thesis courses" />
      ) : (
        <SortableTable
          tableProps={{ celled: true }}
          data={data}
          getRowKey={c => c.courseCode}
          columns={[
            {
              key: 'code',
              title: 'Code',
              headerProps: { width: 2 },
              getRowVal: c => c.courseCode,
            },
            {
              key: 'type',
              title: 'Type',
              headerProps: { width: 13 },
              getRowVal: c => c.thesisType,
            },
            {
              key: 'action',
              title: 'Remove',
              headerProps: { width: 1, textAlign: 'center', onClick: null, sorted: null },
              cellProps: { textAlign: 'center' },
              getRowContent: c => <Button basic icon="trash" onClick={handleDelete(c.courseCode)} />,
            },
          ]}
        />
      )}
    </>
  )
}

ThesisCourseList.propTypes = {
  studyprogramme: string.isRequired,
  pending: bool.isRequired,
  getThesisCourses: func.isRequired,
  deleteThesisCourse: func.isRequired,
  data: arrayOf(
    shape({
      courseCode: string,
      thesisType: string,
    })
  ),
}

ThesisCourseList.defaultProps = {
  data: [],
}

const mapStateToProps = ({ thesisCourses }) => {
  const { pending, data } = thesisCourses
  return {
    pending,
    data,
  }
}

export default connect(mapStateToProps, { getThesisCourses, deleteThesisCourse })(ThesisCourseList)
