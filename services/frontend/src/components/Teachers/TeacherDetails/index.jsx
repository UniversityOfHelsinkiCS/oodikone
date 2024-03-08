import { isString } from 'lodash'
import React from 'react'
import { Redirect } from 'react-router-dom'
import { Card, Segment, Tab } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import '@/components/PopulationQueryCard/populationQueryCard.css'
import { TeacherStatisticsTable } from '@/components/Teachers/TeacherStatisticsTable'
import { useGetTeacherQuery } from '@/redux/teachers'
import { CoursesTab } from './CoursesTab'

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
    {
      menuItem: 'Semesters',
      render: () => (
        <TeacherStatisticsTable variant="semester" statistics={formatStatisticsForTable(semesters, getTextIn)} />
      ),
    },
    {
      menuItem: 'Years',
      render: () => <TeacherStatisticsTable variant="year" statistics={formatStatisticsForTable(years, getTextIn)} />,
    },
  ]

  return (
    <div>
      <Card fluid className="cardContainer">
        <Card.Content>
          <Card.Header className="cardHeader">{teacher.name}</Card.Header>
          <Card.Meta content={teacher.code} />
          <Card.Meta content={teacher.id} />
        </Card.Content>
      </Card>
      <Tab panes={panes} style={{ paddingTop: '0.5rem' }} />
    </div>
  )
}
