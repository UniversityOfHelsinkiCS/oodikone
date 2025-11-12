import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { useState } from 'react'

import { LoadingSection } from '@/components/Loading'
import { SegmentDimmer } from '@/components/SegmentDimmer'

import { DateFormat } from '@/constants/date'
import { useGetTopTeachersCategoriesQuery, useGetTopTeachersQuery } from '@/redux/teachers'
import { reformatDate } from '@/util/timeAndDate'
import { TeacherStatisticsTable } from '../TeacherStatisticsTable'
import { LeaderForm } from './LeaderForm'

export const TeacherLeaderBoard = () => {
  const [selectedYear, setSelectedYear] = useState(undefined)
  const [selectedCategory, setSelectedCategory] = useState(undefined)
  const { data: yearsAndCategories, isFetching: categoriesAreLoading } = useGetTopTeachersCategoriesQuery()
  const { data: topTeachers = {}, isFetching: statsAreLoading } = useGetTopTeachersQuery(
    { yearcode: selectedYear, category: selectedCategory },
    { skip: !selectedYear || !selectedCategory }
  )

  if (categoriesAreLoading) return <SegmentDimmer loading />

  const initLeaderboard = (year, category) => {
    setSelectedYear(year)
    setSelectedCategory(category)
  }

  const handleYearChange = event => {
    setSelectedYear(event.target.value)
  }

  const handleCategoryChange = event => {
    setSelectedCategory(event.target.value)
  }

  const yearOptions = Object.values(yearsAndCategories.years)
    .map(({ yearcode, yearname }) => ({ key: yearcode, value: yearcode, text: yearname }))
    .sort((y1, y2) => y2.value - y1.value)
    .filter(year => {
      const options =
        dayjs(new Date()).diff(new Date(`${new Date().getFullYear()}-8-1`), 'days') > 0
          ? year.text.slice(0, 4) <= new Date().getFullYear()
          : year.text.slice(0, 4) < new Date().getFullYear()
      return options
    })

  const categoryOptions = Object.values(yearsAndCategories.categories).map(({ id, name }) => ({
    key: id,
    value: id,
    text: name,
  }))

  const statistics = statsAreLoading ? (
    <LoadingSection />
  ) : (
    <>
      {topTeachers.stats?.length > 0 && (
        <Alert
          icon={false}
          severity="info"
          variant="outlined"
        >{`Last updated: ${reformatDate(topTeachers?.updated, DateFormat.LONG_DATE_TIME)}`}</Alert>
      )}
      <TeacherStatisticsTable statistics={topTeachers.stats ?? []} variant="leaderboard" />
    </>
  )

  return (
    <>
      <Alert icon={false} severity="info" variant="outlined">
        <Typography variant="h6">Teacher leaderboard</Typography>
        Teachers who have produced the most credits from all departments.
      </Alert>
      <LeaderForm
        categoryoptions={categoryOptions}
        handleCategoryChange={handleCategoryChange}
        handleYearChange={handleYearChange}
        initLeaderboard={initLeaderboard}
        selectedcategory={selectedCategory}
        selectedyear={selectedYear}
        yearoptions={yearOptions}
      />
      {statistics}
    </>
  )
}
