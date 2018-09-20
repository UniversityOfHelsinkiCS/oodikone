import React, { Component } from 'react'
import { Segment, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, string, any } from 'prop-types'
import { getTopTeachers } from '../../redux/teachersTop'

class LeaderForm extends Component {
  state={
    selectedyear: null,
    selectedcategory: null
  }

  componentDidMount() {
    const { year, category } = this.defaultValues()
    if (year && category) {
      this.updateAndSubmitForm({
        selectedyear: year,
        selectedcategory: category
      })
    }
  }

  updateAndSubmitForm = (args) => {
    this.setState(args)
    const { selectedyear, selectedcategory } = { ...this.state, ...args }
    this.props.getTopTeachers(selectedyear, selectedcategory)
  }

  defaultValues = () => {
    const { yearoptions, categoryoptions } = this.props
    const [defaultyear = {}] = yearoptions
    const [defaultcategory = {}] = categoryoptions
    return {
      year: defaultyear.value,
      category: defaultcategory.value
    }
  }

  handleChange = (e, { value, name }) => this.updateAndSubmitForm({ [name]: value })

  render() {
    const { yearoptions, categoryoptions } = this.props
    return (
      <Segment>
        <Form>
          <Form.Group widths="equal">
            <Form.Dropdown
              name="selectedyear"
              label="Academic year"
              placeholder="Academic year"
              options={yearoptions}
              selection
              search
              value={this.state.selectedyear}
              onChange={this.handleChange}
            />
            <Form.Dropdown
              name="selectedcategory"
              label="Category"
              placeholder="Category"
              options={categoryoptions}
              selection
              search
              value={this.state.selectedcategory}
              onChange={this.handleChange}
            />
          </Form.Group>
        </Form>
      </Segment>
    )
  }
}

LeaderForm.propTypes = {
  yearoptions: arrayOf(shape({})).isRequired,
  categoryoptions: arrayOf(shape({ key: any, value: any, text: string })).isRequired,
  getTopTeachers: func.isRequired
}

export default connect(null, { getTopTeachers })(LeaderForm)
