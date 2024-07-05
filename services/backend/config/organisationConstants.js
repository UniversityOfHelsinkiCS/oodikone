const allFacultyCodes = [
  'H10',
  'H20',
  'H30',
  'H40',
  'H50',
  'H55',
  'H57',
  'H60',
  'H70',
  'H74',
  'H80',
  'H90',
  'H92',
  'H930',
  'H99',
  'Y',
  'Y01',
]

const magicFacultyCode = 'H50'

const ignoredFacultyCodes = ['Y', 'H99', 'Y01', 'H92', 'H930']

module.exports = {
  facultyCodes: allFacultyCodes,
  magicFacultyCode,
  ignoredFacultyCodes,
}
