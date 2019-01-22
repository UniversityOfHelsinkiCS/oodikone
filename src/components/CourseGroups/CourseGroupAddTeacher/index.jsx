import React, { Component, Fragment } from 'react'
import { Header, Segment, Icon } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { func, shape, string } from 'prop-types'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'

import { callApi } from '../../../apiConnection'
import SortableTable from '../../SortableTable'
import TeacherSearch from '../../TeacherSearch'

class CourseGroupAddTeacher extends Component {
  state = {
    courseGroup: undefined,
    isLoading: true
  }

  componentDidMount() {
    callApi(`/course-groups/${this.props.groupId}`)
      .then((res) => {
        this.setState({
          courseGroup: res.data,
          isLoading: false
        })
      })
  }

  render() {
    const { isLoading, courseGroup } = this.state
    const { history } = this.props

    const columns = [
      { key: 'Teacher ID', title: 'Teacher ID', getRowVal: t => t.id },
      { key: 'Username', title: 'Username', getRowVal: t => t.code },
      { key: 'Name', title: 'Name', getRowVal: t => t.name },
      {
        key: 'Remove',
        title: 'Remove',
        getRowVal: () => '',
        getCellProps: t => ({
          collapsing: true,
          icon: <Icon
            name="remove user"
            link
            onClick={
              () => {
                this.setState({ isLoading: true })
                callApi(`/course-groups/${this.props.groupId}/remove/${t.id}`, 'post')
                  .then(() => {
                    callApi(`/course-groups/${this.props.groupId}`)
                    .then((res) => {
                      this.setState({
                        courseGroup: res.data,
                        isLoading: false
                      })
                    })
                  })
              }
            }
          />,
          textAlign: 'center'
        }),
        headerProps: { onClick: null, sorted: null }
      }
    ]

    return (
      <Segment loading={isLoading}>
        {!courseGroup ? null : (
          <Fragment>
            <Header size="large">
              {courseGroup.name}
              <Icon
                name="reply"
                onClick={() => history.push(getCompiledPath(routes.courseGroups.route, {}))}
                link
              />
            </Header>
            <Segment>
              <Header size="medium">Add teacher</Header>
              <TeacherSearch
                icon="add user"
                onClick={
                  (t) => {
                    this.setState({ isLoading: true })
                    callApi(`/course-groups/${this.props.groupId}/add/${t.id}`, 'post')
                      .then(() => {
                        callApi(`/course-groups/${this.props.groupId}`)
                        .then((res) => {
                          this.setState({
                            courseGroup: res.data,
                            isLoading: false
                          })
                        })
                      })
                  }
                }
              />
            </Segment>
            <Segment>
              <Header size="medium">Teachers in group</Header>
              <SortableTable
                getRowKey={gc => gc.id}
                columns={columns}
                data={courseGroup.teachers}
              />
            </Segment>
          </Fragment>
        )}
      </Segment>
    )
  }
}

CourseGroupAddTeacher.propTypes = {
  history: shape({
    push: func.isRequired
  }).isRequired,
  groupId: string.isRequired
}

export default withRouter(CourseGroupAddTeacher)
