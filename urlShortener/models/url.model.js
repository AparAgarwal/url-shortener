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
        expiresAt: {
            type: Date,
            default: null
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

// TTL index to automatically delete expired URLs
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Url = mongoose.model('Url', urlSchema);

export default Url;
