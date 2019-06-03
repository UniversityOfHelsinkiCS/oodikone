import React, { Component } from 'react'
import { Segment, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, string, any, number } from 'prop-types'
import { getTopTeachers } from '../../redux/teachersTop'

class LeaderForm extends Component {
  componentDidMount() {
    const { year, category } = this.defaultValues()
    if (year && category) {
      this.props.updateAndSubmitForm({
        selectedyear: year,
        selectedcategory: category
      })
    }
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
              value={this.props.selectedyear}
              onChange={this.props.handleChange}
            />
            <Form.Dropdown
              name="selectedcategory"
              label="Category"
              placeholder="Category"
              options={categoryoptions}
              selection
              search
              value={this.props.selectedcategory}
              onChange={this.props.handleChange}
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
  updateAndSubmitForm: func.isRequired,
  handleChange: func.isRequired,
  selectedcategory: string, // eslint-disable-line
  selectedyear: number // eslint-disable-line
}

export default connect(null, { getTopTeachers })(LeaderForm)
