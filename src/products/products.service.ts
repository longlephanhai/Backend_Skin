import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from 'node_modules/@nestjs/mongoose/dist';
import { Product } from './schema/product.schema';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) { }

  async create(createProductDto: CreateProductDto) {
    const { name, description, category, price, imageUrl } = createProductDto;
    const isExits = await this.productModel.findOne({ name });
    if (isExits) {
      throw new BadRequestException('Product already exists');
    }
    const newProduct = await this.productModel.create({
      name,
      description,
      category,
      price,
      imageUrl
    })
    return newProduct;
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
