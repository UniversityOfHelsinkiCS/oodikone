import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material'
import { useSelector } from 'react-redux'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { getAvailableStats, getCourses, getCourseStats } from '@/selectors/courseStats'
import { CourseLabel } from './CourseLabel'
import { CourseSelector } from './CourseSelector'
import { SingleCourseStats } from './SingleCourseStats'

export const CourseTab = ({
  selected,
  setSelected,
  userHasAccessToAllStats,
}: {
  selected: string
  setSelected: (courseCode: string) => void
  userHasAccessToAllStats: boolean
}) => {
  const { getTextIn } = useLanguage()
  const stats = useSelector(getCourseStats)
  const availableStats = useSelector(getAvailableStats)
  const courses = useSelector(getCourses).map(({ code, name }) => ({
    key: code,
    code,
    name: getTextIn(name)!,
  }))

  if (!stats[selected]) {
    return null
  }

  const hasSubstitutions = stats[selected].alternatives.length > 1

  return (
    <Stack gap={2}>
      <Section title={hasSubstitutions ? 'Selected courses' : 'Selected course'}>
        <Stack gap={1}>
          {courses.length > 1 && <CourseSelector courses={courses} selected={selected} setSelected={setSelected} />}
          {hasSubstitutions && (
            <Typography component="h3" variant="h6">
              Course
            </Typography>
          )}
          <Box>
            <CourseLabel code={selected} key={selected} name={getTextIn(stats[selected].name)!} primary />
          </Box>
          {hasSubstitutions && (
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
          )}
        </Stack>
      </Section>
      <SingleCourseStats
        availableStats={availableStats[selected]}
        stats={stats[selected]}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
    </Stack>
  )
}
