import React, { useState } from 'react'
import useFilters from '../../components/FilterTray/useFilters'
import { Button, Message } from 'semantic-ui-react'

const FilterActiveNote = () => {
  const { removeFilter } = useFilters()
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(true)
    removeFilter('transferredToProgrammeFilter')
  }

  if (clicked) return true

  return (
    <Message color="blue" style={{ marginTop: '2.25rem' }}>
      <Message.Header>Note:</Message.Header>
      By default only students who have not transferred to this study programme are shown.
      <div style={{ marginTop: '1rem' }}>
        <Button primary disabled={clicked} onClick={handleClick}>
          Show all
        </Button>
      </div>
    </Message>
  )
}

export default FilterActiveNote
