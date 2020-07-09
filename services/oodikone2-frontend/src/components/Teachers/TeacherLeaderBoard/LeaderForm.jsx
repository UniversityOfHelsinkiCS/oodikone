import React, { useEffect } from 'react'
import { Segment, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, string, any, number } from 'prop-types'
import { getTopTeachers } from '../../../redux/teachersTop'

const LeaderForm = ({
  selectedyear,
  selectedcategory,
  handleCategoryChange,
  handleYearChange,
  yearoptions,
  categoryoptions,
  updateAndSubmitForm
}) => {
  useEffect(() => {
    const [defaultyear = {}] = [
      yearoptions.find(year => Number(year.text.slice(0, 4)) === new Date().getFullYear() - 1)
    ]
    const [defaultcategory = {}] = categoryoptions

    const year = defaultyear.value
    const category = defaultcategory.value

    if (year && category) {
      updateAndSubmitForm({
        selectedyear: year,
        selectedcategory: category
      })
    }
  }, [])

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
            value={selectedyear}
            onChange={handleYearChange}
            selectOnBlur={false}
            selectOnNavigation={false}
          />
          <Form.Dropdown
            name="selectedcategory"
            label="Category"
            placeholder="Category"
            options={categoryoptions}
            selection
            search
            value={selectedcategory}
            onChange={handleCategoryChange}
            selectOnBlur={false}
            selectOnNavigation={false}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}

LeaderForm.propTypes = {
  yearoptions: arrayOf(shape({})).isRequired,
  categoryoptions: arrayOf(shape({ key: any, value: any, text: string })).isRequired,
  updateAndSubmitForm: func.isRequired,
  handleCategoryChange: func.isRequired,
  handleYearChange: func.isRequired,
  selectedcategory: string, // eslint-disable-line
  selectedyear: number // eslint-disable-line
}

export default connect(
  null,
  { getTopTeachers }
)(LeaderForm)
