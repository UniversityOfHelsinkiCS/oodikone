import React, { Component } from 'react'
import { Button, Grid, Divider } from 'semantic-ui-react'
import { callApi } from '../../apiConnection'

class SuggestCourseGraph extends Component {
  state = {
    courses: [{ TKT10001: true, TKT10002: false }]
  }

  componentDidMount() {
    this.setState({
      courses: [{ TKT10001: true, TKT10002: false }]
    })
  }

  generateWholeRoute = () => {
    callApi('/oodilearn/suggest_route')
      .then((res) => {
        const { data } = res
        const route = []
        data.forEach((course) => {
          const item = course.split('_')
          if (item.length > 1) {
            const period = item[0]
            const code = item[1]
            route[period] = { ...route[period], [code]: true }
          }
        })
        this.setState({ courses: route })
      })
  }

  handleClick = (e, { value }) => {
    const courses = this.state.courses.slice(0, value + 1)
    const doneCourses = []
    courses.forEach((period) => {
      const c = Object.keys(period).filter(course => period[course])
      doneCourses.push(...c)
    })
    callApi('/oodilearn/suggest_course', 'get', null, { doneCourses, period: 274 })
      .then((res) => {
        const { data } = res
        const newCourses = {}
        data.forEach((course) => {
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
    if (!this.state.courses) return <h1>hello</h1>
    return (
      <Grid padded="vertically">
        <Grid.Row>
          <Grid.Column>
            <Button onClick={this.generateWholeRoute}>generate route</Button>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          {this.state.courses.map((period, i) => (
            <Grid.Column width={2} style={{ paddingBottom: '1em' }}>
              <Button
                fluid
                size="tiny"
                color="blue"
                content="next"
                value={i}
                onClick={this.handleClick}
              />
              <Divider />
              {Object.keys(period).map(course => (
                <Button
                  fluid
                  size="tiny"
                  key={course}
                  basic={!period[course]}
                  value={`${i}_${course}`}
                  onClick={this.selectCourse}
                  content={course}
                />
                ))}
            </Grid.Column>
          ))}
        </Grid.Row>
      </Grid>
    )
  }
}

export default SuggestCourseGraph
