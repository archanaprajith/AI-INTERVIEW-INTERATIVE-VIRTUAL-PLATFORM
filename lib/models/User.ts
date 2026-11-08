import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name: string;
    password?: string;
    college?: string;
    course?: string;
    skills?: string[];
    cvUrl?: string;
    targetRole?: string;
    experience?: string;
    isAdmin?: boolean;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String },
    college: { type: String },
    course: { type: String },
    skills: [{ type: String }],
    cvUrl: { type: String },
    targetRole: { type: String },
    experience: { type: String },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
