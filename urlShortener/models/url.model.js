import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
    {
        shortId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        redirectUrl: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        clickCount: {
            type: Number,
            default: 0
        },
        lastClickedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

const Url = mongoose.model('Url', urlSchema);

export default Url;
