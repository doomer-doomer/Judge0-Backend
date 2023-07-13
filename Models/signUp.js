const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose')


const signUpModel = mongoose.Schema(
    {
        user_id:{
            type:"UUID",
            default:()=>uuidv4()
        },
        username:{
            type:String,
            required:false
        },
        email:{
            type:String,
            required:[true,"Please enter an email"]
        },
        password:{
            type:String,
            required:[true,"Please enter some password"]
        }
    },
    {
        timestamps:true
    }
)

const signUp =  mongoose.model("Users",signUpModel);

module.exports = signUp;