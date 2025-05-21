import AddIcon from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { DatePicker } from '@mui/x-date-pickers/DatePicker/DatePicker'

import { Moment } from 'moment'
import { useEffect, useState } from 'react'

import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Section } from '@/components/material/Section'
import { useStatusNotification } from '@/components/material/StatusNotificationContext'
import { YEAR_DATE_FORMAT } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useCreateTagMutation } from '@/redux/tags'
import { reformatDate } from '@/util/timeAndDate'
import { Tag } from '@oodikone/shared/types'

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
            data-cy="tag-name-text-field"
            label="Tag name"
            onChange={handleChange}
            placeholder="Enter a name for the new tag"
            sx={{ width: 320 }}
            value={tagName}
          />
          <DatePicker
            data-cy="associated-start-year-date-picker"
            label="Associated start year (optional)"
            onChange={newYear => setYear(newYear)}
            sx={{
              width: 320,
            }}
            value={year}
            views={['year']}
          />
          <Button
            data-cy="create-button"
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
          data-cy="personal-tag-toggle"
          label="Personal tag"
        />
      </Stack>
    </Section>
  )
}
