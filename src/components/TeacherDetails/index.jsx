import React, { Component } from 'react'
import { shape } from 'prop-types'
import _ from 'lodash'
import { Card, Tab } from 'semantic-ui-react'
import TeacherStatisticsTable from '../TeacherStatisticsTable'

const statisticsTableTab = (title, statistics) => ({
  menuItem: title,
  render: () => (
    <Tab.Pane>
      <TeacherStatisticsTable statistics={statistics} />
    </Tab.Pane>
  )
})

const formatStatisticsForTable = (statistics) => {
  if (!statistics) {
    return []
  }
  return Object.values(statistics).map(({ name, stats, ...rest }) => ({
    ...rest,
    ...stats,
    name: _.isString(name) ? name : name.en
  }))
}

class TeacherDetails extends Component {
    state={}

    render() {
      const { teacher } = this.props
      const { courses, years, semesters } = teacher.statistics

      const panes = [
        statisticsTableTab('Courses', formatStatisticsForTable(courses)),
        statisticsTableTab('Semesters', formatStatisticsForTable(semesters)),
        statisticsTableTab('Years', formatStatisticsForTable(years))
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
