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
    SKIN_REDNESS = 'Skin-Redness',
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

