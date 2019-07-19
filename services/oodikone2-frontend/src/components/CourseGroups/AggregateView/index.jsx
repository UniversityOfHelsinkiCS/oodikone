import React, { Component, Fragment } from 'react'
import { Header, Segment, Icon, Button } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { func, shape, string } from 'prop-types'

import { getCompiledPath } from '../../../common'

import { callApi } from '../../../apiConnection'
import SortableTable from '../../SortableTable'
import CourseGroupAddTeacher from '../CourseGroupAddTeacher'
import CourseGroup from '../CourseGroup'

const getCourseGroupPath = (courseGroupId, studyProgrammeId) =>
  getCompiledPath('/study-programme/:studyProgrammeId/course-group/:courseGroupId', {
    courseGroupId,
    studyProgrammeId
  })

class AggregateView extends Component {
  state = {
    isLoading: true,
    editedCourseGroup: null,
    courseGroups: []
  }

  componentDidMount() {
    callApi(`/course-groups/programme/${this.props.programmeId}`)
      .then((res) => {
        this.setState({
          courseGroups: res.data,
          isLoading: false
        })
      }).catch(() => {
        this.setState({ courseGroups: [], isLoading: false })
      })
  }

  handleForceRefresh() {
    this.setState({ isLoading: true })
    callApi(`/course-groups/programme/${this.props.programmeId}/force`)
      .then((res) => {
        this.setState({
          courseGroups: res.data,
          isLoading: false
        })
      }).catch(() => {
        this.setState({ courseGroups: [], isLoading: false })
      })
  }

  handleNavigationCourseGroup = (e, courseGroupId, programmeId) => {
    e.preventDefault()
    this.props.history.push(getCourseGroupPath(courseGroupId, programmeId))
  }

  render() {
    const { isLoading, courseGroups, editedCourseGroup } = this.state
    const { programmeId, courseGroupId } = this.props

    const columns = [
      {
        key: 'Course group',
        title: 'Course group',
        getRowVal: cg => cg.name,
        getRowContent: courseGroup => (
          <Fragment>
            <a
              href={getCourseGroupPath(courseGroup.id, programmeId)}
              onClick={e => this.handleNavigationCourseGroup(e, courseGroup.id, programmeId)}
            >
              {courseGroup.name}
            </a>
          </Fragment>)
      },
      { key: 'Credits', title: 'Credits', getRowVal: cg => cg.credits },
      { key: 'Students', title: 'Students', getRowVal: cg => cg.students },
      {
        key: 'Edit',
        title: '',
        getRowVal: cg => <Icon name="edit" onClick={() => this.setState({ editedCourseGroup: cg.id })} link />,
        headerProps: { onClick: null, sorted: null },
        cellProps: { collapsing: true }
      }
    ]

    const renderViewCourseGroup = () => (
      <Fragment>
        <CourseGroup groupId={courseGroupId} studyProgrammeId={programmeId} />
      </Fragment>
    )

    const renderEditCourseGroup = () => (
      <Fragment>
        <Header size="medium">Edit group
          <Icon
            name="reply"
            onClick={() => this.setState({ editedCourseGroup: null })}
            link
          />
        </Header>
        <CourseGroupAddTeacher groupId={editedCourseGroup} />
      </Fragment>
    )

    const renderCourseGroups = () => (
      <Fragment>
        <Header size="medium">
          Group statistics
          <Button
            content="Recalculate"
            floated="right"
            size="small"
            style={{ marginBottom: '10px' }}
            onClick={() => { this.handleForceRefresh() }}
          />
        </Header>
        {courseGroups.length === 0 ?
          <Segment>No course groups defined</Segment>
          :
          <SortableTable
            getRowKey={gc => gc.id}
            tableProps={{ celled: false }}
            columns={columns}
            data={courseGroups}
          />
        }
      </Fragment>
    )

    return (
      <Segment loading={isLoading}>
        {courseGroupId && renderViewCourseGroup()}
        {editedCourseGroup && renderEditCourseGroup()}
        {!editedCourseGroup && !courseGroupId && renderCourseGroups()}
      </Segment>
    )
  }
}

AggregateView.propTypes = {
  history: shape({
    push: func.isRequired
  }).isRequired,
  programmeId: string.isRequired,
  courseGroupId: string
}

AggregateView.defaultProps = {
  courseGroupId: null
}

export default withRouter(AggregateView)
