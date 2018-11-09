import React, { Component } from 'react'
import { Tab } from 'semantic-ui-react'
import Student from './Student'
import Course from './Course'

class ContentTabs extends Component {
    state={}
    render() {
      return (
        <Tab
          panes={[
              {
                  menuItem: 'Student',
                  render: () => <Student />
              },
              {
                menuItem: 'Courses',
                render: () => <Course />
              }
          ]}
        />
      )
    }
}

export default ContentTabs
