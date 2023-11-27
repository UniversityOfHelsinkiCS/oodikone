import React from 'react'

import { GraduationTimes } from 'components/FacultyStatistics/TimesAndPaths/GraduationTimes'

export const FacultyGraduations = ({ faculty, graduationStats, groupByStartYear, showMedian }) => {
  const groupBy = groupByStartYear ? 'byStartYear' : 'byGradYear'
  const label = groupByStartYear ? 'Start year' : 'Graduation year'
  const data = graduationStats?.data?.[groupBy].medians
  const goals = graduationStats?.data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty === 'H30' }
  const programmeData = graduationStats?.data?.[groupBy].programmes.medians
  const programmeNames = graduationStats?.data?.programmeNames
  const classSizes = graduationStats?.data?.classSizes
  const commonProps = { label, programmeNames, showMedian, classSizes, goalExceptions }

  return (
    <div>
      <GraduationTimes
        level="bachelor"
        title="Bachelor"
        data={data?.bachelor}
        goal={goals?.bachelor}
        levelProgrammeData={programmeData?.bachelor}
        {...commonProps}
      />
      <GraduationTimes
        level="bcMsCombo"
        title="Bachelor + Master"
        data={data?.bcMsCombo}
        goal={goals?.bcMsCombo}
        levelProgrammeData={programmeData?.bcMsCombo}
        groupBy={groupBy}
        {...commonProps}
      />
      <GraduationTimes
        level="master"
        title="Master"
        data={data?.master}
        goal={goals?.master}
        levelProgrammeData={programmeData?.master}
        {...commonProps}
      />
      <GraduationTimes
        level="doctor"
        title="Doctor"
        data={data?.doctor}
        goal={goals?.doctor}
        levelProgrammeData={programmeData?.doctor}
        {...commonProps}
      />
      <GraduationTimes
        level="licentiate"
        title="Licentiate"
        data={data?.licentiate}
        goal={goals?.licentiate}
        levelProgrammeData={programmeData?.licentiate}
        {...commonProps}
      />
    </div>
  )
}
