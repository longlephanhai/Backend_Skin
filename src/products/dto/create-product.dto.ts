import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    @IsNotEmpty({ message: 'Category is required' })
    category: string;

    @IsNotEmpty({ message: 'Price is required' })
    price: number;

    @IsNotEmpty({ message: 'Image URL is required' })
    imageUrl: string;
}
