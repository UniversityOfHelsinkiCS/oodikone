import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useState } from 'react'

import { UpdateButton } from '@/components/common/UpdateButton'
import { Section } from '@/components/Section'
import { useUpdateBasicViewQuery, useUpdateStudyTrackViewQuery } from '@/redux/studyProgramme'

export const UpdateStatisticsTab = ({
  combinedProgramme,
  studyProgramme,
}: {
  combinedProgramme: string
  studyProgramme: string
}) => {
  const [skipBasic, setSkipBasic] = useState(true)
  const [skipStudyTrack, setSkipStudyTrack] = useState(true)

  const basicStats = useUpdateBasicViewQuery({ id: studyProgramme, combinedProgramme }, { skip: skipBasic })
  const studyTrackStats = useUpdateStudyTrackViewQuery(
    { id: studyProgramme, combinedProgramme },
    { skip: skipStudyTrack }
  )

  return (
    <Section title="Update data">
      <Stack gap={2}>
        <Typography>Click an Update button to update the data on the corresponding tab</Typography>
        <Typography component="h3" variant="h6">
          Update Basic information
        </Typography>
        <UpdateButton onClick={() => setSkipBasic(false)} stats={basicStats} />
        <Typography component="h3" variant="h6">
          Update Study tracks and class statistics
        </Typography>
        <UpdateButton onClick={() => setSkipStudyTrack(false)} stats={studyTrackStats} />
      </Stack>
    </Section>
  )
}
