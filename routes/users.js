const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

// mongoose.connect("mongodb://127.0.0.1:27017/hacker");
mongoose.connect("mongodb+srv://sgrlekhwani:0dDFcZAP960BJTM7@cluster01.pk7yyl3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01")


const userSchema = mongoose.Schema({
  username:String,
  name: String,
  password: String,
  tasks: [
    {type: mongoose.Schema.Types.ObjectId, ref: "task"}
  ],
  isAdmin: {
    type: Boolean,
    default: false
  },
  email: String,
  number:String,
})

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);