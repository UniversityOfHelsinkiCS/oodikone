import React, { Component } from 'react'
import { Button, Form } from 'semantic-ui-react'
import KeyValueTable from './KeyValueTable'
import { api } from '../../apiConnection'

class Postman extends Component {
    state={
      route: '',
      secret: '',
      data: {},
      useOodi: false,
      pending: false
    }

    doOodiApiRequest = async () => {
      const { route, secret } = this.state
      const headers = { 'x-oodi-secret': secret }
      const { status, data } = await api.post('/oodi', { route }, { headers })
      this.setState({ data: { status, data }, pending: false })
    }

    doBackendRequest = async () => {
      const { status, data } = await api.get(this.state.route)
      this.setState({ data: { status, data }, pending: false })
    }

    doRequest = async () => {
      const { useOodi } = this.state
      this.setState({ pending: true })
      try {
        if (useOodi) {
          await this.doOodiApiRequest()
        } else {
          this.doBackendRequest()
        }
      } catch (error) {
        this.setState({
          pending: false,
          data: { error: true, ...error }
        })
      }
    }

    dataToConsole = () => {
      /* eslint-disable-next-line react/prop-types */
      console.log(this.state.data)
    }

    downloadJSON = () => {
      const { data } = this.state
      if (Object.keys(data).length > 0) {
        return `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))})`
      }
      return null
    }

    render() {
      const { data, pending, useOodi } = this.state
      const downloadJSON = this.downloadJSON()
      return (
        <div>
          <Form>
            <Form.Input
              fluid
              value={this.state.route}
              onChange={(_, { value: route }) => this.setState({ route })}
              placeholder="Make GET request to API"
              action={
                <Button
                  content="GET"
                  icon="send"
                  onClick={this.doRequest}
                />
              }
            />
            <Form.Input
              fluid
              placeholder="Oodi API secret"
              value={this.state.secret}
              onChange={(_, { value: secret }) => this.setState({ secret })}
              action={
                <Button
                  basic
                  color={useOodi ? 'green' : 'grey'}
                  icon={useOodi ? 'check circle outline' : 'times circle outline'}
                  onClick={() => this.setState({ useOodi: !useOodi })}
                />
              }
            />
            <KeyValueTable data={{ pending, ...data }} />
            <Form.Group>
              { downloadJSON && (
                <Button fluid>
                  <a href={`data:${downloadJSON}`} download="data.json">Download JSON</a>
                </Button>)
              }
              <Button fluid primary content="Data2Console" onClick={this.dataToConsole} />
            </Form.Group>
          </Form>
        </div>
      )
    }
}

export default Postman
