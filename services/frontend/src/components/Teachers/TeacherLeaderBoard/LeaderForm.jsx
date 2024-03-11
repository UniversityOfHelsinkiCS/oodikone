import { func, arrayOf, shape, string, any, number } from 'prop-types'
import React, { useEffect } from 'react'
import { Segment, Form } from 'semantic-ui-react'

const currentYear = () => {
  const now = new Date()
  const year = now.getFullYear()

  return now.getMonth() > 7 ? year : year - 1
}

export const LeaderForm = ({
  selectedyear,
  selectedcategory,
  handleCategoryChange,
  handleYearChange,
  yearoptions,
  categoryoptions,
  initLeaderboard,
}) => {
  useEffect(() => {
    const [defaultyear = {}] = [yearoptions.find(year => Number(year.text.slice(0, 4)) === currentYear())]
    const [defaultcategory = {}] = categoryoptions

    const year = defaultyear.value
    const category = defaultcategory.value

    if (year && category) {
      initLeaderboard(year, category)
    }
  }, [])

  return (
    <Segment>
      <Form>
        <Form.Group widths="equal">
          <Form.Dropdown
            label="Academic year"
            name="selectedyear"
            onChange={handleYearChange}
            options={yearoptions}
            placeholder="Academic year"
            search
            selectOnBlur={false}
            selectOnNavigation={false}
            selection
            value={selectedyear}
          />
          <Form.Dropdown
            label="Category"
            name="selectedcategory"
            onChange={handleCategoryChange}
            options={categoryoptions}
            placeholder="Category"
            search
            selectOnBlur={false}
            selectOnNavigation={false}
            selection
            value={selectedcategory}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}

LeaderForm.propTypes = {
  yearoptions: arrayOf(shape({})).isRequired,
  categoryoptions: arrayOf(shape({ key: any, value: any, text: string })).isRequired,
  initLeaderboard: func.isRequired,
  handleCategoryChange: func.isRequired,
  handleYearChange: func.isRequired,
  selectedcategory: string, // eslint-disable-line
  selectedyear: number, // eslint-disable-line
}
