import React, { Component } from 'react'
import { Header, Segment, Button } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { func, shape } from 'prop-types'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'

import { callApi } from '../../../apiConnection'

class AggregateView extends Component {
  state = {
    courseGroups: []
  }

  componentDidMount() {
    callApi('/courseGroups')
      .then((res) => {
        console.log(res.data)
        this.setState({ courseGroups: res.data })
      })
  }

  render() {
    const navigateToCourseGroup = courseGroupId =>
      this.props.history.push(getCompiledPath(routes.courseGroups.route, { courseGroupId }))

    return (
      <Segment>
        <Header size="medium">Group statistics</Header>
        <Button onClick={() => navigateToCourseGroup('groupId')}>navigation test</Button>
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
