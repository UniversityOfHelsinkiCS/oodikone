import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import MinusIcon from '@mui/icons-material/Remove'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import { Loading } from '@/components/Loading'
import { DateFormat } from '@/constants/date'
import { useTitle } from '@/hooks/title'
import { useGetSavedSearchesQuery } from '@/redux/openUniPopulations'
import { formatDate } from '@/util/timeAndDate'
import { CustomOpenUniSearch } from './CustomOpenUniSearch'
import { OpenUniPopulationResults } from './OpenUniPopulationResults'

export const CustomOpenUniPopulation = () => {
  useTitle('Custom open uni population')
  const [fieldValues, setValues] = useState({})
  const savedSearches = useGetSavedSearchesQuery()
  const isFetchingOrLoading = savedSearches.isLoading || savedSearches.isFetching
  const isError = savedSearches.isError || (savedSearches.isSuccess && !savedSearches.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading) return <Loading active style={{ marginTop: '15em' }} />
  return (
    <Stack
      sx={{
        display: 'flex',
        mx: 'auto',
        alignItems: 'center',
        width: '100%',
        maxWidth: 'md',
      }}
    >
      <Alert icon={false} severity="info" style={{ maxWidth: '800px' }} variant="outlined">
        <Typography variant="h6">Open uni student population</Typography>
        Here you can create custom population using a list of courses. Clicking the blue button will open a modal where
        you can enter a list of courses. <br />
        <Typography sx={{ display: 'flex' }}>
          <CheckIcon color="success" />: Student has passed the course. <br />
        </Typography>
        <Typography sx={{ display: 'flex' }}>
          <CloseIcon color="error" />: Student has failed the course. <br />
        </Typography>
        <Typography sx={{ display: 'flex' }}>
          <MinusIcon color="disabled" />: Student has enrolled, but has not received any grade from the
        </Typography>
        course. <br />
        <b>Empty cell</b>: Student has no enrollments for the course. <br />
      </Alert>
      <CustomOpenUniSearch savedSearches={savedSearches.data} setValues={setValues} />
      <div style={{ paddingTop: '25px', paddingBottom: '10px', fontSize: '20px' }}>
        {fieldValues && fieldValues.courseList?.length > 0 ? (
          <p>
            <span style={{ color: '#484848' }}>Beginning of the search for all fields:</span>
            <span style={{ paddingLeft: '10px', fontWeight: '600' }}>
              {formatDate(fieldValues.startdate, DateFormat.DISPLAY_DATE)}
            </span>
            <br />
            <span style={{ color: '#484848' }}>End of the search for enrollments:</span>
            <span style={{ paddingLeft: '30px', fontWeight: '600' }}>
              {formatDate(fieldValues.enddate, DateFormat.DISPLAY_DATE)}
            </span>
          </p>
        ) : null}
      </div>
      <div data-cy="open-uni-table-div" style={{ width: '100%' }}>
        {fieldValues && fieldValues.courseList?.length > 0 ? (
          <OpenUniPopulationResults fieldValues={fieldValues} />
        ) : null}
      </div>
    </Stack>
  )
}
