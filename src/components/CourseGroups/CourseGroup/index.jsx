import React, { Component } from 'react'
import { Segment, Header, Button } from 'semantic-ui-react'
import { string, func, shape } from 'prop-types'
import { withRouter } from 'react-router'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'

import styles from './courseGroup.css'

class CourseGroup extends Component {
  static propTypes = {
    groupId: string.isRequired,
    history: shape({
      push: func.isRequired
    }).isRequired
  }

  state = {}

  render() {
    const { groupId, history } = this.props
    const navigateTo = route => history.push(getCompiledPath(route, {}))
    return (
      <Segment>
        <Header size="medium" className={styles.courseGroupHeader}>
          {groupId}
          <Button
            icon="reply"
            onClick={() => navigateTo(routes.courseGroups.route)}
            className={styles.returnIconButton}
          />
        </Header>
      </Segment>
    )
  }
}

export default withRouter(CourseGroup)
