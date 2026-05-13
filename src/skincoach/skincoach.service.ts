import { BadRequestException, Injectable } from '@nestjs/common';
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
    this.genAiProModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
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
Bạn là chuyên gia da liễu thẩm mỹ cao cấp (Skin Coach), theo triết lý: **Làn da đẹp bắt nguồn từ lối sống lành mạnh, mỹ phẩm chỉ là hỗ trợ**.

DỮ LIỆU KHÁCH HÀNG:
- Vấn đề soi da: ${JSON.stringify(stats)}
- Điểm nghiêm trọng: ${finalScore}/20
- Khảo sát thói quen: ${JSON.stringify(survey)}
- Mục tiêu ưu tiên: ${survey.priority}

QUY TẮC AN TOÀN TUYỆT ĐỐI:
1. Nếu điểm >= 15 hoặc có nhiều mụn Acne sưng đau:
   - "shouldSeeDoctor": true
   - "medicalWarning": "Tình trạng da cần thăm khám bác sĩ chuyên khoa"
   - "routine30Days": []
2. Nếu điểm < 15:
   - "shouldSeeDoctor": false  
   - "medicalWarning": ""
   - Tạo "routine30Days" với ĐÚNG 30 ngày

CÁC MỐC ĐÁNH GIÁ BẮT BUỘC (PHẢI CÓ TRONG routine30Days):
- **Ngày 7**: Đánh giá lần 1
  * Task: "Chụp ảnh da dưới ánh sáng tự nhiên (cùng góc, cùng điều kiện)"
  * Task: "So sánh với ảnh ngày 1, ghi nhận thay đổi về độ nhờn/khô/mẩn đỏ"
  * Task: "Đánh giá mức độ cải thiện: giảm mụn viêm? Da bớt nhạy cảm?"

- **Ngày 14**: Đánh giá lần 2
  * Task: "Chụp ảnh da và so sánh với ảnh ngày 7"
  * Task: "Đánh giá hiệu quả của thay đổi lối sống (ngủ, nước, ăn uống)"
  * Task: "Nếu da ổn định, có thể cân nhắc thêm 1 bước treatment nhẹ"

- **Ngày 21**: Đánh giá lần 3
  * Task: "Chụp ảnh và phân tích vùng da có vấn đề nhất"
  * Task: "Đánh giá mức độ tuân thủ lộ trình (tự chấm điểm 1-10)"
  * Task: "Điều chỉnh chế độ ăn: nếu da dầu giảm đường, nếu da khô tăng omega-3"

- **Ngày 30**: Đánh giá tổng kết
  * Task: "Chụp ảnh và tạo ảnh ghép so sánh ngày 1 - 30"
  * Task: "Viết nhật ký 30 ngày: thói quen nào thay đổi tốt nhất?"
  * Task: "Đánh giá điểm số cải thiện (giảm % mụn, % lỗ chân lông, v.v.)"

PHÂN BỔ NỘI DUNG TASKS MỖI NGÀY:
- 40% LIFESTYLE (ngủ, nước, dinh dưỡng, stress, tập thể dục)
- 20% THEO DÕI & ĐÁNH GIÁ (chụp ảnh, ghi chép, tự đánh giá)
- 20% SKINCARE CƠ BẢN (rửa mặt, dưỡng ẩm, chống nắng)
- 10% ĐIỀU TRỊ (chỉ khi cần, ưu tiên tuần 2-3)
- 10% ĐIỀU CHỈNH HÀNH VI (cắt giảm thói quen xấu)

QUY TẮC CHO TASK:
- "tag":
  * "lifestyle" = Ngủ, nước, tập TD, giảm stress
  * "diet" = Ăn uống, bổ sung thực phẩm
  * "assessment" = ĐÁNH GIÁ, CHỤP ẢNH, SO SÁNH (bắt buộc các ngày 7,14,21,30)
  * "cleanser/moisturizer/suncare" = Skincare cơ bản
  * "treatment" = Hạn chế, ưu tiên tuần 2-3

