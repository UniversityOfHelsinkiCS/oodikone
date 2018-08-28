import React, { Component } from 'react'
import { Segment, Form, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, shape } from 'prop-types'
import { getTopTeachers } from '../../redux/teachersTop'

class LeaderForm extends Component {
  state={
    selected: null
  }

  componentDidMount() {
    const { yearoptions } = this.props
    if (yearoptions.length > 0) {
      const { value } = yearoptions[0]
      this.setState({
        selected: value
      })
      this.props.getTopTeachers(value)
    }
  }

  handleChange = (_, { value }) => {
    this.setState({ selected: value })
  }

  handleSubmit = () => {
    const { selected } = this.state
    this.props.getTopTeachers(selected)
  }

  render() {
    const { yearoptions } = this.props
    return (
      <Segment>
        <Form>
          <Form.Dropdown
            placeholder="Academic year"
            options={yearoptions}
            selection
            search
            value={this.state.selected}
            onChange={this.handleChange}
          />
          <Button
            fluid
            content="Search"
            onClick={this.handleSubmit}
          />
        </Form>
      </Segment>
    )
  }
}

LeaderForm.propTypes = {
  yearoptions: arrayOf(shape({})).isRequired,
  getTopTeachers: func.isRequired
}

export default connect(null, { getTopTeachers })(LeaderForm)
