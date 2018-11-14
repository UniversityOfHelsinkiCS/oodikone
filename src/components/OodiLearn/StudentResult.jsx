import React, { Component } from 'react'
import { Message, Table, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { arrayOf, shape, string, func } from 'prop-types'

class StudentResult extends Component {
    state={}

    render() {
      const { profiles } = this.props
      if (profiles.length === 0) {
        return (<Message content="No results matched query" />)
      }
      return (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell content="Student number" />
              <Table.HeaderCell content="Name" />
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            { profiles.map(s => (
              <Table.Row key={s.studentnumber}>
                <Table.Cell content={s.studentnumber} />
                <Table.Cell content={s.name} />
                <Table.Cell width={1}>
                  <Button size="mini" icon="eye" circular onClick={() => this.props.onSelectStudent(s)} />
                </Table.Cell>
              </Table.Row>))}
          </Table.Body>
        </Table>
      )
    }
}

StudentResult.propTypes = {
  profiles: arrayOf(shape({
    studentnumber: string,
    profile: shape({})
  })).isRequired,
  onSelectStudent: func.isRequired
}

const mapStateToProps = ({ oodilearnStudent }) => ({
  profiles: oodilearnStudent.data
})

export default connect(mapStateToProps)(StudentResult)
