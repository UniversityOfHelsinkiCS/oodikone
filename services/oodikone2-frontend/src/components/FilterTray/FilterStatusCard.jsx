import React from 'react'
import PropTypes from 'prop-types'
import { Card } from 'semantic-ui-react'

const FilterStatusCard = ({ noFilters }) => (
  <Card id="filter-status">
    <Card.Content>
      {noFilters > 0 ? (
        <Card.Description className="filters-are-active">{`${noFilters} filter${
          noFilters > 1 ? 's' : ''
        } active.`}</Card.Description>
      ) : (
        <Card.Description>No filters active.</Card.Description>
      )}
    </Card.Content>
  </Card>
)

FilterStatusCard.propTypes = {
  noFilters: PropTypes.number.isRequired
}

export default FilterStatusCard
