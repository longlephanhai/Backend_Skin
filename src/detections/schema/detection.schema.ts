import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/users/schema/user.schema';
import { SkinCondition } from 'src/types'; // Import Enum từ file types

export type DetectionDocument = HydratedDocument<Detection>;

@Schema({ _id: false })
class DetectionDetail {
    @Prop({ type: String, enum: SkinCondition })
    label: SkinCondition;

    @Prop()
    confidence: number;

    @Prop({ type: [Number] })
    bbox: number[];

    @Prop()
    crop_url: string;
}

@Schema({ _id: false })
class ViewResult {
    @Prop()
    total: number;

    @Prop({ type: Object })
    stats: Record<string, number>;

    @Prop({ type: [DetectionDetail] })
    detections: DetectionDetail[];

    @Prop()
    visualization_url: string;
}

@Schema({ timestamps: true })
export class Detection {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true })
    user: mongoose.Types.ObjectId;

    @Prop({ required: true, unique: true })
    session_id: string;

    @Prop({ required: true })
    total_acne: number;

    @Prop({ type: Object })
    stats: Record<string, number>;

    @Prop({
        type: {
            front: { type: Object },
            left: { type: Object },
            right: { type: Object }
        }
    })
    results: {
        front: ViewResult;
        left: ViewResult;
        right: ViewResult;
    };

}

export const DetectionSchema = SchemaFactory.createForClass(Detection);