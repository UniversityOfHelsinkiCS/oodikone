import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Header, Table } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'

class UsageStatistics extends Component { //eslint-disable-line
  state = null

  componentWillMount() {
    console.log('wtf')
    callApi('/usage').then(({ data }) => {
      this.setState(data)
    })
  }

  renderStats() {
    if (this.state === null) {
      return null
    }

    return (
      <div>
        <h3>by endpoint</h3>

        <Table celled>
          <Table.Body>
            {Object.keys(this.state.byEndpoint).map(endpoint => (
              <Table.Row key={endpoint}>
                <Table.Cell>
                  {endpoint}
                </Table.Cell>
                <Table.Cell>
                  {this.state.byEndpoint[endpoint].length}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        <h3>by user</h3>

        <Table celled>
          <Table.Body>
            {Object.keys(this.state.byUser).map(user => (
              <Table.Row key={user}>
                <Table.Cell>
                  {user}
                </Table.Cell>
                <Table.Cell>
                  {this.state.byUser[user].length}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    )
  }

  render() {
    return (
      <div>
        <Container text style={{ paddingTop: 50 }}>
          <Header as="h1" textAlign="center">Usage statistics</Header>
          {this.renderStats()}
        </Container>
      </div>
    )
  }
}
export default connect()(UsageStatistics)
