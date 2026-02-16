import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema(
    {
        guestId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        ipAddress: {
            type: String
        },
        userAgent: {
            type: String
        },
        urlCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const Guest = mongoose.model('Guest', guestSchema);

export default Guest;
