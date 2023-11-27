import React, { useState } from 'react'
import { Button, Message } from 'semantic-ui-react'

import { transferredToProgrammeFilter } from '../FilterView/filters'
import { useFilters } from '../FilterView/useFilters'

export const FilterActiveNote = () => {
  const { filterDispatch } = useFilters()
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(true)
    filterDispatch(transferredToProgrammeFilter.actions.set(null))
  }

  if (clicked) return true

  return (
    <Message color="blue" style={{ marginTop: '2.25rem' }}>
      By default only students who have not transferred to this study programme are shown.
      <div style={{ marginTop: '1rem' }}>
        <Button primary disabled={clicked} onClick={handleClick}>
          Show all
        </Button>
      </div>
    </Message>
  )
}
