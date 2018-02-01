import React from 'react';
import { Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

import styles from './searchResultsTable.css';

const {
  arrayOf, string, object, func, boolean
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

const getTableBody = (rows, rowClickFn) => (
  <Table.Body>
    {
        rows.map((row, i) => (
          <Table.Row
            className={styles.tableRow}
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
  headers, rows, rowClickFn, noResultText, selectable
}) => {
  if (rows.length > 0) {
    return (
      <Table
        singleLine
        unstackable
        selectable={selectable}
      >
        {getHeaderRow(headers)}
        {getTableBody(rows, rowClickFn)}
      </Table>);
  }
  return <div>{noResultText}</div>;
};

SearchResultTable.defaultProps = {
  rowClickFn: () => null,
  selectable: false
};

SearchResultTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(object).isRequired,
  rowClickFn: func,
  noResultText: string.isRequired,
  selectable: boolean
};

export default SearchResultTable;
