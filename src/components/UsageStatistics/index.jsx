import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Header, Table } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'

class UsageStatistics extends Component { //eslint-disable-line
  state = null

  componentWillMount() {
    callApi('/usage').then(({ data }) => {
      this.setState(data)
    })
  }

  renderStats() {
    if (this.state === null) {
      return null
    }

    const byCount = (x, y) => y.count - x.count

    const users = Object.keys(this.state.byUser).map(user => ({
      name: user,
      count: this.state.byUser[user].length
    }))

    const endpoints = Object.keys(this.state.byEndpoint).map(endpoint => ({
      name: endpoint,
      count: this.state.byEndpoint[endpoint].length
    }))

    return (
      <div>
        <h3>by user</h3>

        <Table celled>
          <Table.Body>
            {users.sort(byCount).map(user => (
              <Table.Row key={user.name}>
                <Table.Cell>
                  {user.name}
                </Table.Cell>
                <Table.Cell>
                  {user.count}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        <h3>by endpoint</h3>

        <Table celled>
          <Table.Body>
            {endpoints.sort(byCount).map(endpoint => (
              <Table.Row key={endpoint}>
                <Table.Cell>
                  {endpoint.name}
                </Table.Cell>
                <Table.Cell>
                  {endpoint.count}
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
