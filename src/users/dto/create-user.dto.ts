import { Gender, SkinCondition } from "src/types";
import { IsEmail, IsNotEmpty } from 'class-validator';
export class CreateUserDto {
    @IsEmail({}, { message: "Invalid email format" })
    @IsNotEmpty({ message: "Email is required" })
    email: string;


    @IsNotEmpty({ message: "Password is required" })
    password: string;

    @IsNotEmpty({ message: "Full name is required" })
    fullName: string;

    @IsNotEmpty({ message: "Age is required" })
    age: number;

    @IsNotEmpty({ message: "Gender is required" })
    gender: Gender


    currentSkinTags?: SkinCondition[];


    avatar?: string;


    isActive: boolean;
}
