import React from 'react'

export const NoDataMessage = ({ message }) => {
  return (
    <div className="no-data-message">
      <h3>{message}</h3>
    </div>
  )
}
