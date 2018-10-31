import React, { Component } from 'react'
import { Tab } from 'semantic-ui-react'
import StudentSearch from './StudentSearch'

class ContentTabs extends Component {
    state={}
    render() {
      return (
        <Tab
          panes={[
              {
                  menuItem: 'Student',
                  render: () => <StudentSearch />
              }
          ]}
        />
      )
    }
}

export default ContentTabs
