import React, { useEffect, useState } from 'react'
import { Pagination } from 'semantic-ui-react'
import { SortableTable } from '.'

export const PaginatedSortableTable = ({ rowCount, ...props }) => {
  const [activePage, setActivePage] = useState(1)
  const { rowsPerPage } = props

  useEffect(() => {
    setActivePage(1)
  }, [rowCount])

  return (
    <>
      <Pagination
        activePage={activePage}
        onPageChange={(_, { activePage }) => setActivePage(activePage)}
        totalPages={Math.ceil(rowCount / rowsPerPage)}
      />
      <SortableTable {...props} pageNumber={activePage} />
    </>
  )
}
