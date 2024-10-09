import moment from 'moment'
import { useState } from 'react'
import { Message, Segment } from 'semantic-ui-react'

import { useGetTopTeachersCategoriesQuery, useGetTopTeachersQuery } from '@/redux/teachers'
import { TeacherStatisticsTable } from '../TeacherStatisticsTable'
import { LeaderForm } from './LeaderForm'

export const TeacherLeaderBoard = () => {
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const { data: yearsAndCategories, isFetching: categoriesAreLoading } = useGetTopTeachersCategoriesQuery()
  const { data: topTeachers = {}, isFetching: statsAreLoading } = useGetTopTeachersQuery(
    { yearcode: selectedYear, category: selectedCategory },
    { skip: !selectedYear || !selectedCategory }
  )

  if (categoriesAreLoading) return <Segment basic loading />

  const initLeaderboard = (year, category) => {
    setSelectedYear(year)
    setSelectedCategory(category)
  }

  const handleYearChange = (_event, { value }) => {
    setSelectedYear(value)
  }

  const handleCategoryChange = (_event, { value }) => {
    setSelectedCategory(value)
  }

  const yearOptions = Object.values(yearsAndCategories.years)
    .map(({ yearcode, yearname }) => ({ key: yearcode, value: yearcode, text: yearname }))
    .sort((y1, y2) => y2.value - y1.value)
    .filter(year => {
      const options =
        moment(new Date()).diff(new Date(`${new Date().getFullYear()}-8-1`), 'days') > 0
          ? year.text.slice(0, 4) <= new Date().getFullYear()
          : year.text.slice(0, 4) < new Date().getFullYear()
      return options
    })

  const categoryOptions = Object.values(yearsAndCategories.categories).map(({ id, name }) => ({
    key: id,
    value: id,
    text: name,
  }))

  const lastUpdated = new Date(topTeachers?.updated).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    minute: 'numeric',
    hour: 'numeric',
    second: 'numeric',
  })

  return (
    <div>
      <Message>
        <Message.Header>Teacher leaderboard</Message.Header>
        Teachers who have produced the most credits from all departments.
      </Message>
      <LeaderForm
        categoryoptions={categoryOptions}
        handleCategoryChange={handleCategoryChange}
        handleYearChange={handleYearChange}
        initLeaderboard={initLeaderboard}
        selectedcategory={selectedCategory}
        selectedyear={selectedYear}
        yearoptions={yearOptions}
      />
      <Segment loading={statsAreLoading}>
        {topTeachers.stats?.length > 0 && <Message>{`Last updated: ${lastUpdated}`}</Message>}
        <TeacherStatisticsTable statistics={topTeachers.stats ?? []} variant="leaderboard" />
      </Segment>
    </div>
  )
}
