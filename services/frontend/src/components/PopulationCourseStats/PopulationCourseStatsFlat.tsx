import Alert from '@mui/material/Alert'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { GradeDistribution } from '@/components/PopulationCourseStats/GradeDistribution'
import { PassFailEnrollments } from '@/components/PopulationCourseStats/PassFailEnrollments'
import { toSectionSlug } from '@/components/Section/sectionLink'
import { useLinkedTabs } from '@/hooks/tabs'
import type { FilteredCourse, UnionOfFilteredModuleCourse } from '@/util/coursesOfPopulation'

// TODO: When we convert <PassFailEnrollments /> to ts, check optional
// values in there. Now you just have to remember to define them :)
type PopulationCourseStatsFlatProps = {
  filteredCourses: FilteredCourse[]
  studentAmountLimit: number
  onlyIamRights?: boolean
  courseTableMode?: 'all' | 'curriculum'
  showModules?: boolean
  setShowModules?: (input: boolean) => void
}

const TAB_LABELS = ['Pass/fail', 'Grades'] as const

const Warning = ({ showModules, studentAmountLimit }) => (
  <Alert severity="warning">
    There are no <b>{showModules ? 'modules' : 'courses'}</b> available with the student amount limit of{' '}
    <span>{studentAmountLimit}</span>.
  </Alert>
)

export const PopulationCourseStatsFlat = ({
  filteredCourses,
  studentAmountLimit,
  onlyIamRights,
  courseTableMode,
  showModules,
  setShowModules,
}: PopulationCourseStatsFlatProps) => {
  const [tab, setTab] = useLinkedTabs(TAB_LABELS.map(toSectionSlug))

  if (!filteredCourses) return null

  const courseStatistics: UnionOfFilteredModuleCourse = filteredCourses
    .filter(({ stats }) => studentAmountLimit <= stats.students)
    .filter(({ course }) => (showModules ? course.isStudyModule : !course.isStudyModule))
    .map(course => {
      const { students, passed, passedOfPopulation } = course.stats
      // Modules have only some stats while courses have all
      const stats = showModules ? { students, passed, passedOfPopulation } : course.stats

      return {
        ...course,
        name: course.course.name,
        code: course.course.code,
        groupId: course.course.groupId,
        stats,
      }
    })

  const panes = [
    {
      menuItem: TAB_LABELS[0],
      render: () => (
        <>
          {!courseStatistics.length && <Warning showModules={showModules} studentAmountLimit={studentAmountLimit} />}
          <PassFailEnrollments
            courseStatistics={courseStatistics}
            courseTableMode={courseTableMode}
            onlyIamRights={onlyIamRights}
            setShowModules={setShowModules}
            showModules={showModules}
          />
        </>
      ),
    },
    {
      menuItem: TAB_LABELS[1],
      render: () => (
        <>
          {!courseStatistics.length && <Warning showModules={showModules} studentAmountLimit={studentAmountLimit} />}
          <GradeDistribution
            courseStatistics={courseStatistics}
            courseTableMode={courseTableMode}
            onlyIamRights={onlyIamRights}
            setShowModules={setShowModules}
            showModules={showModules}
          />
        </>
      ),
    },
  ]

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ menuItem }) => (
          <Tab key={menuItem} label={menuItem} />
        ))}
      </Tabs>
      {panes.at(tab)?.render()}
    </>
  )
}
