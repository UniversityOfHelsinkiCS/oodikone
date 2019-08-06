import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Label, Header, Divider, Form } from 'semantic-ui-react'
import { shape, arrayOf, oneOfType, number, string } from 'prop-types'
import SingleCourseStats from '../SingleCourseStats'
import selectors from '../../../selectors/courseStats'

class SingleCourseTab extends Component {
  state = {
    selected: this.props.selected
  }

  getStats = () => {
    const { stats } = this.props
    const statistics = Object.values(stats)
    let { selected } = this.state
    if (!selected && statistics.length > 0) {
      selected = statistics[0].coursecode
    }
    return {
      selected,
      selectedStatistic: stats[selected]
    }
  }

  render() {
    const { selected, selectedStatistic } = this.getStats()
    const { courses } = this.props
    return (
      <div>
        <Segment>
          <Form>
            {courses ? courses.text : (
              <Form.Dropdown
                name="selected"
                options={courses}
                onChange={(e, { value }) => this.setState({ selected: value })}
                value={selected || courses.value}
              />
            )}
            <Divider />
            <Label.Group>
              <Label key={selectedStatistic.coursecode} content={`${selectedStatistic.alternatives.map(code => ` ${code}`)} ${selectedStatistic.name} `} />
            </Label.Group>
          </Form>
        </Segment>
        {selected && <SingleCourseStats stats={selectedStatistic} />}
      </div>
    )
  }
}

SingleCourseTab.propTypes = {
  stats: shape({}).isRequired,
  courses: arrayOf(shape({})).isRequired,
  selected: oneOfType([number, string])
}

SingleCourseTab.defaultProps = {
  selected: undefined
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

export default connect(mapStateToProps)(SingleCourseTab)
