const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');

const submissionsModel = mongoose.Schema(
    {
        submisson_id: {
            type: "UUID",
            default: () => uuidv4()
        },
        user_id:{
            type:"UUID",
            required:[true,"User id is required"]
        },
        
        language_id:{
            type:Number,
            required:[true,"Please enter a language id"]
        },
        source_code:{
            type:String,
            required:[true,"Please enter some code"]
        },
        results:{
            type:String,
            required:false,
            default:""
        }
    },
    {
        timestamps:true
    }
)

const submissons =  mongoose.model("Submissions",submissionsModel);

module.exports = submissons;