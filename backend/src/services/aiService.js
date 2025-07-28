const OpenAI = require('openai')
const { ChatOpenAI } = require('@langchain/openai')
const { HumanMessage, SystemMessage } = require('@langchain/core/messages')
const { logger } = require('../utils/logger')

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    this.chatModel = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4',
      temperature: 0.7,
    })
  }

  async generateDailyTaskPlan(userId, tasks, okrs, metrics) {
    try {
      const prompt = `
        As an AI business assistant, analyze the following business data and suggest the top 3 priority tasks for today:
        
        Current Tasks: ${JSON.stringify(tasks)}
        Active OKRs: ${JSON.stringify(okrs)}
        Recent Metrics: ${JSON.stringify(metrics)}
        
        Consider:
        1. Deadlines and urgency
        2. Impact on business goals
        3. Resource availability
        4. Dependencies between tasks
        
        Provide a structured response with:
        - Top 3 tasks with reasoning
        - Estimated time for each task
        - Priority level (High/Medium/Low)
        - Any blocking issues or dependencies
      `

      const response = await this.chatModel.invoke([
        new SystemMessage('You are an expert business consultant helping solo founders prioritize their daily tasks.'),
        new HumanMessage(prompt)
      ])

      return {
        success: true,
        data: response.content,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error generating daily task plan:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async generateWeeklyReview(userId, weekData) {
    try {
      const prompt = `
        Generate a comprehensive weekly business review based on the following data:
        
        Week Data: ${JSON.stringify(weekData)}
        
        Include:
        1. Key achievements and milestones
        2. Revenue and financial performance
        3. Customer metrics and feedback
        4. Operational challenges and solutions
        5. Strategic insights and recommendations
        6. Next week's priorities and action items
        
        Format as a professional business report with clear sections and actionable insights.
      `

      const response = await this.chatModel.invoke([
        new SystemMessage('You are a senior business analyst creating weekly performance reviews for startup founders.'),
        new HumanMessage(prompt)
      ])

      return {
        success: true,
        data: response.content,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error generating weekly review:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async generateSmartSuggestions(userId, businessContext) {
    try {
      const prompt = `
        Based on the following business context, provide 3-5 smart suggestions for improvement:
        
        Business Context: ${JSON.stringify(businessContext)}
        
        Focus on:
        1. Revenue optimization opportunities
        2. Customer experience improvements
        3. Operational efficiency gains
        4. Risk mitigation strategies
        5. Growth opportunities
        
        Provide specific, actionable recommendations with expected impact and implementation steps.
      `

      const response = await this.chatModel.invoke([
        new SystemMessage('You are a strategic business advisor helping founders optimize their operations and growth.'),
        new HumanMessage(prompt)
      ])

      return {
        success: true,
        data: response.content,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error generating smart suggestions:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async generateInvoiceDescription(clientName, amount, services) {
    try {
      const prompt = `
        Generate a professional invoice description for:
        Client: ${clientName}
        Amount: $${amount}
        Services: ${services}
        
        Create a detailed, professional description that clearly explains the value provided.
        Include specific deliverables, time period, and business impact.
        Keep it concise but comprehensive.
      `

      const response = await this.chatModel.invoke([
        new SystemMessage('You are a professional business consultant helping create clear, professional invoice descriptions.'),
        new HumanMessage(prompt)
      ])

      return {
        success: true,
        data: response.content,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error generating invoice description:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async generateSMARTOKR(description, businessContext) {
    try {
      const prompt = `
        Convert the following goal into a SMART OKR (Objective and Key Results):
        
        Goal Description: ${description}
        Business Context: ${JSON.stringify(businessContext)}
        
        Create:
        1. A clear, measurable Objective
        2. 3-5 specific, measurable Key Results
        3. Timeline and milestones
        4. Success criteria
        
        Format as a structured OKR with clear metrics and targets.
      `

      const response = await this.chatModel.invoke([
        new SystemMessage('You are an expert in OKR methodology helping founders create effective goal frameworks.'),
        new HumanMessage(prompt)
      ])

      return {
        success: true,
        data: response.content,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error generating SMART OKR:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async analyzeBusinessMetrics(metrics, trends) {
    try {
      const prompt = `
        Analyze the following business metrics and trends:
        
        Metrics: ${JSON.stringify(metrics)}
        Trends: ${JSON.stringify(trends)}
        
        Provide:
        1. Key insights and patterns
        2. Performance analysis
        3. Risk indicators
        4. Growth opportunities
        5. Recommended actions
        
        Focus on actionable insights for business improvement.
      `

      const response = await this.chatModel.invoke([
        new SystemMessage('You are a data analyst specializing in business intelligence and performance optimization.'),
        new HumanMessage(prompt)
      ])

      return {
        success: true,
        data: response.content,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error analyzing business metrics:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

module.exports = new AIService() 