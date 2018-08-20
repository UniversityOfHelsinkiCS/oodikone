import React, { Component } from 'react'
import { shape } from 'prop-types'
import { Card, Tab } from 'semantic-ui-react'
import CreditStatsTable from './CreditStatsTable'

const statisticsTableTab = (title, statistics) => ({
  menuItem: title,
  render: () => (
    <Tab.Pane>
      <CreditStatsTable statistics={statistics} />
    </Tab.Pane>
  )
})

class TeacherDetails extends Component {
    state={}

    render() {
      const { teacher } = this.props

      const panes = [
        statisticsTableTab('Courses', teacher.courses),
        statisticsTableTab('Semesters', teacher.semesters),
        statisticsTableTab('Years', teacher.years)
      ]

      return (
        <div>
          <Card fluid>
            <Card.Content>
              <Card.Header content={teacher.name} />
              <Card.Meta content={teacher.code} />
              <Card.Meta content={teacher.id} />
            </Card.Content>
          </Card>
          <Tab panes={panes} />
        </div>
      )
    }
}

TeacherDetails.propTypes = {
  teacher: shape({}).isRequired
}

export default TeacherDetails
