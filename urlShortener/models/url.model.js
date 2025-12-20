import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    shortId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    redirectUrl: {
        type: String,
        required: true,
    }
}, {timestamps: true});

const Url = mongoose.model("Url", urlSchema);

export default Url;