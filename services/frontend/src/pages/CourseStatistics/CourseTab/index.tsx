import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import type { CourseSearchState } from '@/pages/CourseStatistics'
import { CourseStudyProgramme } from '@/pages/CourseStatistics/util'
import { CourseStat } from '@/types/courseStat'
import { CourseLabel } from './CourseLabel'
import { CourseSelector } from './CourseSelector'
import { SingleCourseStats } from './SingleCourseStats'

export const CourseTab = ({
  selected,
  setSelected,
  userHasAccessToAllStats,

  loading,
  toggleOpenAndRegularCourses,
  openOrRegular,
  stats,
  availableStats,
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
  availableStats: Record<string, { unify: boolean; open: boolean; university: boolean }>
  alternatives: CourseStat['alternatives']
  programmes: CourseStudyProgramme[]
}) => {
  const { getTextIn } = useLanguage()
  const courses = Object.values(stats as object).map(({ name, coursecode: code }) => ({
    key: code,
    code,
    name: getTextIn(name)!,
  }))

  if (!selected || !stats[selected]) return null

  const hasSubstitutions = stats[selected].alternatives.length > 1

  return (
    <Stack gap={2}>
      <Section title={hasSubstitutions ? 'Selected courses' : 'Selected course'}>
        <Stack gap={1}>
          {courses.length > 1 && <CourseSelector courses={courses} selected={selected} setSelected={setSelected} />}
          {hasSubstitutions ? (
            <Typography component="h3" variant="h6">
              Course
            </Typography>
          ) : null}
          <Box>
            <CourseLabel code={selected} key={selected} name={getTextIn(stats[selected].name)!} primary />
          </Box>
          {hasSubstitutions ? (
            <Stack gap={1}>
              <Typography component="h3" variant="h6">
                Substitutions
              </Typography>
              <Grid container spacing={1}>
                {stats[selected].alternatives
                  .filter(course => course.code !== selected)
                  .map(course => (
                    <Grid key={course.code}>
                      <CourseLabel code={course.code} key={course.code} name={getTextIn(course.name)!} />
                    </Grid>
                  ))}
              </Grid>
            </Stack>
          ) : null}
        </Stack>
      </Section>
      <SingleCourseStats
        alternatives={alternatives}
        availableStats={availableStats[selected]}
        loading={loading}
        openOrRegular={openOrRegular}
        programmes={programmes}
        stats={stats[selected]}
        toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
    </Stack>
  )
}
