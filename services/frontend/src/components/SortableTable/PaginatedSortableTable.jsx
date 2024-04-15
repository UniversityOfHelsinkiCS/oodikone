import React, { useEffect, useState } from 'react'
import { Icon, Pagination } from 'semantic-ui-react'
import { SortableTable } from '.'

export const PaginatedSortableTable = ({ rowCount, ...props }) => {
  const [activePage, setActivePage] = useState(1)
  const { rowsPerPage } = props

  useEffect(() => {
    setActivePage(1)
  }, [rowCount])

  const showPagination = rowCount > rowsPerPage

  return (
    <>
      {showPagination && (
        <Pagination
          activePage={activePage}
          ellipsisItem={{ content: <Icon name="ellipsis horizontal" />, icon: true }}
          firstItem={{ content: <Icon name="angle double left" />, icon: true }}
          lastItem={{ content: <Icon name="angle double right" />, icon: true }}
          nextItem={{ content: <Icon name="angle right" />, icon: true }}
          onPageChange={(_, { activePage }) => setActivePage(activePage)}
          prevItem={{ content: <Icon name="angle left" />, icon: true }}
          totalPages={Math.ceil(rowCount / rowsPerPage)}
        />
      )}
      <SortableTable {...props} pageNumber={activePage} />
    </>
  )
}
