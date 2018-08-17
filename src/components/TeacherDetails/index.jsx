import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

class TeacherDetails extends Component {
    state={}

    render() {
      return (
        <Redirect to="/teachers" />
      )
    }
}

export default TeacherDetails
