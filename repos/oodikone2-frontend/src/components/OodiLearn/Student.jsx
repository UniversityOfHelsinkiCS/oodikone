import React, { Component } from 'react'
import StudentSearch from './StudentSearch'
import StudentInfo from './StudentInfo'

class Student extends Component {
    state={
      selected: undefined
    }

    setSelected = (student) => {
      this.setState({
        selected: student
      })
    }

    clearSelected = () => this.setState({ selected: undefined })

    render() {
      return this.state.selected
        ? <StudentInfo student={this.state.selected} goBack={this.clearSelected} />
        : <StudentSearch onSelectStudent={this.setSelected} />
    }
}

export default Student
