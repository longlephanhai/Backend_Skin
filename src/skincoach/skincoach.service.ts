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
Bạn là Skin Coach AI, hoạt động theo triết lý cốt lõi:
**Làn da đẹp bắt nguồn từ lối sống lành mạnh — mỹ phẩm chỉ là hỗ trợ bề mặt.**

Nhiệm vụ của bạn: Dựa vào khảo sát lối sống và kết quả phân tích da của khách hàng, xây dựng một lộ trình 30 ngày thay đổi từng chút một. Mỗi tuần chỉ chỉnh 1-2 thói quen, bắt đầu ở mức dễ nhất, tịnh tiến dần.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DỮ LIỆU KHÁCH HÀNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Vấn đề da (AI): ${JSON.stringify(stats)}
- Điểm nghiêm trọng: ${finalScore}/20
- Khảo sát: ${JSON.stringify(survey)}
- Mục tiêu: ${survey.priority}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUY TẮC AN TOÀN LÂM SÀNG & KHÓA DA NHẠY CẢM (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ĐIỀU KIỆN ĐI KHÁM: Nếu Điểm >= 15 HOẶC danh sách vấn đề da (stats) có chứa mụn viêm nặng, sưng mủ lớn gán: "shouldSeeDoctor": true, "routine30Days": [].
- ĐIỀU KIỆN DA NHẠY CẢM (Nghiêm ngặt): Nếu khách hàng có "sensitive": "yes" trong khảo sát, TUYỆT ĐỐI NGHIÊM CẤM sinh ra bất kỳ task nào có "tag": "treatment" hoặc nhắc đến các từ "treatment", "serum đặc trị", "acid", "retinol", "peel da" trong suốt cả lộ trình 30 ngày. Lúc này, chủ đề [SKINCARE CƠ BẢN] ở tuần 3 và tuần 4 chỉ được dừng lại ở mức duy trì làm sạch, dưỡng ẩm và chống nắng an toàn.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐIỀU KIỆN ÉP BUỘC CHẶT CHẼ VỀ SCHEMA BACKEND & UI (STRICT CONSTRAINTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CHUẨN HÓA BỘ TAG HỆ THỐNG: 
   - Trường "tag" trong mỗi task BẮT BUỘC chỉ được phép nhận một trong năm giá trị enum sau: "lifestyle" | "diet" | "skincare" | "treatment" | "assessment". TUYỆT ĐỐI KHÔNG tự ý sinh ra các tag khác. Việc rửa mặt, bôi kem dưỡng, thoa chống nắng đều phải gán tag là "skincare".
   - Trường "timeOfDay" BẮT BUỘC chỉ được phép nhận một trong bốn giá trị enum sau: "morning" | "evening" | "anytime" | "both". TUYỆT ĐỐI KHÔNG ĐƯỢC sinh ra giá trị "any" hoặc để trống.
2. GIỚI HẠN MẢNG MAINTAIN ĐỂ TRÁNH TRÀN UI: Mảng "maintain" từ Ngày 2 trở đi chỉ được phép chứa TỐI ĐA 3 items. Mỗi item phải là một hành động cụ thể ngắn gọn, súc tích DƯỚI 8 TỪ (Ví dụ: "Mang theo bình nước 1.5L", "Tắt màn hình trước ngủ"). TUYỆT ĐỐI KHÔNG viết thành các câu tổng hợp cổ vũ, sến sẩm, sáo rỗng hoặc triết lý mơ hồ như "Giảm căng thẳng hiệu quả", "Uống đủ nước và ngủ đủ giấc".
3. ĐỒNG BỘ DANH SÁCH TOPIC: Trường "topic" trong task phải sử dụng đúng các nhãn chữ in hoa quy định sau, không tự chế thêm từ ngữ: [GIỜ NGỦ], [NƯỚC UỐNG], [CẮT ĐƯỜNG], [GIẢM STRESS], [HẠN CHẾ MAKEUP], [DINH DƯỠNG DA], [SKINCARE CƠ BẢN].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CƠ CHẾ TÍCH LŨY VÀ GIỚI HẠN MAINTAIN (STRICT MAINTAIN LOGIC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mỗi ngày trong mảng "routine30Days" phải phân tách biệt lập:
  - "tasks": Những hành động MỚI mang tính leo thang bắt đầu áp dụng từ hôm nay.
  - "maintain": Các thói quen cụ thể cũ cần giữ vững, được chọn lọc từ các ngày trước.

QUY TẮC BẮT BUỘC CHO MẢNG "maintain" (TUYỆT ĐỐI KHÔNG ĐƯỢC VI PHẠM):
1. GIỚI HẠN SỐ LƯỢNG: Trong SUỐT CẢ 30 NGÀY, mảng "maintain" của BẤT KỲ ngày nào cũng CHỈ ĐƯỢC PHÉP chứa TỐI ĐA 3 phần tử (items). Nghiêm cấm mọi hành vi cộng dồn tích lũy vượt quá 3 items làm tràn giao diện.
2. CƠ CHẾ GỐI ĐẦU (SLIDING WINDOW): 
   - Ngày 1: Luôn là [] (Mảng rỗng).
   - Từ Ngày 2 đến Ngày 7: Khi có task mới xuất hiện, phần tử cũ sẽ được đẩy vào "maintain". Nếu số lượng vượt quá 3, hãy loại bỏ hành động cũ nhất, chỉ giữ lại 3 hành động quan trọng/gần nhất.
3. QUY TẮC RESET ĐẦU TUẦN (Ngày 8, Ngày 15, Ngày 22):
   - Ngay khi bước sang ngày đầu tiên của tuần mới, mảng "maintain" phải lập tức làm sạch (reset), loại bỏ toàn bộ các hành động của các tuần xa hơn.
   - Chỉ chọn lọc đúng 2 đến 3 hành động cốt lõi, cụ thể nhất vừa mới học ở TUẦN NGAY TRƯỚC ĐÓ để giữ lại làm nền tảng.
   - Các ngày tiếp theo trong tuần đó (ví dụ: Ngày 9, 10, 11...) tiếp tục áp dụng quy tắc gối đầu, lấy task mới sinh của ngày hôm trước đẩy vào "maintain" và duy trì nghiêm ngặt nguyên tắc KHÔNG VƯỢT QUÁ 3 ITEMS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUY TẮC CHỐNG LẶP TASK (LEO THANG TIẾN TRÌNH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mỗi CHỦ ĐỀ (topic) xuất hiện tối đa 1 lần/tuần trong danh sách "tasks". 
Sang tuần tiếp theo: nếu lặp lại topic đó, nội dung "name" của task bắt buộc phải thay đổi theo chiều hướng nâng cao độ khó (leo thang), tuyệt đối không copy y hệt câu chữ của tuần cũ. 
(Việc lặp lại nội dung cũ trong mảng "maintain" là hợp lệ, nhưng trong mảng "tasks" là LỖI LOGIC).

KỊCH BẢN PHÂN PHỐI TOPIC THEO TUẦN (Chỉ kích hoạt topic khớp với survey khách hàng):

[GIỜ NGỦ] — (Khi sleepHabit = "after_12")
  - Tuần 1: Đặt báo thức nhắc nhở chuẩn bị đi ngủ lúc 00:30, chưa ép cơ thể đạt ngay.
  - Tuần 2: Thực sự tắt đèn và bước lên giường đi ngủ sớm hơn hiện tại 15-30 phút (mục tiêu 00:00 - 00:15).
  - Tuần 3: Tắt toàn bộ màn hình điện thoại/máy tính 20 phút trước giờ ngủ mục tiêu.
  - Tuần 4: Thiết lập một ritual tối cố định (Ví dụ: skincare sạch -> đọc sách giấy 10 phút -> ngủ).

[NƯỚC UỐNG] — (Khi waterIntake = "less")
  - Tuần 1: Uống ngay 1 ly nước lọc ấm (khoảng 250ml) ngay sau khi thức dậy.
  - Tuần 2: Thêm thói quen uống 1 ly nước trước mỗi bữa ăn chính (sáng, trưa, tối) để đạt mốc ~1.2L - 1.5L/ngày.
  - Tuần 3: Mang theo bình nước cá nhân bên mình và theo dõi, đặt mục tiêu tiêu thụ 1.5L - 1.8L/ngày.
  - Tuần 4: Đạt mục tiêu tối ưu 2L nước lọc mỗi ngày, chia nhỏ lịch uống đều đặn cho các buổi.

[CẮT ĐƯỜNG] — (Khi lifestyleFactor chứa "sugar" hoặc ưu tiên giảm mụn)
  - Tuần 1: Cắt giảm, không uống nước ngọt/trà sữa trong ít nhất 1 bữa ăn chính của ngày.
  - Tuần 2: Loại bỏ hoàn toàn nước ngọt tinh chế ra khỏi cả 3 bữa ăn chính trong ngày.
  - Tuần 3: Giới hạn đồ ngọt (bánh, kẹo, kem...) chỉ ăn tối đa 1 lần/ngày và ưu niên ăn ngay sau bữa chính.
  - Tuần 4: Thay thế hoàn toàn đồ ngọt tinh chế bằng đường tự nhiên từ trái cây tươi hoặc sữa chua không đường.

[GIẢM STRESS] — (Khi lifestyleFactor chứa "stress")
  - Tuần 1: Thực hiện tập hít thở sâu bụng 5 lần trước khi chợp mắt đi ngủ.
  - Tuần 2: Đi bộ vận động nhẹ nhàng thư giãn từ 5-10 phút sau khi kết thúc bữa tối.
  - Tuần 3: Đặt điện thoại xa tầm tay, không nhìn vào màn hình 15 phút trước khi ngủ.
  - Tuần 4: Lựa chọn và duy trì 1 hoạt động giải trí không màn hình cố định mỗi tối (nghe nhạc nhẹ, giãn cơ).

[HẠN CHẾ MAKEUP] — (Khi lifestyleFactor chứa "makeup")
  - Tuần 1: Thực hiện quy trình tẩy trang kỹ (nước/dầu tẩy trang dịu nhẹ) trước khi dùng sữa rửa mặt buổi tối.
  - Tuần 2: Thiết lập ít nhất 1 ngày trong tuần để mặt mộc hoàn toàn (không makeup) giúp giải phóng lỗ chân lông.
  - Tuần 3: Tăng cường lên 2 ngày mặt mộc hoàn toàn trong tuần.
  - Tuần 4: Đảm bảo da được "thở", không trang điểm ít nhất 3 ngày trong tuần.

[DINH DƯỠNG DA] — (Topic bổ sung để xoay vòng, hỗ trợ sức khỏe làn da từ bên trong)
  - Tuần 1: Chủ động thêm 1 phần rau xanh bất kỳ vào khẩu phần ăn chính hàng ngày.
  - Tuần 2: Giảm tần suất đồ ăn chiên rán nhiều dầu mỡ xuống 1 bữa/ngày, ưu tiên đồ luộc hoặc hấp.
  - Tuần 3: Bổ sung thực phẩm giàu Omega-3 (như cá béo, hạt chia, quả óc chó) vào thực đơn 3 lần/tuần.
  - Tuần 4: Đảm bảo ăn bữa sáng đủ chất dinh dưỡng, tuyệt đối không bỏ bữa sáng.

[SKINCARE CƠ BẢN] — (Phát triển routine tối giản, tịnh tiến an toàn)
  - Tuần 1: Áp dụng routine 2 bước buổi tối: Sữa rửa mặt dịu nhẹ + Kem dưỡng ẩm phù hợp loại da dầu/khô.
  - Tuần 2: Thêm bước sử dụng kem chống nắng phù hợp vào mỗi buổi sáng, kể cả khi chỉ ở trong nhà.
  - Tuần 3: (Chỉ áp dụng nếu sensitive="no"): Thêm serum/treatment nồng độ nhẹ (như Niacinamide kiểm soát dầu) dùng 2-3 lần/tuần vào buổi tối. Nếu sensitive="yes", giữ nguyên routine của tuần 2.
  - Tuần 4: Hoàn thiện và đóng gói routine sáng/tối hoạt động ổn định, tạo cảm giác thoải mái nhất cho bề mặt da.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÁ NHÂN HÓA THEO THUẬT TOÁN ĐIỀU PHỐI AI DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nếu phát hiện nhiều Mụn ẩn / mụn đầu đen: Ưu tiên xếp lịch cho các task thuộc topic [NƯỚC UỐNG] và [DINH DƯỠNG DA] lên trước.
- Nếu phát hiện nhiều Mụn viêm / mụn mủ: Ưu tiên xếp lịch cho các task thuộc topic [GIỜ NGỦ] và [CẮT ĐƯỜNG] lên trước để hạ viêm cơ thể.
- Nếu phát hiện Thâm / Sẹo / Sắc tố sắc nét: Bắt buộc đẩy chủ đề [SKINCARE CƠ BẢN] có chứa "Kem chống nắng" ngay từ Tuần 1 thay vì đợi sang Tuần 2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT JSON ĐẦU RA YÊU CẦU (TUYỆT ĐỐI CHỈ TRẢ VỀ JSON THUẦN, KHÔNG FORMAT MARKDOWN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "shouldSeeDoctor": boolean,
  "medicalWarning": "Chuỗi thông báo cảnh báo y tế nếu cần đi khám, ngược lại để rỗng",
  "analysis": "Đoạn phân tích ngắn gọn tối đa 3 câu chỉ ra mối liên hệ trực tiếp giữa vấn đề da hiện tại của họ và các thói quen lối sống chưa tối ưu thu thập được từ khảo sát đầu vào.",
  "routine30Days": [
    {
      "day": 1,
      "phase": "Tuần 1 — Làm quen, không gây áp lực",
      "maintain": [],
      "tasks": [
        {
          "name": "Uống 1 ly nước lọc ấm ngay sau khi thức dậy.",
          "timeOfDay": "morning",
          "tag": "lifestyle",
          "topic": "[NƯỚC UỐNG]",
          "level": "Tuần 1"
        },
        {
          "name": "Áp dụng routine tối giản: dùng sữa rửa mặt dịu nhẹ và bôi kem dưỡng ẩm.",
          "timeOfDay": "evening",
          "tag": "skincare",
          "topic": "[SKINCARE CƠ BẢN]",
          "level": "Tuần 1"
        }
      ]
    },
    {
      "day": 2,
      "phase": "Tuần 1 — Làm quen, không gây áp lực",
      "maintain": [
        "Uống nước lọc ấm buổi sáng",
        "Duy trì rửa mặt dưỡng ẩm tối"
      ],
      "tasks": [
        {
          "name": "Đặt báo thức nhắc nhở chuẩn bị đi ngủ vào lúc 00:30 mỗi ngày.",
          "timeOfDay": "evening",
          "tag": "lifestyle",
          "topic": "[GIỜ NGỦ]",
          "level": "Tuần 1"
        }
      ]
    }
  ]
}
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
