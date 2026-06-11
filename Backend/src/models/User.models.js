import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt  from "jsonwebtoken";

const userSchema= new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true//to enable a serching field
    },
    email:{ 
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
         trim:true,
        index:true
    },
    avatar:{
        type:String,//cloudinary url
        required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:{
        type:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ]
    },
    password:{
        type:String,
        required:[true,"Password is required"],
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})

userSchema.pre("save",async function (next) {//here save is a method//dont use arrow fn here coz we need to use this operator here
    if(!this.isModified("password")) return next();
     
    this.password=await bcrypt.hash(this.password,10);
    next();
}  )

// by this we can create custom methods
    userSchema.methods.isPasswordCorrect= async function (password) {
        const result= await bcrypt.compare(password,this.password);
        // console.log(result)
        return result;//password is normal and this.password is encrypted one
    }

userSchema.methods.genrateAccessToken = function(){
    return jwt.sign(
        {//payload
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        }
        ,process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
userSchema.methods.genrateRefreshToken = function(){
    return jwt.sign(
        {//payload
            _id:this._id,
        }
        ,process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User= mongoose.model("User",userSchema);