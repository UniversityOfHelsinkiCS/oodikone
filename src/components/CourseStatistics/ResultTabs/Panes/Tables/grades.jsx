import React from 'react'
import { arrayOf, number, oneOfType, shape, string } from 'prop-types'
import { Header } from 'semantic-ui-react'

const GradesTable = ({ stats, name }) => {
  console.log(stats)

  return (
    <div>
      <Header as="h3" content={name} textAlign="center" />

    </div>
  )
}
GradesTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}
export default GradesTable
