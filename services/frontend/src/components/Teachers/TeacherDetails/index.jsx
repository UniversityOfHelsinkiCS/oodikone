import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { isString } from 'lodash'
import { useState } from 'react'
import { Navigate } from 'react-router'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SegmentDimmer } from '@/components/SegmentDimmer'
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
  const [tab, setTab] = useState(0)

  const { getTextIn } = useLanguage()
  const { data: teacher, isLoading, isError } = useGetTeacherQuery({ id: teacherId })

  if (isLoading) return <SegmentDimmer loading />

  if (isError) return <Navigate replace to="/teachers" />

  const { courses, years, semesters } = teacher.statistics

  const panes = [
    {
      label: 'Courses',
      render: () => <CoursesTab courses={courses} semesters={semesters} />,
    },
    {
      label: 'Semesters',
      render: () => (
        <TeacherStatisticsTable statistics={formatStatisticsForTable(semesters, getTextIn)} variant="semester" />
      ),
    },
    {
      label: 'Years',
      render: () => <TeacherStatisticsTable statistics={formatStatisticsForTable(years, getTextIn)} variant="year" />,
    },
  ]

  return (
    <>
      <Paper sx={{ padding: 2 }}>
        <Typography variant="h6">{teacher.name}</Typography>
        <Typography fontWeight="light">{teacher.code}</Typography>
        <Typography fontWeight="light">{teacher.id}</Typography>
      </Paper>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      {panes.at(tab)?.render() ?? null}
    </>
  )
}
