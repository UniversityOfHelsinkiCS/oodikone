import {
  Delete as DeleteIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
  Sell as SellIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { IconButton, ListItem, ListItemIcon, ListItemText, Stack, Tooltip } from '@mui/material'
import { useState } from 'react'

import { PopulationLinkWithTag } from '@/components/material/PopulationLink'
import { Tag } from '@/shared/types'
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
              {tag.year && (
                <PopulationLinkWithTag
                  combinedProgramme={combinedProgramme}
                  studyProgramme={studyProgramme}
                  tag={tag}
                />
              )}
              {tag.personalUserId && (
                <Tooltip arrow placement="right" title="Only you can see this tag">
                  <VisibilityIcon data-cy={`${tag.name}-visibility-icon`} fontSize="small" />
                </Tooltip>
              )}
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
