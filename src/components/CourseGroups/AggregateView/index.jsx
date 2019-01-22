import React, { Component, Fragment } from 'react'
import { Header, Segment } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { func, shape } from 'prop-types'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'

import { callApi } from '../../../apiConnection'
import SortableTable from '../../SortableTable'

const getCourseGroupPath = courseGroupId => getCompiledPath(routes.courseGroups.route, { courseGroupId })

class AggregateView extends Component {
  state = {
    isLoading: true,
    courseGroups: []
  }

  componentDidMount() {
    callApi('/course-groups')
      .then((res) => {
        this.setState({
          courseGroups: res.data,
          isLoading: false
        })
      })
  }

  handleNavigation = (e, courseGroupId) => {
    e.preventDefault()
    this.props.history.push(getCourseGroupPath(courseGroupId))
  }

  render() {
    const { isLoading, courseGroups } = this.state

    const columns = [
      {
        key: 'Course group',
        title: 'Course group',
        getRowVal: cg => cg.name,
        getRowContent: courseGroup => (
          <Fragment>
            <a
              href={getCourseGroupPath(courseGroup.id)}
              onClick={e => this.handleNavigation(e, courseGroup.id)}
            >
              {courseGroup.name}
            </a>
          </Fragment>)
      },
      { key: 'Credits', title: 'Credits', getRowVal: cg => cg.credits },
      { key: 'Students', title: 'Students', getRowVal: cg => cg.students }
    ]

    return (
      <Segment loading={isLoading}>
        <Header size="medium">Group statistics</Header>
        <SortableTable
          getRowKey={gc => gc.id}
          tableProps={{ celled: false, singleLine: true }}
          columns={columns}
          data={courseGroups}
        />
      </Segment>
    )
  }
}

AggregateView.propTypes = {
  history: shape({
    push: func.isRequired
  }).isRequired
}

export default withRouter(AggregateView)
