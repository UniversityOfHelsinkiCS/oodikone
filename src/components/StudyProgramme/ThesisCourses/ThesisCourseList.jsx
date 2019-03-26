import React, { Component } from 'react'
import { connect } from 'react-redux'
import { string, func, bool, arrayOf, shape } from 'prop-types'
import { Dimmer, Loader, Segment, Button } from 'semantic-ui-react'
import { getThesisCourses, deleteThesisCourse } from '../../../redux/thesisCourses'
import SortableTable from '../../SortableTable'

class ThesisCourseList extends Component {
  componentDidMount() {
    const { studyprogramme } = this.props
    this.props.getThesisCourses(studyprogramme)
  }

  handleDelete = course => () => {
    const { studyprogramme } = this.props
    this.props.deleteThesisCourse(studyprogramme, course)
  }

  render() {
    const { pending, data } = this.props
    return (
      <React.Fragment>
        <Dimmer inverted active={pending} >
          <Loader />
        </Dimmer>
        {
          data.length === 0
            ? <Segment content="No thesis courses" /> : (
              <SortableTable
                tableProps={{ celled: true }}
                data={data}
                getRowKey={c => c.courseCode}
                columns={[
                  {
                    key: 'code',
                    title: 'Code',
                    headerProps: { width: 2 },
                    getRowVal: c => c.courseCode
                  },
                  {
                    key: 'type',
                    title: 'Type',
                    headerProps: { width: 13 },
                    getRowVal: c => c.thesisType
                  },
                  {
                    key: 'action',
                    title: 'Remove',
                    headerProps: { width: 1, textAlign: 'center' },
                    cellProps: { textAlign: 'center' },
                    getRowContent: c => (
                      <Button basic icon="trash" onClick={this.handleDelete(c.courseCode)} />
                    )
                  }
                ]}
              />
          )
        }
      </React.Fragment>
    )
  }
}

ThesisCourseList.propTypes = {
  studyprogramme: string.isRequired,
  pending: bool.isRequired,
  getThesisCourses: func.isRequired,
  deleteThesisCourse: func.isRequired,
  data: arrayOf(shape({
    courseCode: string,
    thesisType: string
  }))
}

ThesisCourseList.defaultProps = {
  data: []
}

const mapStateToProps = ({ thesisCourses }) => {
  const { pending, data } = thesisCourses
  return {
    pending,
    data
  }
}

export default connect(mapStateToProps, { getThesisCourses, deleteThesisCourse })(ThesisCourseList)
