import { startDevelopment } from '../services/aiService.js';

const developmentController = {
  startDevelopment: async (req, res) => {
    try {
      const { taskData, selectedModel } = req.body;
      
      if (!taskData) {
        return res.status(400).json({ error: 'Task data is required' });
      }

      const development = await startDevelopment(taskData, selectedModel);
      res.json({ development });
    } catch (error) {
      console.error('Error in development controller:', error);
      res.status(500).json({ error: error.message || 'Failed to start development' });
    }
  }
};

export default developmentController;
