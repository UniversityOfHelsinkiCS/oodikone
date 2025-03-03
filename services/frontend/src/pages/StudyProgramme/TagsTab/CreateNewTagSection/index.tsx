import { Add as AddIcon } from '@mui/icons-material'
import { Button, FormControlLabel, Stack, Switch, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Moment } from 'moment'
import { useEffect, useState } from 'react'

import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Section } from '@/components/material/Section'
import { useStatusNotification } from '@/components/material/StatusNotificationContext'
import { YEAR_DATE_FORMAT } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useCreateTagMutation } from '@/redux/tags'
import { Tag } from '@/shared/types'
import { reformatDate } from '@/util/timeAndDate'

export const CreateNewTagSection = ({ studyTrack, tags }: { studyTrack: string; tags: Tag[] }) => {
  const [tagName, setTagName] = useState<string>('')
  const [year, setYear] = useState<Moment | null>(null)
  const [personal, setPersonal] = useState(false)
  const { setStatusNotification } = useStatusNotification()
  const { id: userId } = useGetAuthorizedUserQuery()
  const [createTag, { isError, isSuccess }] = useCreateTagMutation()

  const handleSubmit = event => {
    event.preventDefault()
    const newTag = {
      name: tagName.trim(),
      personalUserId: personal ? userId : null,
      studyTrack,
      year: year ? reformatDate(year.toDate(), YEAR_DATE_FORMAT) : null,
    }
    void createTag(newTag)
    setTagName('')
    setYear(null)
    setPersonal(false)
  }

  const handleChange = ({ target }) => {
    setTagName(target.value)
  }

  useEffect(() => {
    if (isError) {
      setStatusNotification('Failed to create new tag', 'error')
    }
  }, [isError])

  useEffect(() => {
    if (isSuccess) {
      setStatusNotification('New tag created', 'success')
    }
  }, [isSuccess])

  return (
    <Section cypress="create-new-tag" infoBoxContent={studyProgrammeToolTips.tags} title="Create new tag">
      <Stack direction="column">
        <Stack alignItems="center" direction="row" gap={1}>
          <TextField
            label="Tag name"
            onChange={handleChange}
            placeholder="Enter a name for the new tag"
            sx={{ width: 320 }}
            value={tagName}
          />
          <DatePicker
            label="Associated start year (optional)"
            onChange={newYear => setYear(newYear)}
            sx={{
              width: 320,
            }}
            value={year}
            views={['year']}
          />
          <Button
            disabled={!tagName.trim() || tags.some(tag => tag.name === tagName.trim())}
            endIcon={<AddIcon />}
            onClick={handleSubmit}
            variant="contained"
          >
            Create
          </Button>
        </Stack>
        <FormControlLabel
          control={<Switch checked={personal} onChange={() => setPersonal(!personal)} />}
          label="Personal tag"
        />
      </Stack>
    </Section>
  )
}
