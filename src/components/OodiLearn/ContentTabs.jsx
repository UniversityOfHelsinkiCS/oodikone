import React, { Component } from 'react'
import { Tab } from 'semantic-ui-react'
import Student from './Student'
import Course from './Course'
import Population from './Population'
import SuggestCourseGraph from './SuggestCourseGraph'

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
            },
            {
              menuItem: 'Route',
              render: () => <SuggestCourseGraph />
            }
          ]}
        />
      )
    }
}

export default ContentTabs
