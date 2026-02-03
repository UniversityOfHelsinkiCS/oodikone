import IconButton from '@mui/material/IconButton'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

import { useState } from 'react'

import { PopulationLink } from '@/components/common/PopulationLink'
import { DeleteIcon, PersonAddAlt1Icon, SellIcon, VisibilityIcon } from '@/theme'
import { Tag } from '@oodikone/shared/types'
import { AddStudentsDialog } from './AddStudentsDialog'
import { DeleteTagDialog } from './DeleteTagDialog'

export const TagItem = ({
  combinedProgramme,
  studyProgramme,
  studyTrack,
  tag,
}: {
  combinedProgramme: string
  studyProgramme: string
  studyTrack: string
  tag: Tag
}) => {
  const [studentsToAddDialogOpen, setStudentsToAddDialogOpen] = useState<boolean>(false)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)

  return (
    <>
      <ListItem
        secondaryAction={
          <Stack direction="row">
            <Tooltip arrow placement="top" title="Add students to tag">
              <IconButton data-cy="add-students-button" onClick={() => setStudentsToAddDialogOpen(true)}>
                <PersonAddAlt1Icon />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="top" title="Delete tag">
              <IconButton data-cy={`delete-tag-${tag.name}-button`} onClick={() => setTagToDelete(tag)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      >
        <ListItemIcon>
          <SellIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Stack direction="row" sx={{ alignItems: 'center' }}>
              {tag.name}
              {tag.year ? (
                <PopulationLink
                  combinedProgramme={combinedProgramme}
                  programme={studyProgramme}
                  tag={tag}
                  years={[parseInt(tag.year, 10)]}
                />
              ) : null}
              {tag.personalUserId ? (
                <Tooltip arrow placement="right" title="Only you can see this tag">
                  <VisibilityIcon data-cy={`${tag.name}-visibility-icon`} fontSize="small" />
                </Tooltip>
              ) : null}
            </Stack>
          }
          secondary={tag.year ? `Associated start year ${tag.year}` : 'No associated start year'}
        />
      </ListItem>
      <AddStudentsDialog
        combinedProgramme={combinedProgramme}
        open={studentsToAddDialogOpen}
        setOpen={setStudentsToAddDialogOpen}
        studyTrack={studyTrack}
        tag={tag}
      />
      <DeleteTagDialog setTagToDelete={setTagToDelete} tag={tag} tagToDelete={tagToDelete} />
    </>
  )
}
