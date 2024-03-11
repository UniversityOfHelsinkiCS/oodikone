import moment from 'moment'
import React, { useState } from 'react'
import { Segment, Message } from 'semantic-ui-react'

import { useGetTopTeachersCategoriesQuery, useLazyGetTopTeachersQuery } from '@/redux/teachers'
import { TeacherStatisticsTable } from '../TeacherStatisticsTable'
import { LeaderForm } from './LeaderForm'

export const TeacherLeaderBoard = () => {
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [getTopTeachers, { data: topTeachers = [] }] = useLazyGetTopTeachersQuery()
  const { data: yearsAndCategories, isLoading, isFetching } = useGetTopTeachersCategoriesQuery()

  const updateAndSubmitForm = args => {
    const year = args.selectedYear || selectedYear
    const category = args.selectedCategory || selectedCategory
    getTopTeachers({ yearcode: year, category })
  }

  const initLeaderboard = (year, category) => {
    setSelectedYear(year)
    setSelectedCategory(category)
    updateAndSubmitForm({ selectedYear: year, selectedCategory: category })
  }

  const handleYearChange = (e, { value }) => {
    setSelectedYear(value)
    updateAndSubmitForm({ selectedYear: value })
  }

  const handleCategoryChange = (e, { value }) => {
    setSelectedCategory(value)
    updateAndSubmitForm({ selectedCategory: value })
  }

  if (isLoading || isFetching) return <Segment basic loading />

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

  const lastUpdated = new Date(topTeachers?.updated).toLocaleDateString(undefined, {
    dateStyle: 'long',
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
      <Segment>
        {topTeachers.length > 0 && <Message>{`Last updated: ${lastUpdated}`}</Message>}
        <TeacherStatisticsTable statistics={topTeachers?.stats || []} variant="leaderboard" />
      </Segment>
    </div>
  )
}
