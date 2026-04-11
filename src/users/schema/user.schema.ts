
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Gender, SkinCondition } from 'src/types';


export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true })
    age: number;

    @Prop({ required: true, enum: Gender })
    gender: Gender

    @Prop({ required: true, type: [String], enum: SkinCondition })
    currentSkinTags: SkinCondition[];

    @Prop()
    avatar?: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
