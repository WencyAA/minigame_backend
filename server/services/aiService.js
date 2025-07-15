//与AI模型交互

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 安全地从环境变量加载API密钥，绝不硬编码
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const GEMINI_API_KEY = process.env.Gemini_API_KEY;

// 验证必要的API密钥是否存在
if (!QWEN_API_KEY) {
  console.warn('Warning: QWEN_API_KEY not found in environment variables');
}
if (!GEMINI_API_KEY) {
  console.warn('Warning: Gemini_API_KEY not found in environment variables');
}

// Qwen API configuration
const qwenAPI = axios.create({
  baseURL: 'https://dashscope.aliyuncs.com/api/v1',
  headers: {
    'Authorization': `Bearer ${QWEN_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Gemini API configuration
const geminiAPI = axios.create({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Mock responses for virtual AI models
const mockResponse = async (model, prompt) => {
  const responses = {
    iegGuangzi: `[IEGGuangzi 虚拟AI回复] 基于您的描述"${prompt}"，我为您生成了相应的游戏素材建议。这是一个模拟回复，展示了AI助手的响应格式。`,
    hunyuan: `[Hunyuan 虚拟AI回复] 根据您的需求"${prompt}"，我为您提供以下游戏策划建议：\n\n1. 核心玩法设计\n2. 系统架构规划\n3. 用户体验优化\n\n这是混元AI的模拟响应，实际使用时会调用真实API。`,
    deepseek: `[Deepseek 虚拟AI回复] 针对您的描述"${prompt}"，我从技术角度为您分析：\n\n• 技术实现方案\n• 性能优化建议\n• 代码架构设计\n\n这是DeepSeek AI的模拟回复，展示了深度思考的技术建议。`
  };

  return {
    text: responses[model] || `[${model} 虚拟AI回复] 基于您的描述"${prompt}"，我为您生成了相应的回复。`,
    finish_reason: 'stop'
  };
};

// Gemini图像生成函数
const generateGeminiImage = async (prompt) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // 使用Gemini 2.0 Flash预览图像生成功能
    const requestData = {
      contents: [{
        parts: [{
          text: `Generate a high-quality game asset image: ${prompt}. Create a detailed, professional game art suitable for use in game development. Please generate an image.`
        }]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    };

    console.log('Sending request to Gemini API for image generation');

    const response = await geminiAPI.post(
      `/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      requestData
    );

    console.log('Gemini API response received successfully');
    console.log('Full Gemini response structure:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const candidate = response.data.candidates[0];
      let textResponse = '';
      let imageData = null;

      console.log('Candidate structure:', JSON.stringify(candidate, null, 2));

      // 处理响应中的文本和图像部分
      if (candidate.content && candidate.content.parts) {
        console.log('Processing parts:', candidate.content.parts.length);
        for (const part of candidate.content.parts) {
          console.log('Part type:', Object.keys(part));
          if (part.text) {
            textResponse += part.text;
            console.log('Text part found:', part.text.substring(0, 100) + '...');
          }
          // 检查多种可能的图像数据格式
          if (part.inline_data && part.inline_data.data) {
            imageData = part.inline_data.data;
            console.log('Image data received from Gemini API (inline_data), length:', imageData.length);
          } else if (part.inlineData && part.inlineData.data) {
            imageData = part.inlineData.data;
            console.log('Image data received from Gemini API (inlineData), length:', imageData.length);
          } else if (part.image && part.image.data) {
            imageData = part.image.data;
            console.log('Image data received from Gemini API (image), length:', imageData.length);
          } else if (part.data) {
            imageData = part.data;
            console.log('Image data received from Gemini API (data), length:', imageData.length);
          }
        }
      }

      const result = {
        text: textResponse || '✨ 图像已成功生成！',
        imageData: imageData,
        imageUrl: imageData ? `data:image/png;base64,${imageData}` : null,
        hasImage: !!imageData,
        status: 'success'
      };

      console.log('Final result:', {
        hasText: !!result.text,
        hasImage: result.hasImage,
        hasImageUrl: !!result.imageUrl,
        imageDataLength: imageData ? imageData.length : 0
      });

      return result;
    } else {
      console.error('Invalid Gemini response structure:', response.data);
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Error in Gemini image generation:', error.message);

    // 如果Gemini API调用失败，尝试使用备用的图像生成方法
    try {
      // 尝试使用Imagen模型作为备用
      const imagenResponse = await generateImagenImage(prompt);
      return imagenResponse;
    } catch (imagenError) {
      console.error('Imagen backup also failed:', imagenError.message);

      // 最终降级方案：返回详细的设计建议
      return {
        text: '🎨 图像生成服务暂时不可用，但我为您提供了详细的素材设计建议：\n\n' +
              `基于您的描述"${prompt}"，建议的设计要素：\n` +
              '• 色彩方案：选择符合游戏风格的主色调\n' +
              '• 构图布局：确保主要元素突出且平衡\n' +
              '• 细节处理：添加适当的纹理和光影效果\n' +
              '• 风格一致性：与游戏整体美术风格保持统一\n\n' +
              '您可以将这些建议提供给美术团队进行创作。',
        hasImage: false,
        status: 'success'
      };
    }
  }
};

// Imagen备用图像生成函数
const generateImagenImage = async (prompt) => {
  try {
    const requestData = {
      prompt: `High-quality game asset: ${prompt}`,
      number_of_images: 1,
      aspect_ratio: "1:1"
    };

    console.log('Trying Imagen API as backup');

    const response = await geminiAPI.post(
      `/models/imagen-3.0-generate-001:generateImages?key=${GEMINI_API_KEY}`,
      requestData
    );

    if (response.data && response.data.generated_images && response.data.generated_images[0]) {
      const imageData = response.data.generated_images[0].image;

      return {
        text: '✨ 图像已通过Imagen成功生成！',
        imageData: imageData,
        imageUrl: `data:image/png;base64,${imageData}`,
        hasImage: true,
        status: 'success'
      };
    } else {
      throw new Error('Invalid Imagen response format');
    }
  } catch (error) {
    console.error('Imagen API error:', error.message);
    throw error;
  }
};

// Helper function to format messages for Qwen
const formatQwenMessages = (messages) => {
  return {
    model: 'qwen-turbo',
    input: {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }
  };
};

// Main AI service functions
export const generateResponse = async (messages, selectedModel = 'qwen') => {
  try {
    console.log(`Processing request with model: ${selectedModel}`);

    if (selectedModel === 'qwen') {
      if (!QWEN_API_KEY) {
        throw new Error('Qwen API key not configured');
      }

      const formattedData = formatQwenMessages(messages);
      console.log('Sending request to Qwen API');

      const response = await qwenAPI.post('/services/aigc/text-generation/generation', formattedData);
      console.log('Qwen API response received successfully');

      if (response.data && response.data.output && response.data.output.text) {
        return {
          text: response.data.output.text,
          status: 'success'
        };
      } else if (response.data && response.data.text) {
        return {
          text: response.data.text,
          status: 'success'
        };
      } else {
        console.error('Unexpected Qwen API response format');
        throw new Error('Invalid response format from Qwen API');
      }
    } else if (selectedModel === 'gemini') {
      // 对于素材生成，使用Gemini的图像生成功能
      const lastMessage = messages[messages.length - 1].content;
      return await generateGeminiImage(lastMessage);
    } else if (selectedModel === 'iegGuangzi') {
      // iegGuangzi 使用虚拟AI回复（仅用于素材生成页面）
      const lastMessage = messages[messages.length - 1].content;
      const response = await mockResponse('iegGuangzi', lastMessage);
      return {
        text: response.text,
        status: 'success'
      };
    } else if (selectedModel === 'hunyuan') {
      // Hunyuan 使用虚拟AI回复（用于其他页面）
      const lastMessage = messages[messages.length - 1].content;
      const response = await mockResponse('hunyuan', lastMessage);
      return {
        text: response.text,
        status: 'success'
      };
    } else if (selectedModel === 'deepseek') {
      // Deepseek 使用虚拟AI回复（用于其他页面）
      const lastMessage = messages[messages.length - 1].content;
      const response = await mockResponse('deepseek', lastMessage);
      return {
        text: response.text,
        status: 'success'
      };
    } else {
      throw new Error(`Unsupported model: ${selectedModel}`);
    }
  } catch (error) {
    console.error(`Error in ${selectedModel} API call:`, error.message);

    // 确保不在错误信息中暴露敏感信息
    if (error.response) {
      console.error('API error status:', error.response.status);
      throw new Error(`API Error: ${error.response.status}`);
    } else if (error.request) {
      console.error('No response received from API');
      throw new Error('No response received from API');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
};

export const generatePlan = async (taskDescription, selectedModel = 'qwen') => {
  const messages = [
    { role: 'system', content: 'You are a game design expert helping to create game plans.' },
    { role: 'user', content: taskDescription }
  ];
  return generateResponse(messages, selectedModel);
};

export const generateAssets = async (modelData, selectedModel = 'qwen') => {
  const messages = [
    { role: 'system', content: 'You are a game asset creation expert.' },
    { role: 'user', content: modelData }
  ];
  return generateResponse(messages, selectedModel);
};

export const startDevelopment = async (taskData, selectedModel = 'qwen') => {
  const messages = [
    { role: 'system', content: 'You are a game development expert providing technical guidance.' },
    { role: 'user', content: taskData }
  ];
  return generateResponse(messages, selectedModel);
};


// exports.generatePlanning = async (taskDescription) => {
//   const response = await axios.post('https://your-ai-api.com/generate', {
//     taskDescription,
//   }, {
//     headers: {
//       'Authorization': `Bearer YOUR_API_KEY`,
//     },
//   });
//   return response.data;
// };

// 模拟的 API 请求
// export const generatePlanning = async (taskDescription) => {
//   // 模拟返回数据
//   return {
//     plan: `Generated plan based on: ${taskDescription}`,
//     status: 'success',
//   };
// };

