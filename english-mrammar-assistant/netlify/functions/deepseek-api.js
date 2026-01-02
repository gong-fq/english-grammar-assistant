const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // 处理预检请求（OPTIONS）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const requestData = JSON.parse(event.body);
    const { apiKey, messages, max_tokens, temperature } = requestData;

    // 验证API密钥
    if (!apiKey) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: 'API key is required' })
      };
    }

    // DeepSeek API端点
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';

    // 构建请求体
    const requestBody = {
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: max_tokens || 2000,
      temperature: temperature || 0.7,
      stream: false
    };

    console.log('Sending request to DeepSeek API...');

    // 发送请求到DeepSeek API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid response from DeepSeek API');
    }

    // 如果API返回错误
    if (!response.ok) {
      const errorMsg = responseData.error?.message || responseData.error || 'Unknown API error';
      console.error('DeepSeek API error:', errorMsg);
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ 
          error: `DeepSeek API Error: ${errorMsg}`,
          details: responseData
        })
      };
    }

    // 返回成功的响应
    console.log('DeepSeek API request successful');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Error in deepseek-api function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};