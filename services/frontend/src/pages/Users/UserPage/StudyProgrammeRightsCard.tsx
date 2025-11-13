import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useEffect, useState } from 'react'

import { isDefaultServiceProvider, isNewStudyProgramme } from '@/common'
import { userToolTips } from '@/common/InfoToolTips'
import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStatusNotification } from '@/components/StatusNotification/Context'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useAddUserUnitsMutation, useRemoveUserUnitsMutation } from '@/redux/users'
import { User } from '@/types/api/users'
import { checkUserAccess } from '@/util/access'
import { createLocaleComparator } from '@/util/comparator'
import { DetailedProgrammeRights } from '@oodikone/shared/types'
import { CardHeader } from './CardHeader'
import { EditButton } from './EditButton'

const mapAndSortProgrammes = (programmeRights: DetailedProgrammeRights[], studyProgrammes, getTextIn) => {
  return programmeRights
    .map(({ code, limited }) => {
      const programme = studyProgrammes.find(programme => programme.code === code)
      return { code, name: getTextIn(programme?.name), limited }
    })
    .sort(createLocaleComparator('name'))
}

const getUserFullProgrammeRights = (programmeRights: DetailedProgrammeRights[]) => {
  return programmeRights.filter(programmeRight => !programmeRight.limited).map(programme => programme.code)
}

