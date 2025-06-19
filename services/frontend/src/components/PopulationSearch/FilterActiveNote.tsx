import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import blue from '@mui/material/colors/blue'
import { useState } from 'react'

import { transferredToProgrammeFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'

export const FilterActiveNote = () => {
  const { filterDispatch } = useFilters()
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(true)
    filterDispatch(transferredToProgrammeFilter.actions.set(null))
  }

  if (clicked) return <></>

  return (
    <Card sx={{ mt: '2.25rem', backgroundColor: blue[50] }} variant="outlined">
      <CardContent>By default only students who have not transferred to this study programme are shown.</CardContent>
      <CardActions>
        <Button disabled={clicked} onClick={handleClick} variant="contained">
          Show all
        </Button>
      </CardActions>
    </Card>
  )
}
