import React, { Component } from 'react'
import { arrayOf, object } from 'prop-types'
import { Button, Icon, Modal, Form, TextArea } from 'semantic-ui-react'

class CheckStudentList extends Component {
  state = { modalOpen: false, input: '', notInOodiRows: [], notInListRows: [] }

  checkStudents = (input) => {
    const formattedInput = input.split('\n')
    const { students } = this.props
    const snums = students.map(s => s.studentNumber)
    const notFound = formattedInput.filter(a => !snums.includes(a))
    const notInList = snums.filter(a => !formattedInput.includes(a))
    console.log(notFound)
    console.log(notInList)
    this.setState({
      notInOodiRows: notFound.map(a => <div key={a}>{a}</div>),
      notInListRows: notInList.map(a => <div key={a}>{a}</div>)
    })
    console.log(this.state.notInListRows)
  }

  renderResults() {
    return (
      <Modal trigger={<Button color="green" onClick={() => this.checkStudents(this.state.input)}>Multiple Modals</Button>}>
        <Modal.Content>
          <Form>
            <h2> under construction </h2>
            {this.state.notInOodiRows.length > 0 ? (<div>student numbers in list not in oodi {this.state.notInOodiRows}</div>) : (<div>all numbers in oodi</div>)}
            {this.state.notInListRows.lenght > 0 ? (<div> student numbers in oodi but not in list {this.state.notInListRows}</div>) : (<div>all numbers in list</div>)}
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
              <TextArea placeholder="011111111" onChange={e => this.setState({ input: e.target.value })} />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            negative
            onClick={() => this.setState({ modalOpen: false })}
          >Cancel
          </Button>
          {this.renderResults()}
        </Modal.Actions>
      </Modal>
    )
  }
}

CheckStudentList.propTypes = {
  students: arrayOf(object).isRequired
}

export default CheckStudentList
