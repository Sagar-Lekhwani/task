const mongoose = require("mongoose");


const taskSchema = mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    name:{
        type:String,
        required:true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Done'],
        default: 'Pending',
      }
    
})

module.exports = mongoose.model("task", taskSchema);