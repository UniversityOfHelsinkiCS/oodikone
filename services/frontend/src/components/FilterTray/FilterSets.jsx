import React, { useEffect } from 'react'
import GraduatedFromProgramme from './filters/GraduatedFromProgramme'
import TransferredToProgramme from './filters/TransferredToProgramme'
import EnrollmentStatus from './filters/EnrollmentStatus'
import CreditsEarned from './filters/CreditsEarned'
import Gender from './filters/Gender'
import StartYearAtUni from './filters/StartYearAtUni'
import Courses from './filters/Courses'
import useAnalytics from './useAnalytics'
import Grade from './filters/Grade'
import Date from './filters/Date'
import Age from './filters/Age'
import AdmissionType from './filters/AdmissionType'
import Tags from './filters/Tags'

export const PopulationStatisticsFilters = ({ query }) => {
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
      <Age />
      <Gender />
      <StartYearAtUni />
      {parseInt(query?.year, 10) >= 2020 ? <AdmissionType /> : null}
      <Courses />
      <Tags />
    </>
  )
}

export const CoursePopulationFilters = () => {
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.setTarget('Course Population')
  })

  return (
    <>
      <Grade />
      <Age />
      <Gender />
      <StartYearAtUni />
    </>
  )
}

export const CustomPopulationFilters = () => {
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.setTarget('Custom Population')
  })

  return (
    <>
      <EnrollmentStatus />
      <Age />
      <Gender />
      <StartYearAtUni />
      <Courses />
      <Date />
    </>
  )
}
