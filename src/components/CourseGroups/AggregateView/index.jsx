import React, { Component } from 'react'
import { Header, Segment, Table } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { func, shape } from 'prop-types'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'

import { callApi } from '../../../apiConnection'

const getCourseGroupPath = courseGroupId => getCompiledPath(routes.courseGroups.route, { courseGroupId })

class AggregateView extends Component {
  state = {
    isLoading: true,
    courseGroups: []
  }

  componentDidMount() {
    callApi('/courseGroups')
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

    return (
      <Segment loading={isLoading}>
        <Header size="medium">Group statistics</Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell content="Course group" />
              <Table.HeaderCell content="Credits" />
              <Table.HeaderCell content="Students" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {courseGroups.map(courseGroup => (
              <Table.Row key={courseGroup.id}>
                <Table.Cell>
                  <a
                    href={getCourseGroupPath(courseGroup.id)}
                    onClick={e => this.handleNavigation(e, courseGroup.id)}
                  >
                    {courseGroup.name}
                  </a>
                </Table.Cell>
                <Table.Cell content={courseGroup.credits} />
                <Table.Cell content={courseGroup.students} />
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
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
