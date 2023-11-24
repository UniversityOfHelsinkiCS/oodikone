import React from 'react'
import { isString } from 'lodash'
import { Card, Tab, Icon, Segment } from 'semantic-ui-react'
import { useHistory, Redirect } from 'react-router-dom'

import { useGetTeacherQuery } from 'redux/teachers'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import CoursesTab from './CoursesTab'
import '../../PopulationQueryCard/populationQueryCard.css'
import useLanguage from '../../LanguagePicker/useLanguage'

const statisticsTableTab = (title, statistics) => ({
  menuItem: title,
  render: () => <TeacherStatisticsTable statistics={statistics} onClickFn={() => {}} />,
})

const formatStatisticsForTable = (statistics, getTextIn) => {
  if (!statistics) {
    return []
  }
  return Object.values(statistics).map(({ name, stats, ...rest }) => ({
    ...rest,
    ...stats,
    name: isString(name) ? name : getTextIn(name),
  }))
}

export const TeacherDetails = ({ teacherId }) => {
  const history = useHistory()
  const { getTextIn } = useLanguage()
  const { data: teacher, isLoading, isError } = useGetTeacherQuery({ id: teacherId })

  if (isLoading) return <Segment basic loading />

  if (isError) return <Redirect to="/teachers" />

  const { courses, years, semesters } = teacher.statistics

  const panes = [
    {
      menuItem: 'Courses',
      render: () => <CoursesTab courses={courses} semesters={semesters} />,
    },
    statisticsTableTab('Semesters', formatStatisticsForTable(semesters, getTextIn)),
    statisticsTableTab('Years', formatStatisticsForTable(years, getTextIn)),
  ]

  return (
    <div>
      <Card fluid className="cardContainer">
        <Card.Content>
          <Card.Header className="cardHeader">
            {teacher.name}
            <Icon name="remove" className="controlIcon" onClick={() => history.goBack()} />
          </Card.Header>
          <Card.Meta content={teacher.code} />
          <Card.Meta content={teacher.id} />
        </Card.Content>
      </Card>
      <Tab panes={panes} style={{ paddingTop: '0.5rem' }} />
    </div>
  )
}
