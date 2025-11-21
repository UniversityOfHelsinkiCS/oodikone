import CropSquareIcon from '@mui/icons-material/CropSquare'
import DoneIcon from '@mui/icons-material/Done'
import RemoveIcon from '@mui/icons-material/Remove'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import green from '@mui/material/colors/green'
import grey from '@mui/material/colors/grey'
import yellow from '@mui/material/colors/yellow'
import Stack from '@mui/material/Stack'

import { useState } from 'react'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'
import { SearchModal } from './SearchModal'
import { SearchResults } from './SearchResults'

export const CompletedCourses = () => {
  useTitle('Completed courses of students')
  const [searchValues, setValues] = useState({ courseList: [], studentList: [] })

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Completed courses of students" />
      <Stack alignItems="center" spacing={2} sx={{ width: '100%' }}>
        <Alert severity="info">
          <Box mb={1}>
            Here you can search by a list of student and course numbers to see whether students have completed certain
            courses yet. The tool will also show if students have enrolled on the course, if they have not yet completed
            it, or if they have the course selected in their primary study plan. Course substitutions are taken into
            account.
          </Box>
          <Stack direction="row">
            <DoneIcon fontSize="small" sx={{ color: green[700] }} />: Student has completed the course with a passing
            grade.
          </Stack>
          <Stack direction="row">
            <RemoveIcon fontSize="small" sx={{ color: yellow[800] }} />: Student has not completed the course, but has
            an active enrollment from less than 6 months ago.
          </Stack>
          <Stack direction="row">
            <RemoveIcon fontSize="small" sx={{ color: grey[700] }} />: Student has not completed the course, but has an
            enrollment from more than 6 months ago.
          </Stack>
          <Stack direction="row">
            <CropSquareIcon fontSize="small" sx={{ color: grey[500] }} />: Student has the course in their primary study
            plan, but has not enrolled to, or completed it.
          </Stack>
          <b>Empty cell</b>: Student has no completion or enrollment for the course.
        </Alert>
        <SearchModal setValues={setValues} />
        {searchValues.courseList.length > 0 && searchValues.studentList.length > 0 && (
          <SearchResults searchValues={searchValues} />
        )}
      </Stack>
    </PageLayout>
  )
}
