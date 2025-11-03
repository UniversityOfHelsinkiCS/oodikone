# SortableTable-documentation

Properties are optional unless they are in **bold**.

### Table settings (as props to component)

| Property             | Explanation                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| tableId              | id-property of the `<table>` tag                                                                              |
| title                | Table title                                                                                                   |
| featureName          | Describes the feature in the Excel filename: "oodikone*{featureName}*{timeStamp}.xlsx". Defaults to "export"  |
| **data**             | Array of data items                                                                                           |
| **columns**          | Array of columns, see fields of columns below                                                                 |
| actions              | JSX to add in the top right corner of the table, for example buttons                                          |
| hideHeaderBar        | Hides the header bar that has a table icon, title, fullscreen button and menu/buttons                         |
| striped              | The style where every other row is grey. Boolean, default is true.                                            |
| firstColumnSticky    | Boolean, default is false. If true, the first column is sticky                                                |
| defaultSort          | [columnkey, order] of default sort column and order. For example ['name', 'desc']                             |
| toggleGroupExpansion | Function which is called when group of rows is collapsed or expanded                                          |
| expandedGroups       | Array (or set?) of keys of rows are supposed to be expanded. These two are used only in population of courses |

### Column/header settings

Properties of objects in columns-prop array

| Property       | Explanation                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **key**        | Column key, unique                                                                                                                                                         |
| **title**      | Column header title (`<th>`). Can be either string or JSX. For string title, newlines are replaced by space for export.                                                    |
| textTitle      | Required for excel, if title is JSX. Set to null to exclude a parent header from export                                                                                    |
| headerProps    | These are internally given to header as: `<th> {...headerProps}>`                                                                                                          |
| sortable       | Set to false if you want to disable column sorting. If multiple columns merged, set it to all                                                                              |
| filterable     | Same as sortable but for filter                                                                                                                                            |
| forceToolsMode | Forces the filter and sort tools in header to either 'dangling', 'floating' or 'fixed'                                                                                     |
| helpText       | If defined, shows question mark in header, which displays the helpText on hover                                                                                            |
| thickBorders   | If true, adds thicker border to right side of column                                                                                                                       |
| export         | Set to false to omit this AND children from excel export. Notice: To only hide parent header, use `textTitle: null`                                                        |
| children       | Column objects. If this is defined, the column object is only a header, and you should only use cell value getters (getRowVal etc) in columns where children is undefined. |
| displayColumn  | Set to false to hide whole column. Does not affect exporting                                                                                                               |
| vertical       | If true, header is vertical                                                                                                                                                |
| noHeader       | Just removes header, I think (not sure of the point of this, since you can just omit title)                                                                                |

### Cell settings

Properties that set cell content or options. Can receive either a value, or a function that takes data item as an argument, and returns value for specific row (for example student => student.studentNumber)

| Property        | Explanation                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| cellProps       | Given to each cell like <td {...cellProps}>. Use for style, hover title, etc.                                                                                                                    |
| cellStyle       | Basically shorthand for cellProps: { style: ... }                                                                                                                                                |
| filterType      | Options are 'date', 'range' and 'multi' (or default if left empty). Check the filters folder for examples and documentation (at least multiSelectFilter.jsx has a good description how it works) |
| getRowVal       | Get single cell value. This will be used for sorting and filtering, and displayed unless overridden.                                                                                             |
| getRowContent   | Single cell JSX: Overrides getRowVal for value to display, but does not affect excel                                                                                                             |
| getRowExportVal | Overrides getRowVal for excel                                                                                                                                                                    |
| formatValue     | Same as getRowContent, but avoids recalculating value already calculated in getRowVal. Gets one argument which is the return of getRowVal.                                                       |

### Miscellaneous info & tips

**Single rows can ignore filters or sorting by row options**.

To do this, import row-function from SortableTable-folder, and create data row with it (instead of just value as normally). For example, data can be set like this to have a totals-row on the top:

`[row(totals, { ignoreFilters: true, ignoreSorting: true }), ...students]`
