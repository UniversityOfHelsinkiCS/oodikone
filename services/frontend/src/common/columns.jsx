import { Icon, Popup } from 'semantic-ui-react'

import { StudentInfoItem } from '@/components/common/StudentInfoItem'

export const getCopyableStudentNumberColumn = ({
  popupStates,
  copyItemsToClipboard,
  handlePopupOpen,
  handlePopupClose,
  fieldName,
}) => {
  return {
    key: 'studentnumber',
    forceToolsMode: 'dangling',
    textTitle: 'Student number',
    title: (
      <>
        Student number
        <Popup
          content="Copied student numbers!"
          on="click"
          onClose={() => handlePopupClose('studentnumbers')}
          onOpen={() => handlePopupOpen('studentnumbers')}
          open={popupStates.studentnumbers}
          position="top right"
          trigger={
            <Icon
              color="grey"
              link
              name="copy"
              onClick={event => copyItemsToClipboard(event, fieldName)}
              size="large"
              style={{ float: 'right', marginLeft: '0.25em' }}
              title="Click here to copy all student numbers onto your clipboard"
            />
          }
        />
      </>
    ),
    getRowVal: student => (!student.obfuscated ? student.studentNumber : 'hidden'),
    getRowContent: student => <StudentInfoItem showSisuLink student={student} />,
  }
}

export const getCopyableEmailColumn = ({
  copyItemsToClipboard,
  fieldName,
  handlePopupClose,
  handlePopupOpen,
  popupStates,
}) => {
  return {
    mergeHeader: true,
    merge: true,
    key: 'email',
    export: false,
    sortable: false,
    children: [
      {
        key: 'emailValue',
        sortable: false,
        title: (
          <>
            Email
            <Popup
              content="Copied email list!"
              on="click"
              onClose={() => handlePopupClose('emails')}
              onOpen={() => handlePopupOpen('emails')}
              open={popupStates.emails}
              position="top right"
              trigger={
                <Icon
                  color="grey"
                  link
                  name="copy"
                  onClick={event => copyItemsToClipboard(event, fieldName)}
                  size="large"
                  style={{ marginLeft: '0.25em' }}
                  title="Click here to copy all emails onto your clipboard"
                />
              }
            />
          </>
        ),
        textTitle: 'Email',
        getRowVal: student => student.email,
      },
      {
        key: 'copyEmail',
        sortable: false,
        getRowContent: student =>
          student.email &&
          !student.obfuscated && (
            <Popup
              content="Email copied!"
              on="click"
              onClose={() => handlePopupClose(student.studentNumber)}
              onOpen={() => handlePopupOpen(student.studentNumber)}
              open={popupStates[student.studentNumber]}
              position="top right"
              trigger={<Icon link name="copy outline" onClick={() => navigator.clipboard.writeText(student.email)} />}
            />
          ),
      },
    ],
  }
}

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
