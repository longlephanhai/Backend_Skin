import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from 'node_modules/@nestjs/mongoose/dist';
import { Product } from './schema/product.schema';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from 'node_modules/@nestjs/config';

@Injectable()
export class ProductsService {

  private genAI: GoogleGenerativeAI;
  private genAiProModel: any;

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private configService: ConfigService
  ) {
    this.genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY')!);
    this.genAiProModel = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
  }

  async create(createProductDto: CreateProductDto) {
    const { name, description, instructions, category, price, imageUrl } = createProductDto;
    const isExits = await this.productModel.findOne({ name });
    if (isExits) {
      throw new BadRequestException('Product already exists');
    }
    const newProduct = await this.productModel.create({
      name,
      description,
      instructions,
      category,
      price,
      imageUrl
    })
    return newProduct;
  }

  async recommend(resultPredict: any) {
    const products = await this.productModel.find();
    const productData = products.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      instructions: p.instructions,
      category: p.category,
      price: p.price,
      imageUrl: p.imageUrl
    }));

    // 2. Chắt lọc dữ liệu từ kết quả AI (JSON bạn gửi)
    const skinStats = resultPredict.stats || {};
    const totalAcne = resultPredict.total_acne || 0;

    const detailedDetections = [];
    const views = ['front', 'left', 'right'];

    // Lặp qua results.front, results.left, results.right
    views.forEach(view => {
      const detections = resultPredict.results?.[view]?.detections;
      if (Array.isArray(detections)) {
        detections.forEach(det => {
          detailedDetections.push(
            `- ${det.label} (${(det.confidence * 100).toFixed(0)}%) ở góc nhìn ${view}`
          );
        });
      }
    });

    // 3. Xây dựng Prompt chuyên sâu
    const prompt = `
    Bạn là một chuyên gia tư vấn da liễu. Hãy phân tích dữ liệu soi da sau:
    - Thống kê tổng quát: ${JSON.stringify(skinStats)} (Tổng số vấn đề: ${totalAcne}).
    - Chi tiết các vùng phát hiện: 
    ${detailedDetections.join('\n')}

    Dưới đây là danh sách sản phẩm có sẵn:
    ${JSON.stringify(productData)}

    YÊU CẦU:
    1. Nhận xét cực kỳ ngắn gọn về tình trạng da (1-2 câu).
    2. Chọn 2-3 sản phẩm phù hợp nhất.
    3. Với mỗi sản phẩm, trả về: productId, productName, reason (lý do chọn), và usage (hướng dẫn sử dụng).

    YÊU CẦU TRẢ VỀ JSON (KHÔNG VIẾT CHỮ NGOÀI JSON):
    {
      "analysis": "Lời nhận xét",
      "recommendations": [
        {
          "productId": "id",
          "productName": "tên",
          "reason": "lý do",
          "usage": "cách dùng chi tiết",
          "imageUrl": "url ảnh sản phẩm"
        }
      ]
    }`;
    try {
      const result = await this.genAiProModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const rawText = result.response.text();
      const jsonStart = rawText.indexOf("{");
      const jsonEnd = rawText.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
      }
      throw new Error("Không tìm thấy JSON");
    } catch (error) {
      console.error("Lỗi Gemini:", error);
      return {
        analysis: "Không thể lấy gợi ý lúc này.",
        recommendations: []
      };
    }
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
