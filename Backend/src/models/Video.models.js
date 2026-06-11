import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema= new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    duration:{
        type:Number,//cloudinary url
        required:true
    },
    views:{
        type:Number,
        default:0,
        required:true
    },
    viewedBy:{
        type:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }],
        default:[],
        select:false
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    username:{
        type:String,
        required:true
    },
    videoFile:{
        type:String,//cloudinary url    
        required:[true,"Video is required"]
    },
    thumbnail:{
        type:String,
        required:true
    },
    isPublished:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)//this lets to use aggregate queries now by plugging in like app.use



export const Video= mongoose.model("Video",videoSchema)
