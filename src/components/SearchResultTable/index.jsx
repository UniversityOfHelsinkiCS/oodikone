import React from 'react';
import { Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

import styles from './searchResultsTable.css';

const {
  arrayOf, string, object, func, bool
} = PropTypes;


const getHeaderRow = headers => (
  <Table.Header>
    <Table.Row>
      {
          headers.map(header => (
            <Table.HeaderCell key={`header-${header}`}>
              {header}
            </Table.HeaderCell>
          ))
        }
    </Table.Row>
  </Table.Header>
);

const getTableBody = (rows, rowClickFn, selectable) => (
  <Table.Body>
    {
        rows.map((row, i) => (
          <Table.Row
            className={(selectable ? styles.selectableRow : '')}
            key={`row-${i}`} // eslint-disable-line react/no-array-index-key
            onClick={e => rowClickFn(e, row)}
          >
            {
              Object.values(row).map((value, index) => (
                <Table.Cell key={`cell-${index}`}>{value}</Table.Cell> // eslint-disable-line react/no-array-index-key
              ))
              }
          </Table.Row>
        ))
      }
  </Table.Body>
);

const SearchResultTable = ({
  headers, rows, rowClickFn, noResultText, selectable, definition
}) => {
  if (rows.length > 0) {
    return (
      <Table
        singleLine
        unstackable
        selectable={selectable}
        definition={definition}
      >
        {getHeaderRow(headers)}
        {getTableBody(rows, rowClickFn, selectable)}
      </Table>);
  }
  return <div>{noResultText}</div>;
};

SearchResultTable.defaultProps = {
  rowClickFn: () => null,
  selectable: false,
  definition: false
};

SearchResultTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(object).isRequired,
  rowClickFn: func,
  noResultText: string.isRequired,
  selectable: bool,
  definition: bool
};

export default SearchResultTable;
