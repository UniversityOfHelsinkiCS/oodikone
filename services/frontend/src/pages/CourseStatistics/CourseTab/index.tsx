import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { useAppSelector } from '@/redux/hooks'
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
  const stats = useAppSelector(getCourseStats)
  const availableStats = useAppSelector(getAvailableStats)
  const courses = useAppSelector(getCourses).map(({ code, name }) => ({
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
        availableStats={availableStats[selected]}
        stats={stats[selected]}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
    </Stack>
  )
}
