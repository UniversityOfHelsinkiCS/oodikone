import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { shape, string } from 'prop-types'
import _ from 'lodash'
import { Card, Tab, Icon } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import CoursesTab from './CoursesTab'
import { getTextIn } from '../../common'
import '../PopulationQueryCard/populationQueryCard.css'

const statisticsTableTab = (title, statistics) => ({
  menuItem: title,
  render: () => <TeacherStatisticsTable statistics={statistics} onClickFn={() => {}} />
})

const formatStatisticsForTable = (statistics, language) => {
  if (!statistics) {
    return []
  }
  return Object.values(statistics).map(({ name, stats, ...rest }) => ({
    ...rest,
    ...stats,
    name: _.isString(name) ? name : getTextIn(name, language)
  }))
}

class TeacherDetails extends Component {
    state={}

    render() {
      const { teacher, language, history } = this.props
      const { courses, years, semesters } = teacher.statistics

      const panes = [
        {
          menuItem: 'Courses',
          render: () => <CoursesTab courses={courses} semesters={semesters} />
        },
        statisticsTableTab('Semesters', formatStatisticsForTable(semesters, language)),
        statisticsTableTab('Years', formatStatisticsForTable(years, language))
      ]

      return (
        <div>
          <Card fluid className="cardContainer">
            <Card.Content>
              <Card.Header className="cardHeader">
                {teacher.name}
                <Icon
                  name="remove"
                  className="controlIcon"
                  onClick={() => history.goBack()}
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
  history: shape({}).isRequired,
  language: string.isRequired
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(withRouter(TeacherDetails))
