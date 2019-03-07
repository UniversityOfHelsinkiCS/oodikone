import React, { Component } from 'react'
import { Input, Button } from 'semantic-ui-react'
import KeyValueTable from './KeyValueTable'
import { createConfiguredAxios } from '../../apiConnection'

class Postman extends Component {
    state={
      route: '',
      data: {},
      pending: false
    }

    doRequest = async () => {
      const axios = await createConfiguredAxios()
      this.setState({ pending: true })
      const { status, data } = await axios.get(this.state.route)
      this.setState({ data: { status, data }, pending: false })
    }

    dataToConsole = () => {
      /* eslint-disable-next-line react/prop-types */
      console.log(this.state.data)
    }

    render() {
      const { data, pending } = this.state
      return (
        <div>
          <Input
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
          <KeyValueTable data={{ pending, ...data }} />
          <Button fluid primary content="Data2Console" onClick={this.dataToConsole} />
        </div>
      )
    }
}

export default Postman
