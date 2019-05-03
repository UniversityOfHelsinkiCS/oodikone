import React, { Component } from 'react'
import { Header, Button, Message } from 'semantic-ui-react'
import CourseCodeMapper from '../CourseCodeMapper'

class Settings extends Component {
  state = {
    selected: 1
  }

  getSetting = () => {
    if (this.state.selected === 0) {
      return <Header>None</Header>
    } else if (this.state.selected === 1) {
      return <CourseCodeMapper />
    }
    return []
  }

  select = (which) => {
    this.setState({ selected: which })
  }

  render() {
    const selectedComponent = this.getSetting()
    return (
      <div className="segmentContainer" >
        <Message content="Visible only for admins for now" />
        <Header className="segmentTitle" size="large">Settings</Header>
        <Button.Group >
          <Button onClick={() => this.select(1)}>Course code Mapping</Button>
        </Button.Group>
        {selectedComponent}
      </div>
    )
  }
}

export default Settings
