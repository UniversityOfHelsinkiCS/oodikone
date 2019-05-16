const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: false, useFindAndModify: false })


const scheduleSchema = new mongoose.Schema(
  {
    task: String,
    status: String,
    type: String,
    active: Boolean,
    updatedAt: Date
  }
)

module.exports = mongoose.model('Schedule', scheduleSchema) 