import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other'
}

export enum SkinCondition {
    ACNE = 'Acne',
    BLACKHEADS = 'Blackheads',
    DARK_SPOTS = 'Dark-Spots',
    DRY_SKIN = 'Dry-Skin',
    ENLARGED_PORES = 'Englarged-Pores',
    EYEBAGS = 'Eyebags',
    OILY_SKIN = 'Oily-Skin',
    WHITEHEADS = 'Whiteheads',
    WRINKLES = 'Wrinkles'
}

export interface IUser {
    _id: string;
    email: string;
    password: string;
    fullName: string;
    age: number;
    gender: Gender,
    currentSkinTags: SkinCondition[],
    avatar?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDetectionDetail {
    label: SkinCondition;
    confidence: number;
    bbox: [number, number, number, number];
    crop_url: string;
}

export interface IViewResult {
    total: number;
    stats: Partial<Record<SkinCondition, number>>;
    detections: IDetectionDetail[];
    visualization_url: string;
}

export interface IDetection {
    _id: string;
    userId: string;
    session_id: string;
    total_acne: number;
    stats: Partial<Record<SkinCondition, number>>;
    results: {
        front: IViewResult;
        left: IViewResult;
        right: IViewResult;
    };
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICloudinaryRender {
    url: string;
    public_id: string;
}

type TaskTag =
    | 'cleanser'
    | 'treatment'
    | 'moisturizer'
    | 'suncare'
    | 'lifestyle'
    | 'diet'
    | 'assessment';

type TaskTimeOfDay = 'morning' | 'evening' | 'weekly' | 'anytime';

interface ISkinTask {
    name: string;
    timeOfDay: TaskTimeOfDay;
    tag: TaskTag;
    frequency: string;
}

interface IWeekTimeline {
    week: number;
    focus: string;
    tasks: ISkinTask[];
}