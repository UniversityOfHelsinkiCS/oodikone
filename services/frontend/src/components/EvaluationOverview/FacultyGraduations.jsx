import { GraduationTimes } from '@/components/FacultyStatistics/TimesAndPaths/GraduationTimes'

export const FacultyGraduations = ({ faculty, graduationStats, groupByStartYear, showMedian, universityMode }) => {
  const groupBy = groupByStartYear ? 'byStartYear' : 'byGradYear'
  const yearLabel = groupByStartYear ? 'Start year' : 'Graduation year'
  const data = graduationStats?.data?.[groupBy].medians
  const goals = graduationStats?.data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty === 'H30' }
  const programmeData = graduationStats?.data?.[groupBy].programmes.medians
  const programmeNames = graduationStats?.data?.programmeNames
  const classSizes = graduationStats?.data?.classSizes
  const commonProps = { yearLabel, programmeNames, showMedian, classSizes, goalExceptions, universityMode, groupBy }

  return (
    <div>
      <GraduationTimes
        data={data?.bachelor}
        goal={goals?.bachelor}
        level="bachelor"
        levelProgrammeData={programmeData?.bachelor}
        title="Bachelor"
        {...commonProps}
      />
      <GraduationTimes
        data={data?.bcMsCombo}
        goal={goals?.bcMsCombo}
        level="bcMsCombo"
        levelProgrammeData={programmeData?.bcMsCombo}
        title="Bachelor + Master"
        {...commonProps}
      />
      <GraduationTimes
        data={data?.master}
        goal={goals?.master}
        level="master"
        levelProgrammeData={programmeData?.master}
        title="Master"
        {...commonProps}
      />
      <GraduationTimes
        data={data?.doctor}
        goal={goals?.doctor}
        level="doctor"
        levelProgrammeData={programmeData?.doctor}
        title="Doctor"
        {...commonProps}
      />
    </div>
  )
}