YÊU CẦU JSON (CHỈ TRẢ VỀ JSON):
{
  "shouldSeeDoctor": boolean,
  "medicalWarning": "string",
  "rootCause": "Phân tích nguyên nhân gốc rễ từ lối sống",
  "analysis": "Nhận xét tình trạng da hiện tại",
  "routine30Days": [
    {
      "day": 1,
      "phase": "Khởi động & Thiết lập nền tảng",
      "tasks": [
        {
          "name": "Ngủ đủ 7-8 tiếng, tắt điện thoại trước 23h",
          "timeOfDay": "evening",
          "tag": "lifestyle"
        },
        {
          "name": "Uống 2 lít nước, giảm đường và sữa",
          "timeOfDay": "anytime",
          "tag": "diet"
        },
        {
          "name": "Rửa mặt bằng nước ấm, không dùng sữa rửa mặt nếu da quá nhạy cảm",
          "timeOfDay": "both",
          "tag": "cleanser"
        }
      ],
      "note": "Ngày đầu tiên: Tạo baseline để đánh giá sau 7 ngày"
    },
    {
      "day": 7,
      "phase": "Đánh giá tuần 1",
      "tasks": [
        {
          "name": "Chụp ảnh da cùng góc, cùng ánh sáng với ngày 1",
          "timeOfDay": "morning",
          "tag": "assessment"
        },
        {
          "name": "So sánh và ghi nhận: độ nhờn, mụn mới, mức độ kích ứng",
          "timeOfDay": "anytime",
          "tag": "assessment"
        },
        {
          "name": "Đánh giá mức độ cải thiện (giảm đỏ? da bớt khô? mụn lặn?)",
          "timeOfDay": "evening",
          "tag": "assessment"
        },
        {
          "name": "Viết nhật ký: 3 thói quen tốt đã làm được trong tuần",
          "timeOfDay": "anytime",
          "tag": "lifestyle"
        }
      ],
      "note": "Nếu da có dấu hiệu kích ứng nặng, dừng tất cả sản phẩm mới"
    },
    {
      "day": 14,
      "phase": "Đánh giá & Điều chỉnh",
      "tasks": [
        {
          "name": "Chụp ảnh và tạo ảnh ghép so sánh tuần 1 vs tuần 2",
          "timeOfDay": "morning",
          "tag": "assessment"
        },
        {
          "name": "Tự đánh giá mức độ tuân thủ lộ trình (thang điểm 1-10)",
          "timeOfDay": "evening",
          "tag": "assessment"
        },
        {
          "name": "Nếu da ổn định: thêm bước dưỡng ẩm chuyên sâu 2 lần/tuần",
          "timeOfDay": "evening",
          "tag": "moisturizer",
          "frequency": "Thứ 2 và Thứ 5"
        }
      ],
      "note": "2 tuần: Thời điểm bắt đầu thấy thay đổi rõ rệt nếu đúng lộ trình"
    },
    {
      "day": 21,
      "phase": "Tăng cường & Tối ưu",
      "tasks": [
        {
          "name": "Chụp ảnh vùng da có vấn đề nhất (cận cảnh)",
          "timeOfDay": "morning",
          "tag": "assessment"
        },
        {
          "name": "Đánh giá % cải thiện: mụn giảm?, lỗ chân lông thông thoáng?",
          "timeOfDay": "anytime",
          "tag": "assessment"
        },
        {
          "name": "Điều chỉnh chế độ ăn theo tiến triển (giảm thêm đường nếu da dầu)",
          "timeOfDay": "anytime",
          "tag": "diet"
        }
      ],
      "note": "3 tuần: Điều chỉnh lộ trình dựa trên kết quả thực tế"
    },
    {
      "day": 30,
      "phase": "Tổng kết & Duy trì",
      "tasks": [
        {
          "name": "Chụp ảnh và tạo ảnh ghép ngày 1-7-14-21-30",
          "timeOfDay": "morning",
          "tag": "assessment"
        },
        {
          "name": "Viết tổng kết 30 ngày: thay đổi lớn nhất về da và thói quen",
          "timeOfDay": "anytime",
          "tag": "assessment"
        },
        {
          "name": "Đánh giá điểm cải thiện: mức độ hài lòng (1-10)",
          "timeOfDay": "evening",
          "tag": "assessment"
        },
        {
          "name": "Lên kế hoạch duy trì 3 thói quen tốt nhất đã học được",
          "timeOfDay": "anytime",
          "tag": "lifestyle"
        }
      ],
      "note": "Kết thúc lộ trình: Duy trì thói quen tốt, chỉ dùng mỹ phẩm phù hợp"
    }
  ],
  "nextCheckupDays": 7
}

