import React from 'react'
import { Button, Icon, Checkbox } from 'semantic-ui-react'
import FilterStatusCard from './FilterStatusCard'

const FilterControlPanel = ({ open, setOpen, noFilters }) => (
  <div id="filter-control-panel" className={open ? 'sidebar-open' : null}>
    <FilterStatusCard noFilters={noFilters} />
    <Checkbox toggle label="Disable Filters" />
    <Button color="red">
      <Icon name="window close outline" />
      Clear All Filters
    </Button>
    <Button secondary onClick={() => setOpen(false)} id="filter-close-button">
      <Icon name="angle double left" />
      Close Filters
    </Button>
  </div>
)

export default FilterControlPanel
