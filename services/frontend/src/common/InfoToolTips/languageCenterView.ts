export const languageCenterViewToolTips = {
  main: `
    This view displays amounts of enrollments and completions of courses organized by language center.
    You can view the numbers by faculties or by semesters.
  `,
  open: `
    - **Show number of:**
    \t- Completions: Amount of passed completions of a course
    \t- Enrollments: Amount of accepted enrollments on a course
    \t- Enrollments exceeding completions: For every course per semester, the amount of accepted enrollments that exceeded the amount of completions.
    \t- Rejected: Amount of rejected enrollments on a course
    - **Coloring mode:** Change this to compare a course's popularity to other courses, or to its own average

    Tips:
    - Hover your mouse over the faculty column header to see the name of the faculty. The same is possible with long course names.
    - Click the column headers to sort by the column, or click the filter icon (appears when hovering mouse on column header) to set a filter on that column.
    - **Example of viewing all courses of a language**: Click the filter icon. Type "KK-ESP" and press enter. Now only the courses whose code contains "KK-ESP" will be shown. Notice that the total-row on top of the table still shows numbers from all courses.
  `,
  footer: `
    This is a new feature. Suggestions for improvement or questions are welcomed to grp-toska@helsinki.fi or via the <a href="https://oodikone.helsinki.fi/feedback">feedback form</a>.
  `,
}