export const StudyProgrammeRightsCard = ({ user }: { user: User }) => {
  const { id: uid, roles, programmeRights } = user
  const { getTextIn } = useLanguage()
  const [accessRightsToBeAdded, setAccessRightsToBeAdded] = useState<string[]>([])
  const [accessRightsToBeRemoved, setAccessRightsToBeRemoved] = useState<string[]>([])
  const { setStatusNotification } = useStatusNotification()
  const [editing, setEditing] = useState(false)
  const [filterOldProgrammes, setFilterOldProgrammes] = useState(true)
  const { data: programmes = {} } = useGetProgrammesQuery()
  const studyProgrammes = Object.values(programmes)
  const [addUserUnitsMutation, addResult] = useAddUserUnitsMutation()
  const [removeUserUnitsMutation, removeResult] = useRemoveUserUnitsMutation()

  useEffect(() => {
    if (addResult.isSuccess || removeResult.isSuccess) {
      setStatusNotification('Access rights updated successfully!', 'success')
    } else if (addResult.isError || removeResult.isError) {
      setStatusNotification('Failed to update access rights.', 'error')
    }
  }, [addResult.isSuccess, addResult.isError, removeResult.isSuccess, removeResult.isError])

  let options = studyProgrammes
    .filter(programme => !getUserFullProgrammeRights(programmeRights).includes(programme.code))
    .map(({ code, name }) => ({
      key: code,
      code,
      name: getTextIn(name),
      description: code,
    }))
    .sort(createLocaleComparator('text'))

  if (filterOldProgrammes) {
    options = options.filter(({ code }) => isNewStudyProgramme(code))
  }

  const currentRegularAccessRights = mapAndSortProgrammes(
    programmeRights.filter(({ isIamBased }) => !isIamBased),
    studyProgrammes,
    getTextIn
  )

  const currentIamAccessRights = mapAndSortProgrammes(
    programmeRights.filter(({ isIamBased }) => isIamBased),
    studyProgrammes,
    getTextIn
  )

  const handleSave = async () => {
    if (accessRightsToBeAdded.length > 0) {
      const result = await addUserUnitsMutation({ uid, codes: accessRightsToBeAdded })
      if (!result.error) {
        setAccessRightsToBeAdded([])
      }
    }
    if (accessRightsToBeRemoved.length > 0) {
      const result = await removeUserUnitsMutation({ uid, codes: accessRightsToBeRemoved })
      if (!result.error) {
        setAccessRightsToBeRemoved([])
      }
    }
  }

  const handleEditClick = async () => {
    if (editing) {
      await handleSave()
    }
    setEditing(!editing)
  }

  const hasFullAccess = checkUserAccess(['admin', 'fullSisuAccess'], roles)

  return (
    <Card sx={{ width: '100%' }} variant="outlined">
      <CardHeader
        buttons={<EditButton disabled={hasFullAccess} editing={editing} onClick={handleEditClick} />}
        title="Degree programme rights"
      />

      {hasFullAccess ? (
        <Alert severity="info">This user has full access to all degree programmes.</Alert>
      ) : (
        <>
          {editing ? (
            <CardContent>
              <Typography component="h3" fontWeight="bold" gutterBottom>
                Select new degree programme access rights
              </Typography>
              <Stack direction="column">
                <FormControl>
                  <InputLabel>Select degree programmes to add</InputLabel>
                  <Select
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                    data-cy="StudyProgrammeSelector"
                    label="Select degree programmes to add"
                    multiple
                    onChange={event => setAccessRightsToBeAdded(event.target.value as string[])}
                    renderValue={selected => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map(value => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                    value={accessRightsToBeAdded}
                  >
                    {options.map(({ key, code, name }) => (
                      <MenuItem data-cy={`StudyProgrammeSelectorOption${code}`} key={key} value={code}>
                        <Box display="flex" justifyContent="space-between" width="100%">
                          <Typography color="text.primary" component="span" variant="body1">
                            {name}
                          </Typography>
                          <Typography color="text.secondary" component="span" variant="body1">
                            {code}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FilterOldProgrammesToggle
                  checked={filterOldProgrammes}
                  onChange={() => setFilterOldProgrammes(!filterOldProgrammes)}
                />
              </Stack>
            </CardContent>
          ) : null}

          <CardContent>
            <Typography component="h3" fontWeight="bold" gutterBottom>
              Current degree programme access rights
            </Typography>

            <Stack direction="column" gap={1}>
              {currentRegularAccessRights.length > 0 ? (
                currentRegularAccessRights.map(({ code, name }) => (
                  <Stack alignItems="center" direction="row" justifyContent="space-between" key={code}>
                    <Typography>{`${name} ${code}`}</Typography>
                    {editing ? (
                      <Button
                        color={!accessRightsToBeRemoved.includes(code) ? 'error' : 'primary'}
                        onClick={
                          accessRightsToBeRemoved.includes(code)
                            ? () => setAccessRightsToBeRemoved(accessRightsToBeRemoved.filter(right => right !== code))
                            : () => setAccessRightsToBeRemoved([...accessRightsToBeRemoved, code])
                        }
                        size="small"
                        variant="outlined"
                      >
                        {accessRightsToBeRemoved.includes(code) ? 'Cancel removal' : 'Mark for removal'}
                      </Button>
                    ) : null}
                  </Stack>
                ))
              ) : (
                <Typography color="text.secondary">No degree programme access rights</Typography>
              )}
            </Stack>
          </CardContent>

          {isDefaultServiceProvider() && (
            <CardContent>
              <Stack alignItems="center" direction="row" gap={1}>
                <Typography component="h3" fontWeight="bold">
                  Current IAM group based degree programme access rights
                </Typography>
                <InfoBox content={userToolTips.iamGroupBasedAccess} mini />
              </Stack>
              {currentIamAccessRights.length > 0 ? (
                currentIamAccessRights.map(({ code, name, limited }) => (
                  <Stack direction="row" justifyContent="space-between" key={code}>
                    <Typography>{`${name} ${code}`}</Typography>
                    <Tooltip arrow placement="left" title={limited ? 'Limited rights' : 'Full rights'}>
                      {limited ? <WarningIcon color="warning" /> : <CheckCircleIcon color="success" />}
                    </Tooltip>
                  </Stack>
                ))
              ) : (
                <Typography color="text.secondary">No IAM based access rights</Typography>
              )}
            </CardContent>
          )}
        </>
      )}
    </Card>
  )
}
