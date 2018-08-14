const nodemailer = require('nodemailer')



// NB! Store the account object values somewhere if you want
// to re-use the same account for future mail deliveries

// Create a SMTP transporter object
const transporter = nodemailer.createTransport(
  {

    from: 'Oodikone Robot <noreply@helsinki.fi>',
    host: 'smtp.helsinki.fi',
    port: 587,
    secure: false // false -> TLS, true -> SSL
    ,
    logger: false,
    debug: false // include SMTP traffic in the logs
  },
  {

    from: 'Oodikone Robot <noreply@helsinki.fi>'
  }
)

const message = user => {
  return ({
    to: 'Toska <grp-toska@helsinki.fi>',
    subject: 'New user in Oodikone ✔',
    text: `${user} just logged into oodikone for the first time!`,
    html: `<p>${user} just logged into oodikone for the first time! </p>`,
    attachments: [
      {
        filename: 'toska.png',
        path: `${process.cwd()}/assets/toska.png`,
        cid: 'toskalogoustcid'
      }
    ]
  })
}

module.exports = { transporter, message }