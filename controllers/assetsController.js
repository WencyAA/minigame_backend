import { generateAssets } from '../services/aiService.js';

const assetsController = {
  generateAssets: async (req, res) => {
    try {
      const { modelData, selectedModel } = req.body;
      
      if (!modelData) {
        return res.status(400).json({ error: 'Model data is required' });
      }

      const assets = await generateAssets(modelData, selectedModel);

      // 确保图像数据正确传递到前端
      console.log('Assets controller response:', {
        hasText: !!assets.text,
        hasImage: !!assets.hasImage,
        hasImageUrl: !!assets.imageUrl,
        status: assets.status
      });

      res.json({ assets });
    } catch (error) {
      console.error('Error in assets controller:', error);
      res.status(500).json({ error: error.message || 'Failed to generate assets' });
    }
  }
};

export default assetsController;
