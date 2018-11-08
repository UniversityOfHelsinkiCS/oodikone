import React, { Component } from 'react'
import { Segment, Card, Button, Divider } from 'semantic-ui-react'
import { shape, string, func } from 'prop-types'
import ProfileSpiderGraph from './ProfileSpiderGraph'

class SearchResult extends Component {
    state={}

    render() {
      const { student, goBack } = this.props
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
            header="Opiskelijan Nimi" // {student.name}
            meta={student.studentnumber}
          />
          <Segment>
            <ProfileSpiderGraph profile={student.profile} />
          </Segment>
        </Segment>
      )
    }
}

SearchResult.propTypes = {
  student: shape({
    studentnumber: string,
    profile: shape({})
  }).isRequired,
  goBack: func.isRequired
}

export default SearchResult
