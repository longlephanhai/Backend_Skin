import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiAssistantService {
    private genAI: GoogleGenerativeAI;
    private genAiProModel: any;

    constructor(
        private configService: ConfigService,
    ) {
        this.genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY')!);
        this.genAiProModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    }

    async explainTask(task: string) {
        const prompt = `
Bạn là một chuyên gia da liễu kiêm Trợ lý AI độc quyền thuộc hệ thống SkinCoach. 
Nhiệm vụ của bạn là phân tích nhiệm vụ chăm sóc da (Skincare/Lifestyle Task) được cung cấp dưới đây và trả về một hướng dẫn chi tiết, chuẩn y khoa nhưng dễ hiểu cho người dùng.

Nhiệm vụ cần phân tích: "${task}"

Hãy trả về dữ liệu duy nhất dưới dạng một chuỗi JSON hợp lệ (VALID JSON STRING), không kèm theo bất kỳ lời thoại, ký tự Markdown (\`\`\`json) hay văn bản giải thích nào nằm ngoài JSON. 

Cấu trúc JSON bắt buộc phải tuân theo định dạng chính xác sau đây:
{
  "originalTask": "Chuỗi văn bản lặp lại chính xác tên nhiệm vụ được cung cấp ở trên",
  "whyItMatters": "Giải thích ngắn gọn từ 1 đến 2 câu về cơ sở khoa học hoặc lý do tại sao người dùng nên thực hiện nhiệm vụ này dựa trên khía cạnh sinh học của làn da.",
  "steps": [
    "Mô tả hành động của Bước 1 (Ví dụ: cách chuẩn bị, nhiệt độ nước, thao tác tay...)",
    "Mô tả hành động của Bước 2 (Ví dụ: thời gian thực hiện, cách thoa, định lượng sản phẩm...)",
    "Mô tả hành động của Bước 3 nếu có..."
  ],
  "caution": "Lời khuyên, cảnh báo an toàn hoặc dấu hiệu cần ngưng sử dụng sản phẩm khi thực hiện nhiệm vụ này (Ví dụ: tránh vùng mắt, tần suất sử dụng, phản ứng phụ cần lưu ý...)"
}

Yêu cầu về nội dung:
- Ngôn ngữ: Tiếng Việt.
- Giọng điệu: Thân thiện, chuyên nghiệp, mang tính khích lệ.
- Phần "steps" cần chia nhỏ hành động rõ ràng để một người mới bắt đầu cũng có thể tự làm theo được ngay tại nhà.
`;

        const result = await this.genAiProModel.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        let rawText = result.response.text();

        rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

        const jsonStart = rawText.indexOf("{");
        const jsonEnd = rawText.lastIndexOf("}");

        const jsonString =
            jsonStart !== -1 && jsonEnd !== -1
                ? rawText.slice(jsonStart, jsonEnd + 1)
                : rawText;

        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("AI output invalid JSON:", rawText);
            return {
                originalTask: task,
                whyItMatters: "Đang cập nhật dữ liệu khoa học.",
                steps: [],
                caution: ""
            };
        }
    }
}
