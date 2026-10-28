
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },
        tokenVersion: {
            type: Number,
            default: 0,
            select: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
