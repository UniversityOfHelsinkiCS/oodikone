import React, { useEffect } from 'react'
import GraduatedFromProgramme from './filters/GraduatedFromProgramme'
import TransferredToProgramme from './filters/TransferredToProgramme'
import EnrollmentStatus from './filters/EnrollmentStatus'
import CreditsEarned from './filters/CreditsEarned'
import Gender from './filters/Gender'
import StartYearAtUni from './filters/StartYearAtUni'
import Courses from './filters/Courses'
import useAnalytics from './useAnalytics'

export const PopulationStatisticsFilters = () => {
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.setTarget('Population Statistics')
  })

  return (
    <>
      <GraduatedFromProgramme />
      <TransferredToProgramme />
      <EnrollmentStatus />
      <CreditsEarned />
      <Gender />
      <StartYearAtUni />
      <Courses />
    </>
  )
}

export const CoursePopulationFilters = () => (
  <>
    <EnrollmentStatus />
    <Gender />
    <StartYearAtUni />
  </>
)

export const CustomPopulationFilters = () => (
  <>
    <EnrollmentStatus />
    <Gender />
    <StartYearAtUni />
    <Courses />
  </>
)
