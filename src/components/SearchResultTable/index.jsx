import React from 'react';
import { Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const {
  arrayOf, string, object, func
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
        rows.map(row => (
          <Table.Row
            key={`row-${Object.values(row)[0]}`}
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


const SearchResultTable = ({ headers, rows, rowClickFn }) => {
  if (rows.length > 0) {
    return (
      <Table
        singleLine
        unstackable
        selectable
      >
        {getHeaderRow(headers)}
        {getTableBody(rows, rowClickFn)}
      </Table>);
  }
  return null;
};


SearchResultTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(object).isRequired,
  rowClickFn: func.isRequired
};

export default SearchResultTable;
