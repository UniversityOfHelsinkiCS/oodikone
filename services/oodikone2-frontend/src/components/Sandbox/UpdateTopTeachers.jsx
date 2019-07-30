import React, { Component } from 'react'
import { Button, Progress, Message } from 'semantic-ui-react'
import { api } from '../../apiConnection'
import KeyValueTable from '../Postman/KeyValueTable'
import { updatePopulationOldestStudents } from '../../redux/populations'

const TASK_URL = '/tasks/topteachers'

class UpdateTopTeachers extends Component {
  state={
    status: undefined,
    progress: undefined,
    computing: false,
    fetching: false,
    error: undefined
  }

  componentDidMount() {
    this.checkStatus()
  }

  checkStatus = async () => {
    this.setState({ fetching: true })
    try {
      const { data } = await api.get(TASK_URL)
      const { progress, computing, ...rest } = data
      this.setState({ status: rest, progress, computing })
    } catch (error) {
      this.setState({ error })
    }
    this.setState({ fetching: false })
  }

  doUpdate = async () => {
    this.setState({ computing: true, progress: 0 })
    await api.post(TASK_URL)
    await this.checkStatus()
  }

  render() {
    const { status, computing, progress, fetching, error } = this.state
    return (
      <React.Fragment>
        { error && <Message error content={error} /> }
        <Button.Group fluid widths="8">
          <Button
            content="Update Top Teachers"
            icon="refresh"
            onClick={this.doUpdate}
            disabled={computing}
          />
          <Button
            content="Check Status"
            icon="clock outline"
            onClick={this.checkStatus}
            loading={fetching}
          />
          <Button
            content="Update 2000 oldest students"
            icon="refresh"
            onClick={() => updatePopulationOldestStudents(2000)}
          />
        </Button.Group>
        { status && <KeyValueTable data={status} /> }
        { !!computing && <Progress autoSuccess active={computing} percent={progress} />}
      </React.Fragment>
    )
  }
}

export default UpdateTopTeachers
