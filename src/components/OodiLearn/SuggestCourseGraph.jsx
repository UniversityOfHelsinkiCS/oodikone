import React, { Component } from 'react'
// import { connect } from 'react-redux'
import { Button, Dropdown, Grid, Segment, Card, Divider, Menu, Placeholder } from 'semantic-ui-react'
import { func, shape, bool, string, arrayOf } from 'prop-types'
import { callApi } from '../../apiConnection'

const OlPlaceholder = () => (
  <Placeholder>
    <Placeholder.Header>
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder.Header>
  </Placeholder>
)

class SuggestCourseGraph extends Component {
  state = {
    courses: [{ TKT10001: true, TKT10002: false }]
  }

  componentDidMount() {
    this.setState({
      courses: [{ TKT10001: true, TKT10002: false }]
    })
    // axios.get('/oodilearn/suggest_course')
  }

  handleClick = (e, { value }) => {
    const courses = this.state.courses.slice(0, value + 1)
    const doneCourses = []
    courses.map((period) => {
      const c = Object.keys(period).filter(course => period[course])
      doneCourses.push(...c)
    })
    callApi('/oodilearn/suggest_course', 'get', null, { doneCourses, period: 274 })
      .then((res) => {
        const { data } = res
        const newCourses = {}
        data.map((course) => {
          newCourses[course] = false
        })
        courses.push(newCourses)
        this.setState({ courses })
      })
  }

  selectCourse = (e, { value }) => {
    const courses = [...this.state.courses]
    const period = value.split('_')[0]
    const course = value.split('_')[1]
    courses[period][course] = !courses[period][course]
    this.setState({ courses })
  }

  render() {
    // console.log(this.state)
    if (!this.state.courses) return <h1>hello</h1>
    return (
      <Grid columns={16}>
        <Grid.Row>
          {this.state.courses.map((period, i) => (
            <Grid.Column width={2}>
              <Segment>
                <Button color="blue" content="next" value={i} onClick={this.handleClick} />
                <Divider />
                {Object.keys(period).map(course => <Button basic={!period[course]} value={`${i}_${course}`} onClick={this.selectCourse}>{course}</Button>)}
              </Segment>
            </Grid.Column>
          ))}
        </Grid.Row>
      </Grid>
    )
  }
}

// SuggestCourseGraph.propTypes = {
//   goBack: func.isRequired,
//   getOodiLearnCourse: func.isRequired,
//   getOodiLearnCluster: func.isRequired,
//   loading: bool.isRequired,
//   course: string.isRequired,
//   data: shape({}),
//   clusterData: arrayOf(shape({}))
// }

// SuggestCourseGraph.defaultProps = {
//   data: undefined,
//   clusterData: undefined
// }

export default SuggestCourseGraph
