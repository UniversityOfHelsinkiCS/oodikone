import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Segment, Label, Header, Divider, Form } from 'semantic-ui-react'
import { shape, arrayOf, oneOfType, number, string } from 'prop-types'
import SingleCourseStats from '../SingleCourseStats'
import selectors from '../../../selectors/courseStats'

const SingleCourseTab = ({ selected, stats, courses }) => {
  const [selection, setSelection] = useState(selected)

  useEffect(() => {
    setSelection(selected)
  }, [selected])

  if (!stats[selection]) return null
  return (
    <div>
      <Segment>
        <Form>
          {courses ? (
            courses.text
          ) : (
            <Form.Dropdown
              name="selected"
              options={courses}
              onChange={(e, { value }) => setSelection(value)}
              value={selection || courses.value}
              selectOnBlur={false}
              selectOnNavigation={false}
            />
          )}
          <Divider />
          <Label.Group>
            <Label
              key={stats[selection].coursecode}
              content={`${stats[selection].alternatives.map(code => ` ${code}`)} ${stats[selection].name} `}
            />
          </Label.Group>
        </Form>
      </Segment>
      {selection && <SingleCourseStats stats={stats[selection]} />}
    </div>
  )
}

SingleCourseTab.propTypes = {
  stats: shape({}).isRequired,
  courses: arrayOf(shape({})).isRequired,
  selected: oneOfType([number, string]).isRequired
}

const mapStateToProps = state => ({
  stats: selectors.getCourseStats(state),
  courses: selectors.getCourses(state).map(({ code, name }) => ({
    key: code,
    value: code,
    text: <Header content={name} />,
    content: name
  }))
})

export default connect(
  mapStateToProps,
  {}
)(SingleCourseTab)
