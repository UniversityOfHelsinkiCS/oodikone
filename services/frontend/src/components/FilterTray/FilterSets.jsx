import React, { useEffect } from 'react'
import useAnalytics from './useAnalytics'
import GraduatedFromProgramme from './filters/GraduatedFromProgramme'
import TransferredToProgramme from './filters/TransferredToProgramme'
import EnrollmentStatus from './filters/EnrollmentStatus'
import CreditsEarned from './filters/CreditsEarned'
// import Gender from './filters/Gender'
import StartYearAtUni from './filters/StartYearAtUni'
import Courses from './filters/Courses'
import Programmes from './filters/Programmes'
import Grade from './filters/Grade'
import Date from './filters/Date'
import Age from './filters/Age'
import AdmissionType from './filters/AdmissionType'
import Tags from './filters/Tags'

const Filters = ({ name, children }) => {
  const analytics = useAnalytics()
  useEffect(() => {
    analytics.setTarget(name)
  })

  return React.Children.toArray(children)
}

export const PopulationStatisticsFilters = ({ query }) => (
  <Filters name="Population Statistics">
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
    <Date />
  </Filters>
)

export const CoursePopulationFilters = () => (
  <Filters name="Course Population">
    <Grade />
    <Age />
    <Gender />
    <StartYearAtUni />
    <Courses />
    <Programmes />
  </Filters>
)

export const CustomPopulationFilters = () => (
  <Filters name="Custom Population">
    <EnrollmentStatus />
    <Age />
    <Gender />
    <StartYearAtUni />
    <Courses />
    <Date />
  </Filters>
)

export const StudyGuidanceGroupFilters = ({ group }) => (
  <Filters name="Study Guidance Group">
    <EnrollmentStatus />
    <Age />
    <Gender />
    <StartYearAtUni />
    {group?.tags?.studyProgramme && group?.tags?.year >= 2020 && (
      <AdmissionType overrideCode={group.tags.studyProgramme} />
    )}
    {group?.tags?.studyProgramme && <GraduatedFromProgramme overrideCode={group.tags.studyProgramme} />}
    <Tags />
    <Courses />
    <Date />
  </Filters>
)
