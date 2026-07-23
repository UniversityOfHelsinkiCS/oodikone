import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import type { CourseSearchState } from '@/pages/CourseStatistics'
import { PrimaryCourseLabel, SecondaryCourseLabel } from '@/pages/CourseStatistics/CourseTab/CourseLabel'
import { CourseSelector } from '@/pages/CourseStatistics/CourseTab/CourseSelector'
import { SingleCourseStats } from '@/pages/CourseStatistics/CourseTab/SingleCourseStats'
import { CourseStudyProgramme } from '@/pages/CourseStatistics/util'
import { AvailableStats, CourseStat } from '@/types/courseStat'
import { Name } from '@oodikone/shared/types'

export const CourseTab = ({
  selected,
  setSelected,
  userHasAccessToAllStats,

  loading,
  toggleOpenAndRegularCourses,
  openOrRegular,
  stats,
  availableStats,
  combineSubstitutions,
  alternatives,
  programmes,
}: {
  selected: string | undefined
  setSelected: (courseCode: string) => void
  userHasAccessToAllStats: boolean

  loading: boolean
  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
  stats: Record<string, CourseStat>
  availableStats: AvailableStats
  combineSubstitutions: boolean
  alternatives: { code: string; name: Name }[][]
  programmes: CourseStudyProgramme[]
}) => {
  const { getTextIn } = useLanguage()
  if (!selected || !stats[selected]) return null

  const courses = Object.values(stats).map(({ name, coursecode: code }) => ({
    key: code,
    code,
    name: getTextIn(name)!,
  }))

  if (courses.length === 0) return null
  const multipleCourses = courses.length > 1

  return (
    <Stack>
      <Section title={multipleCourses ? 'Selected courses' : 'Selected course'}>
        <Stack gap={2}>
          {multipleCourses ? <CourseSelector courses={courses} selected={selected} setSelected={setSelected} /> : null}
          <Stack gap={1}>
            <Box>
              <PrimaryCourseLabel code={selected} key={selected} name={getTextIn(stats[selected].name)!} />
            </Box>
            {alternatives.length ? (
              <>
                <Typography component="h6" variant="subtitle2">
                  Substitution groups
                </Typography>
                <Grid container spacing={1}>
                  {alternatives.map(group => (
                    <SecondaryCourseLabel getTextIn={getTextIn} group={group} key={JSON.stringify(group)} />
                  ))}
                </Grid>
              </>
            ) : null}
          </Stack>
        </Stack>
      </Section>
      <SingleCourseStats
        availableStats={availableStats}
        combineSubstitutions={combineSubstitutions}
        coursecode={selected}
        loading={loading}
        openOrRegular={openOrRegular}
        programmes={programmes}
        toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
    </Stack>
  )
}
