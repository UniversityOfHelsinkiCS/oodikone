import React, { Component } from 'react'
import { Segment, Form } from 'semantic-ui-react'
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
    this.props.getTopTeachers(value)
  }

  render() {
    const { yearoptions } = this.props
    return (
      <Segment>
        <Form>
          <Form.Dropdown
            label="Academic year"
            placeholder="Academic year"
            options={yearoptions}
            selection
            search
            value={this.state.selected}
            onChange={this.handleChange}
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
