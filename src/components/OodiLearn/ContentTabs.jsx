import React, { Component } from 'react'
import { Tab } from 'semantic-ui-react'
import Student from './Student'

class ContentTabs extends Component {
    state={}
    render() {
      return (
        <Tab
          panes={[
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
