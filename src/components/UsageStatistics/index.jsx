import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Header, Table, Icon } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'

import styles from '../StudentInfoCard/studentInfoCard.css'

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

    if (this.state.user) {
      const entries = this.state.all
        .filter(e => e.username === this.state.user)
        .sort((e1, e2) => e2.time - e1.time)

      const usersName = entries[0].name

      const toTime = (stamp) => {
        const zeroed = v => (v < 10 ? `0${v}` : v)

        const date = new Date(stamp * 1000)
        return `${date.getFullYear()}${zeroed(date.getUTCMonth() + 1)}${zeroed(date.getDate())} ${zeroed(date.getHours())}:${zeroed(date.getMinutes())}:${zeroed(date.getSeconds())}`
      }

      return (
        <div>
          <h3>
            {usersName} ({this.state.user})
            <Icon
              onClick={() => this.setState({ user: null })}
              name="remove"
              className={styles.controlIcon}
            />
          </h3>
          <Table celled>
            <Table.Body>
              {entries.map(entry => (
                <Table.Row key={entry.id}>
                  <Table.Cell>
                    {entry.method}
                  </Table.Cell>
                  <Table.Cell>
                    {entry.URL}
                  </Table.Cell>
                  <Table.Cell>
                    {toTime(entry.time)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )
    }

    return (
      <div>
        <h3>by user</h3>

        <Table celled>
          <Table.Body>
            {users.sort(byCount).map(user => (
              <Table.Row key={user.name}>
                <Table.Cell onClick={() => this.setState({ user: user.name })}>
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
