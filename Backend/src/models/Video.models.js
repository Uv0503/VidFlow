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
    category: {
        type: String,
        trim: true,
        default: "General",
        enum: {
            values: ["General", "Education", "Technology", "Gaming", "Music", "Entertainment", "Sports", "News", "Howto & Style", "Travel"],
            message: "Category must be one of the supported categories"
        },
        index: true
    },
    tags: {
        type: [String],
        default: [],
        set: (tags) => tags.map((tag) => tag.trim().toLowerCase())
    },
    isPublished:{
        type:Boolean,
        default:true,
        index: true
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)//this lets to use aggregate queries now by plugging in like app.use
videoSchema.index({ tags: 1 });
videoSchema.index({ isPublished: 1, createdAt: -1 });



export const Video= mongoose.model("Video",videoSchema)
