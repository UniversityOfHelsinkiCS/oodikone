import React, { Component } from 'react'
import { Button, Progress } from 'semantic-ui-react'
import { createConfiguredAxios } from '../../apiConnection'
import KeyValueTable from '../Postman/KeyValueTable'

const TASK_URL = '/tasks/topteachers'
const STREAM_URL = '/api/status/topteachers'

class UpdateTopTeachers extends Component {
  state={
    status: undefined,
    progress: undefined,
    computing: false
  }

  componentDidMount() {
    this.checkStatus()
    const eventSource = new EventSource(STREAM_URL)
    eventSource.onmessage = ({ data }) => {
      const { progress, computing, ...rest } = JSON.parse(data)
      this.setState({ status: rest, progress, computing })
    }
  }

  checkStatus = async () => {
    const axios = await createConfiguredAxios()
    const { data } = await axios.get(TASK_URL)
    const { progress, computing, ...rest } = data
    this.setState({ status: rest, progress, computing })
  }

  doUpdate = async () => {
    this.setState({ computing: true, progress: 0 })
    const axios = await createConfiguredAxios()
    await axios.post(TASK_URL)
    await this.checkStatus()
  }

  render() {
    const { status, computing, progress } = this.state
    return (
      <React.Fragment>
        <Button
          fluid
          content="Update Top Teachers"
          icon="refresh"
          onClick={this.doUpdate}
          loading={computing}
          disabled={computing}
        />
        { status && <KeyValueTable data={status} /> }
        { !!computing && <Progress autoSuccess active={computing} percent={progress} />}
      </React.Fragment>
    )
  }
}

export default UpdateTopTeachers
