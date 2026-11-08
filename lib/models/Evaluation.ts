import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluation extends Document {
    answerId: string;
    contentScore: number; // 0-100
    clarityScore: number; // 0-100
    confidenceScore: number; // 0-100
    completenessScore: number; // 0-100
    feedbackText: string;
    strengths: string[];
    improvements: string[];
    idealAnswer?: string;
    evaluatedAt: Date;
}

const EvaluationSchema: Schema = new Schema({
    answerId: { type: String, required: true },
    contentScore: { type: Number, required: true },
    clarityScore: { type: Number, required: true },
    confidenceScore: { type: Number, required: true },
    completenessScore: { type: Number, required: true },
    feedbackText: { type: String, required: true },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    idealAnswer: { type: String, default: "" },
    evaluatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
