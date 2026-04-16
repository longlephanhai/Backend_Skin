
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/types';
import bcrypt from "bcryptjs";
import { CreateUserDto } from 'src/users/dto/create-user.dto';
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        const isPasswordValid = user && bcrypt.compareSync(password, user.password);
        if (user && isPasswordValid) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }

    async login(user: IUser) {
        const payload = {
            email: user.email,
            sub: user._id,
            fullName: user.fullName,
        };
        return {
            user: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                age: user.age,
                gender: user.gender
            },
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(user: CreateUserDto) {
        const isExist = await this.usersService.findByEmail(user.email);
        if (isExist) {
            throw new BadRequestException('Email already exists');
        }
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(user.password, salt);
        const newUser = await this.usersService.create({
            ...user,
            password: hashPassword
        })
        return newUser;
    }


}
