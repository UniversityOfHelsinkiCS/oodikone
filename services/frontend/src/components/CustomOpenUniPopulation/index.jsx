import { useState } from 'react'
import { Message, Icon, Loader } from 'semantic-ui-react'

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
  if (isFetchingOrLoading) return <Loader active style={{ marginTop: '15em' }} />
  return (
    <div className="segmentContainer">
      <Message style={{ maxWidth: '800px', fontSize: '16px' }}>
        <Message.Header>Open uni student population</Message.Header>
        <p>
          Here you can create custom population using a list of courses. Clicking the blue button will open a modal
          where you can enter a list of courses. <br />
          <Icon color="green" fitted name="check" />: Student has passed the course. <br />
          <Icon color="red" fitted name="times" />: Student has failed the course. <br />
          <Icon color="grey" fitted name="minus" />: Student has enrolled, but has not received any grade from the
          course. <br />
          <b>Empty cell</b>: Student has no enrollments for the course. <br />
        </p>
      </Message>
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
      <div style={{ paddingTop: '25px' }}>
        {fieldValues && fieldValues.courseList?.length > 0 ? (
          <OpenUniPopulationResults fieldValues={fieldValues} />
        ) : null}
      </div>
    </div>
  )
}
