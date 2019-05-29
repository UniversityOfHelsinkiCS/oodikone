import React, { Component } from 'react'
import { Button, Icon, Modal, Form, TextArea } from 'semantic-ui-react'

class CheckStudentList extends Component {
  state = { modalOpen: false, list: '' }

  checkStudents = (list) => {
    console.log(list)

    // const snums = this.props.map(s => s.studentNumber)
    // console.log(this.props)
    // console.log(list.filter(a => !snums.includes(a)))
  }

  renderSomethingElse() {
    return (
      <Modal trigger={<Button>Multiple Modals</Button>}>
        <Modal.Header>Modal #1</Modal.Header>
        <Modal.Content>
          <Form>
            <h2> Check for studentnumbers </h2>
            <Form.Field>
              <em> Insert studentnumbers you wish to check here </em>
              <TextArea placeholder="011111111" onChange={e => this.setState({ list: e.target.value })} />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            negative
            onClick={() => this.setState({ modalOpen: false })}
          >Cancel
          </Button>
          <Button
            color="green"
            onClick={() => {
              this.checkStudents(this.state.list)
              this.setState({ modalOpen: false })
            }}
            inverted
          >
            <Icon name="checkmark" /> Check
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }

  render() {
    return (
      <Modal
        trigger={<Button size="small" onClick={() => this.setState({ modalOpen: true })}>Check studentnumbers</Button>}
        open={this.state.modalOpen}
        onClose={() => this.setState({ modalOpen: false })}
        size="small"
      >
        <Modal.Content>
          <Form>
            <h2> Check for studentnumbers </h2>
            <Form.Field>
              <em> Insert studentnumbers you wish to check here </em>
              <TextArea placeholder="011111111" onChange={e => this.setState({ list: e.target.value })} />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            negative
            onClick={() => this.setState({ modalOpen: false })}
          >Cancel
          </Button>
          <Button
            disabled={this.state.presetName === ''}
            color="green"
            onClick={() => {
              this.checkStudents(this.state.list)
              this.setState({ modalOpen: false })
            }}
            inverted
          >
            <Icon name="checkmark" /> Check
          </Button>
          {this.renderSomethingElse()}
        </Modal.Actions>
      </Modal>
    )
  }
}

export default CheckStudentList
