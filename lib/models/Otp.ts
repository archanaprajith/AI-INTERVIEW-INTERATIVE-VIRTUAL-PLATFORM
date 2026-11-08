import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    code: string;
    createdAt: Date;
}

const OtpSchema: Schema = new Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    // OTPs expire after 5 minutes (300 seconds)
    createdAt: { type: Date, default: Date.now, expires: 300 }
});

export default mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
