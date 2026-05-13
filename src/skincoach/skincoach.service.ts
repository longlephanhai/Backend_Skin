import { Injectable } from '@nestjs/common';
import { CreateSkincoachDto } from './dto/create-skincoach.dto';
import { UpdateSkincoachDto } from './dto/update-skincoach.dto';
import { InjectModel } from '@nestjs/mongoose/dist';
import { SkinCoach } from './schema/skincoach.schema';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from 'node_modules/@nestjs/config';

@Injectable()
export class SkincoachService {

  private genAI: GoogleGenerativeAI;
  private genAiProModel: any;

  constructor(
    @InjectModel(SkinCoach.name) private skinCoachModel: Model<SkinCoach>,
    private configService: ConfigService
  ) {
    this.genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY')!);
    this.genAiProModel = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
  }

  async create(createSkincoachDto: CreateSkincoachDto, user: any) {
    const { sessionId, survey, finalDetections, stats } = createSkincoachDto;

    const scoreMap: Record<string, number> = {
      'Acne': 4,
      'Blackheads': 1.5,
      'Whiteheads': 1.5,
      'Dark-Spots': 1,
      'Englarged-Pores': 1,
      'Oily-Skin': 0.5,
      'Dry-Skin': 0.5,
      'Eyebags': 0.5,
      'Wrinkles': 0.5,
    };

    let severityScore = 0;
    finalDetections.forEach((det) => {
      if (det.checked !== false) {
        severityScore += scoreMap[det.label] ?? 0;
      }
    });

    if (survey.hasPain === 'pain') severityScore += 8;
    if (survey.hasPain === 'stinging') severityScore += 5;
    if (survey.sensitive === 'yes') severityScore += 2;

    const finalScore = Math.min(severityScore, 20);

    const prompt = `
Bạn là một chuyên gia da liễu thẩm mỹ cao cấp (Skin Coach).
Nhiệm vụ: Phân tích tình trạng da và đưa ra lộ trình 4 tuần HOẶC yêu cầu đi bác sĩ nếu quá nặng.

DỮ LIỆU KHÁCH HÀNG:
- Vấn đề soi da: ${JSON.stringify(stats)}
- Điểm nghiêm trọng hệ thống tính: ${finalScore}/20
- Khảo sát thói quen: ${JSON.stringify(survey)}
- Mục tiêu ưu tiên: ${survey.priority}

QUY TẮC AN TOÀN (LÁ CHẮN Y TẾ):
1. Nếu (Điểm >= 15) HOẶC (Phát hiện nhiều mụn 'Acne' sưng đau):
   - Phải đặt "shouldSeeDoctor": true
   - "medicalWarning": Giải thích rõ tại sao cần bác sĩ (nguy cơ sẹo rỗ, nhiễm trùng)
   - "timeline": []
2. Nếu (Điểm < 15):
   - Đặt "shouldSeeDoctor": false
   - "medicalWarning": ""
   - Tạo lộ trình "timeline" 4 tuần tập trung vào: thói quen, làm sạch, và phục hồi da

YÊU CẦU ĐỊNH DẠNG JSON (CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH):
{
  "shouldSeeDoctor": boolean,
  "medicalWarning": "string",
  "rootCause": "Phân tích nguyên nhân từ thói quen sinh hoạt và loại da",
  "analysis": "Nhận xét tình trạng da hiện tại một cách chuyên nghiệp",
  "timeline": [
    {
      "week": 1,
      "focus": "Tên chủ đề tuần 1",
      "tasks": [
        {
          "name": "Mô tả hành động cụ thể, ngắn gọn (tối đa 15 từ)",
          "timeOfDay": "morning",
          "tag": "cleanser",
          "frequency": "Hằng ngày | 2-3 lần/tuần (Thứ 2, 4, 6) | 1 lần/tuần | ..."
        }
      ]
    },
    { "week": 2, "focus": "...", "tasks": [...] },
    { "week": 3, "focus": "...", "tasks": [...] },
    { "week": 4, "focus": "...", "tasks": [...] }
  ],
  "nextCheckupDays": 7
}

QUY TẮC CHO TỪNG TASK:
- "timeOfDay": chọn đúng thời điểm dùng sản phẩm (morning = sáng, evening = tối, weekly = theo tuần, anytime = bất kỳ lúc nào)
- "tag": chọn đúng nhóm (cleanser = làm sạch, treatment = điều trị/serum/toner, moisturizer = dưỡng ẩm, suncare = chống nắng, lifestyle = lối sống/giấc ngủ, diet = ăn uống, assessment = đánh giá/theo dõi)
- "frequency": ghi rõ tần suất — không được để trống
- Mỗi tuần có 4–7 tasks, không quá ít cũng không quá nhiều
- "name" phải là câu hành động (bắt đầu bằng động từ), ví dụ: "Rửa mặt với sữa rửa mặt gel nhẹ"
`;

    try {
      const result = await this.genAiProModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const rawText = result.response.text();
      const jsonStart = rawText.indexOf('{');
      const jsonEnd = rawText.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Gemini không trả về đúng định dạng JSON');
      }

      const parsedData = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));

      const newRecord = new this.skinCoachModel({
        userId: user.userId,
        sessionId,
        inputSurvey: survey,
        detectedIssues: Object.keys(stats ?? {}),
        severityScore: finalScore,
        ...parsedData,
      });

      return await newRecord.save();
    } catch (error) {
      console.error('Lỗi SkinCoach Service:', error);
      return {
        shouldSeeDoctor: true,
        analysis: 'Hệ thống phân tích đang quá tải hoặc gặp sự cố.',
        medicalWarning:
          'Để đảm bảo an toàn, nếu da có dấu hiệu sưng đau, vui lòng thăm khám tại cơ sở y tế gần nhất.',
      };
    }
  }


  findAll() {
    return `This action returns all skincoach`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skincoach`;
  }

  update(id: number, updateSkincoachDto: UpdateSkincoachDto) {
    return `This action updates a #${id} skincoach`;
  }

  remove(id: number) {
    return `This action removes a #${id} skincoach`;
  }
}
