
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
        if (user && user.password === password) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: IUser) {
        const payload = { email: user._id, sub: user._id };
        return {
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
