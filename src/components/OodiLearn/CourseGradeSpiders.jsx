import React, { Component } from 'react'
import { Grid, Message, Form, Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf, string } from 'prop-types'
import SpiderGraph from './ProfileSpiderGraph'
import ProfileTable from './ProfileTable'
import CourseGradeGraph from './CourseGradeGraph'
import selector from '../../selectors/oodilearn'

const DESCRIPTION = `
Interactively explore how the profiles of students who have
received a specific grade from this course average across the
different dimensions of their learner profiles.
`

class CourseGradeSpiders extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selected: this.props.categories[0],
      profile: this.props.profiles[this.props.categories[0]]
    }
  }

  setGradeCategory = (selected) => {
    const { profiles } = this.props
    this.setState({ selected, profile: profiles[selected] })
  }

  handleChange = (event, { value }) => {
    event.preventDefault()
    this.setGradeCategory(value)
  }

  render() {
    const { categories, series, options } = this.props
    const { selected, profile } = this.state
    return (
      <Grid centered textAlign="center">
        <Grid.Row>
          <Grid.Column>
            <Message
              header="Average profile dimensions per course grade"
              content={DESCRIPTION}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={6}>
            <Form>
              <Form.Group inline>
                <Form.Field>
                  <label>Grade</label>
                  <Dropdown
                    selection
                    onChange={this.handleChange}
                    options={options}
                    value={selected}
                  />
                </Form.Field>
              </Form.Group>
            </Form>
            <ProfileTable
              series={series}
              categories={categories}
              selected={selected}
            />
          </Grid.Column>
          <Grid.Column width={10}>
            <SpiderGraph profile={profile} title={null} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <CourseGradeGraph
              categories={categories}
              series={series}
              selected={selected}
              onClickCategory={this.setGradeCategory}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}
CourseGradeSpiders.propTypes = {
  categories: arrayOf(string).isRequired,
  series: arrayOf(shape({})).isRequired,
  profiles: shape({}).isRequired,
  options: arrayOf(shape({})).isRequired
}

const mapStateToProps = (state) => {
  const { categories, series, profiles } = selector.courseProfileSeries(state)
  return {
    categories,
    series,
    profiles,
    options: categories.map(c => ({ text: c, value: c }))
  }
}

export default connect(mapStateToProps)(CourseGradeSpiders)
