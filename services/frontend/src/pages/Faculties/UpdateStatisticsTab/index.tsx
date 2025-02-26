import { Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { Section } from '@/components/material/Section'
import { UpdateButton } from '@/components/material/UpdateButton'
import { useUpdateFacultyBasicTabQuery, useUpdateFacultyProgressTabQuery } from '@/redux/facultyStats'

export const UpdateStatisticsTab = ({ id }: { id: string }) => {
  const [skipBasic, setSkipBasic] = useState(true)
  const [skipCredits, setSkipCredits] = useState(true)
  const [skipThesis, setSkipThesis] = useState(true)
  const [skipProgressTab, setSkipProgressTab] = useState(true)

  const basicBasicTabStats = useUpdateFacultyBasicTabQuery({ id, statsType: 'STUDENT' }, { skip: skipBasic })
  const creditsBasicTabStats = useUpdateFacultyBasicTabQuery({ id, statsType: 'CREDITS' }, { skip: skipCredits })
  const thesisBasicTabStats = useUpdateFacultyBasicTabQuery({ id, statsType: 'THESIS' }, { skip: skipThesis })
  const progressViewStats = useUpdateFacultyProgressTabQuery({ id }, { skip: skipProgressTab })

  return (
    <Stack gap={2}>
      <Section title="Basic information tab">
        <Stack gap={2}>
          <Typography>Click an Update button to update the data on the Basic information tab</Typography>
          <Typography>For large faculties updates can take a couple of minutes</Typography>
          <Typography component="h3" variant="h6">
            Update students data
          </Typography>
          <UpdateButton onClick={() => setSkipBasic(false)} stats={basicBasicTabStats} />
          <Typography component="h3" variant="h6">
            Update credits data
          </Typography>
          <UpdateButton onClick={() => setSkipCredits(false)} stats={creditsBasicTabStats} />
          <Typography component="h3" variant="h6">
            Update thesis writers data
          </Typography>
          <UpdateButton onClick={() => setSkipThesis(false)} stats={thesisBasicTabStats} />
        </Stack>
      </Section>
      <Section title="Progress and student populations tab">
        <Stack gap={2}>
          <Typography>
            Click the Update button to update the data on the Progress and student populations tab
          </Typography>
          <UpdateButton onClick={() => setSkipProgressTab(false)} stats={progressViewStats} />
        </Stack>
      </Section>
    </Stack>
  )
}
