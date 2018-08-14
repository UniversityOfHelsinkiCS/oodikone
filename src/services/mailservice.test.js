const mailservice = require('./mailservice')

test('pilipali', () => {
  const message = mailservice.message('aids')
  expect(message).toEqual({
    to: 'Toska <grp-toska@helsinki.fi>',
    subject: 'New user in Oodikone ✔',
    text: 'aids just logged into oodikone for the first time!',
    html: '<p>aids just logged into oodikone for the first time! </p>',
    attachments: [
      {
        filename: 'toska.png',
        path: '/home/local/sasumaki/toska/oodikone2-backend/assets/toska.png',
        cid: 'toskalogoustcid'
      }
    ]
  })
})