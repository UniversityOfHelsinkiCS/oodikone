import React, { Component } from 'react'
import CourseSearch from './CourseSearch'
import CoursePage from './CoursePage'

class Course extends Component {
    state={
      selected: undefined
    }

    setSelected = (coursecode) => {
      this.setState({
        selected: coursecode
      })
    }

    render() {
      return this.state.selected
        ? <CoursePage course={this.state.selected} goBack={() => this.setSelected(undefined)} />
        : <CourseSearch onClickResult={this.setSelected} />
    }
}

export default Course