LƯU Ý QUAN TRỌNG:
- Các ngày 7, 14, 21, 30 PHẢI có ít nhất 2 tasks với tag "assessment"
- Task "chụp ảnh" bắt buộc có trong các ngày đánh giá
- Gợi ý so sánh, đối chiếu với mốc trước đó
- Đánh giá phải cụ thể, không chung chung
`;


    try {
      const result = await this.genAiProModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });


      const rawText = result.response.text();
      console.log('response chars:', rawText.length);
      const jsonStart = rawText.indexOf('{');
      const jsonEnd = rawText.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Gemini không trả về đúng định dạng JSON');
      }

      let parsedData = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));


      if (!parsedData.shouldSeeDoctor && (!parsedData.routine30Days || parsedData.routine30Days.length < 30)) {
        console.warn('AI trả về thiếu ngày, dùng fallback template');
        // parsedData = this.generateFallbackRoutine(finalScore, survey, stats);
      }

      const newRecord = new this.skinCoachModel({
        userId: user.userId,
        sessionId,
        inputSurvey: survey,
        detectedIssues: Object.keys(stats ?? {}),
        severityScore: finalScore,
        rootCause: parsedData.rootCause,
        analysis: parsedData.analysis,
        shouldSeeDoctor: parsedData.shouldSeeDoctor,
        medicalWarning: parsedData.medicalWarning || '',
        routine30Days: parsedData.routine30Days || [],
        nextCheckupDays: parsedData.nextCheckupDays || 7,
      });

      return await newRecord.save();
    } catch (error) {
      console.error('Lỗi SkinCoach Service:', error);

      return {
        shouldSeeDoctor: true,
        analysis: 'Hệ thống phân tích đang quá tải.',
        medicalWarning: 'Để đảm bảo an toàn, vui lòng thăm khám bác sĩ da liễu.',
        rootCause: 'Hệ thống gặp sự cố kỹ thuật',
        routine30Days: [],
        nextCheckupDays: 7,
      };
    }
  }

  // private generateFallbackRoutine(score: number, survey: any, stats: any) {
  //   const isSensitive = survey.sensitive === 'yes';
  //   const hasAcne = stats && stats['Acne'] > 0;

  //   const routine30Days = [];


  //   const phases = [
  //     { start: 1, end: 7, name: 'Làm quen & Phục hồi hàng rào da' },
  //     { start: 8, end: 14, name: 'Bắt đầu xử lý nhẹ' },
  //     { start: 15, end: 21, name: 'Tăng cường điều trị' },
  //     { start: 22, end: 30, name: 'Ổn định & Duy trì' }
  //   ];

  //   for (const phase of phases) {
  //     for (let day = phase.start; day <= phase.end; day++) {
  //       const tasks = [];

  //       // Tasks cơ bản theo từng phase
  //       if (phase.name.includes('Làm quen')) {
  //         tasks.push(
  //           { name: 'Rửa mặt với sữa rửa dịu nhẹ', timeOfDay: 'morning', tag: 'cleanser' },
  //           { name: 'Rửa mặt với sữa rửa dịu nhẹ', timeOfDay: 'evening', tag: 'cleanser' },
  //           { name: 'Bôi kem dưỡng ẩm phục hồi', timeOfDay: 'morning', tag: 'moisturizer' },
  //           { name: 'Bôi kem dưỡng ẩm phục hồi', timeOfDay: 'evening', tag: 'moisturizer' }
  //         );
  //         if (day % 3 === 0) {
  //           tasks.push({ name: 'Thoa kem chống nắng SPF 30+', timeOfDay: 'morning', tag: 'suncare' });
  //         }
  //       } else if (phase.name.includes('Xử lý nhẹ')) {
  //         tasks.push(
  //           { name: 'Rửa mặt với sữa rửa dịu nhẹ', timeOfDay: 'morning', tag: 'cleanser' },
  //           { name: 'Rửa mặt với sữa rửa dịu nhẹ', timeOfDay: 'evening', tag: 'cleanser' },
  //           { name: 'Bôi kem dưỡng ẩm', timeOfDay: 'both', tag: 'moisturizer' }
  //         );
  //         if (!isSensitive && day % 2 === 0) {
  //           tasks.push({ name: 'Bôi serum phục hồi', timeOfDay: 'evening', tag: 'treatment' });
  //         }
  //       } else if (phase.name.includes('Tăng cường')) {
  //         tasks.push(
  //           { name: 'Rửa mặt kỹ với sữa rửa chuyên sâu', timeOfDay: 'evening', tag: 'cleanser' },
  //           { name: 'Bôi kem dưỡng ẩm giàu ceramide', timeOfDay: 'both', tag: 'moisturizer' }
  //         );
  //         if (hasAcne && !isSensitive) {
  //           tasks.push({ name: 'Bôi chấm mụn Salicylic acid', timeOfDay: 'evening', tag: 'treatment', frequency: 'Cách ngày' });
  //         }
  //       } else {
  //         tasks.push(
  //           { name: 'Rửa mặt nhẹ nhàng', timeOfDay: 'both', tag: 'cleanser' },
  //           { name: 'Dưỡng ẩm duy trì', timeOfDay: 'both', tag: 'moisturizer' },
  //           { name: 'Chống nắng mỗi sáng', timeOfDay: 'morning', tag: 'suncare' }
  //         );
  //       }

  //       // Thêm lifestyle tasks
  //       if (day % 7 === 0) {
  //         tasks.push({ name: 'Đánh giá tiến trình da', timeOfDay: 'anytime', tag: 'assessment' });
  //       }
  //       if (day % 5 === 0) {
  //         tasks.push({ name: 'Uống đủ 2 lít nước', timeOfDay: 'anytime', tag: 'lifestyle' });
  //       }

  //       routine30Days.push({
  //         day,
  //         phase: phase.name,
  //         tasks: tasks.slice(0, 5),
  //         note: `Ngày ${day}: Tiếp tục theo lộ trình ${phase.name.toLowerCase()}`
  //       });
  //     }
  //   }

  //   return {
  //     shouldSeeDoctor: false,
  //     medicalWarning: '',
  //     rootCause: `Dựa trên phân tích: ${hasAcne ? 'có mụn' : 'da không mụn'}, ${isSensitive ? 'da nhạy cảm' : 'da khỏe'}`,
  //     analysis: 'Lộ trình được tạo tự động dựa trên dữ liệu của bạn.',
  //     routine30Days,
  //     nextCheckupDays: 7,
  //   };
  // }

  async getByUser(user: any) {
    const isExist = await this.skinCoachModel.exists({ userId: user.userId });
    if (!isExist) {
      throw new BadRequestException('No skin coach record found for this user');
    }
    const skinCoach = await this.skinCoachModel.findOne({ userId: user.userId }).sort({ createdAt: -1 });
    return skinCoach;
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
