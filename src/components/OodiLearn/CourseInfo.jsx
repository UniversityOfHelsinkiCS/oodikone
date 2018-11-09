import React, { Component } from 'react'
import { Segment, Card, Button, Divider } from 'semantic-ui-react'
import { string, func } from 'prop-types'
import ClusterGraph from './ClusterGraph'

class CourseInfo extends Component {
    state={}

    render() {
      const { course, goBack } = this.props
      return (
        <Segment basic>
          <Button
            icon="arrow circle left"
            basic
            content="Back"
            size="small"
            onClick={goBack}
          />
          <Divider />
          <Card
            fluid
            header={course}
          />
          <Segment>
            <ClusterGraph profile={{}} />
          </Segment>
        </Segment>
      )
    }
}

CourseInfo.propTypes = {
  goBack: func.isRequired
}

export default CourseInfo
