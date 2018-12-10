import React, { Component } from 'react'
import { Tab } from 'semantic-ui-react'
import Student from './Student'
import Course from './Course'
import Population from './Population'

class ContentTabs extends Component {
    state={}

    render() {
      return (
        <Tab
          panes={[
            {
              menuItem: 'Courses',
              render: () => <Course />
            },
            {
              menuItem: 'Population',
              render: () => <Population />
            },
            {
              menuItem: 'Student',
              render: () => <Student />
            }
          ]}
        />
      )
    }
}

export default ContentTabs
