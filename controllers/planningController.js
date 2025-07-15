//处理策划模块请求

import { generatePlan } from '../services/aiService.js';

const planningController = {
  generatePlan: async (req, res) => {
    try {
      const { taskDescription, selectedModel } = req.body;
      
      if (!taskDescription) {
        return res.status(400).json({ error: 'Task description is required' });
      }

      const plan = await generatePlan(taskDescription, selectedModel);
      res.json({ plan });
    } catch (error) {
      console.error('Error in planning controller:', error);
      res.status(500).json({ error: error.message || 'Failed to generate plan' });
    }
  }
};

export default planningController;
