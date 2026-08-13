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
import { AvailableStats } from '@/types/courseStat'
import { Name } from '@oodikone/shared/types'
import { CourseStat } from '@oodikone/shared/types/courseYearlyStats'

export const CourseTab = ({
  selected,
  setSelected,
  userHasAccessToAllStats,

  loading,
  toggleOpenAndRegularCourses,
  openOrRegular,
  stats,
  availableStats,
  substitutions,
  substitutionGroups,
  programmes,
  toYearCode,
  fromYearCode,
  setToYearCode,
  setFromYearCode,
}: {
  selected: string | undefined
  setSelected: (courseCode: string) => void
  userHasAccessToAllStats: boolean

  loading: boolean
  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
  stats: Record<string, CourseStat>
  availableStats: AvailableStats
  substitutions: boolean
  substitutionGroups: { code: string; name: Name; groupId: string }[][]
  programmes: CourseStudyProgramme[]

  toYearCode: number
  fromYearCode: number
  setToYearCode: any
  setFromYearCode: any
}) => {
  'use memo'
  const { getTextIn } = useLanguage()
  if (!selected || !stats[selected]) return null

  const courses = Object.values(stats).map(({ name, courseCode: code, groupId }) => ({
    key: code,
    code,
    name: getTextIn(name),
    groupId,
  }))

  if (!courses.length) return null
  const multipleCourses = courses.length > 1

  return (
    <Stack spacing={2}>
      <Section title={multipleCourses ? 'Selected courses' : 'Selected course'}>
        <Stack spacing={2}>
          {multipleCourses ? <CourseSelector courses={courses} selected={selected} setSelected={setSelected} /> : null}
          <Stack spacing={1}>
            <Box>
              <PrimaryCourseLabel
                code={stats[selected].courseCode}
                key={selected}
                name={getTextIn(stats[selected].name)!}
              />
            </Box>
            {substitutionGroups.length && (
              <>
                <Typography component="h6" variant="subtitle2">
                  {`Substitution${!substitutions ? 's not enabled' : ' groups'}`}
                </Typography>
                {substitutions && (
                  <Grid container spacing={1}>
                    {substitutionGroups.map(group => (
                      <SecondaryCourseLabel getTextIn={getTextIn} group={group} key={JSON.stringify(group)} />
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Section>
      <SingleCourseStats
        availableStats={availableStats}
        substitutions={substitutions}
        courseGroupId={selected}
        loading={loading}
        stats={stats}
        openOrRegular={openOrRegular}
        programmes={programmes}
        toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
        userHasAccessToAllStats={userHasAccessToAllStats}
        toYearCode={toYearCode}
        fromYearCode={fromYearCode}
        setToYearCode={setToYearCode}
        setFromYearCode={setFromYearCode}
      />
    </Stack>
  )
}
