import React, { Component } from 'react'
import { shape } from 'prop-types'
import _ from 'lodash'
import { Card, Tab, Icon } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import CoursesTab from './CoursesTab'
import styles from '../PopulationQueryCard/populationQueryCard.css'

const statisticsTableTab = (title, statistics) => ({
  menuItem: title,
  render: () => <TeacherStatisticsTable statistics={statistics} onClickFn={null} />
})

const formatStatisticsForTable = (statistics) => {
  if (!statistics) {
    return []
  }
  return Object.values(statistics).map(({ name, stats, ...rest }) => ({
    ...rest,
    ...stats,
    name: _.isString(name) ? name : name.fi
  }))
}

class TeacherDetails extends Component {
    state={}

    render() {
      const { teacher } = this.props
      const { courses, years, semesters } = teacher.statistics

      const panes = [
        {
          menuItem: 'Courses',
          render: () => <CoursesTab courses={courses} semesters={semesters} />
        },
        statisticsTableTab('Semesters', formatStatisticsForTable(semesters)),
        statisticsTableTab('Years', formatStatisticsForTable(years))
      ]

      return (
        <div>
          <Card fluid className={styles.cardContainer}>
            <Card.Content>
              <Card.Header className={styles.cardHeader}>
                {teacher.name}
                <Icon
                  name="remove"
                  className={styles.controlIcon}
                  onClick={() => this.props.history.goBack()}
                />
              </Card.Header>
              <Card.Meta content={teacher.code} />
              <Card.Meta content={teacher.id} />
            </Card.Content>
          </Card>
          <Tab panes={panes} style={{ paddingTop: '0.5rem' }} />
        </div>
      )
    }
}

TeacherDetails.propTypes = {
  teacher: shape({}).isRequired,
  history: shape({}).isRequired
}

export default withRouter(TeacherDetails)
