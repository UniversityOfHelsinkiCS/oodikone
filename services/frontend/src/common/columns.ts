export const hiddenNameAndEmailForExcel = [
  {
    key: 'hidden-lastname',
    title: 'Last name',
    getRowVal: student => student.lastname,
    export: true,
  },
  {
    key: 'hidden-firstnames',
    title: 'First names',
    getRowVal: student => student.firstnames,
    export: true,
  },
  {
    key: 'hidden-email',
    title: 'Email',
    getRowVal: student => student.email ?? '',
    export: true,
  },
  {
    key: 'hidden-secondary-email',
    title: 'Secondary email',
    getRowVal: student => student.secondaryEmail ?? '',
    export: true,
  },
]
