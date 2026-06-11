import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        default: undefined
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: undefined
    },
    tweet:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
        default: undefined
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

likeSchema.pre("validate", function (next) {
    const targets = [this.video, this.comment, this.tweet].filter(Boolean);
    if (targets.length !== 1) {
        return next(new Error("A like must reference exactly one target"));
    }
    next();
});

likeSchema.index(
    { video: 1, likedBy: 1 },
    { unique: true, partialFilterExpression: { video: { $type: "objectId" } } }
);
likeSchema.index(
    { comment: 1, likedBy: 1 },
    { unique: true, partialFilterExpression: { comment: { $type: "objectId" } } }
);
likeSchema.index(
    { tweet: 1, likedBy: 1 },
    { unique: true, partialFilterExpression: { tweet: { $type: "objectId" } } }
);

export const Like = mongoose.model("Like", likeSchema);
 
