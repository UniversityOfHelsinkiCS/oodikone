import React from 'react'
import { Header, Segment, Button } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { func, shape } from 'prop-types'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'


const AggregateView = ({ history }) => {
  const navigateToCourseGroup = courseGroupId =>
    history.push(getCompiledPath(routes.courseGroups.route, { courseGroupId }))

  return (
    <Segment>
      <Header size="medium">Group statistics</Header>
      <Button onClick={() => navigateToCourseGroup('groupId')}>navigation test</Button>
    </Segment>
  )
}

AggregateView.propTypes = {
  history: shape({
    push: func.isRequired
  }).isRequired
}

export default withRouter(AggregateView)
