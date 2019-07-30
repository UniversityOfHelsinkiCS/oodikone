import React, { useState } from 'react'
import moment from 'moment'
import { sortBy } from 'lodash'
import { Segment, Form, Header } from 'semantic-ui-react'

const SearchHistory = ({ items, handleSearch }) => {
  const [ selected, setSelected ] = useState(null)

  const sortedItems = sortBy(items, i => -new Date(i.timestamp).getTime())

  const handleChange = (e, { value }) => {
    setSelected(value)
    handleSearch(sortedItems[value - 1].params)
  }

  return (
    <Segment>
      <Form>
        <Header content='Previous searches' icon='clock outline' />
        <Form.Dropdown
          placeholder='Select a previous search'
          noResultsMessage='No previous searches'
          search
          selection
          value={selected}
          options={sortedItems.map(({ text, timestamp }, i) => ({ key: i + 1, value: i + 1, text, description: moment(timestamp).format('DD.MM	LT')}))}
          onChange={handleChange}
          closeOnChange
          clearable
          fluid
          selectOnBlur={false}
          selectOnNavigation={false}
        />
      </Form>
    </Segment>
  )
}

export default SearchHistory
