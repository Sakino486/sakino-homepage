export default async (req, res) => {
  // 从环境变量获取凭证（注意变量名不能以数字开头）
  const { B2_KEY_ID, B2_APP_KEY } = process.env;
  
  if (!B2_KEY_ID || !B2_APP_KEY) {
    return res.status(500).json({ 
      error: "Backblaze 凭证未配置",
      message: "请在Vercel环境变量中配置B2_KEY_ID和B2_APP_KEY"
    });
  }

  try {
    // 1. 构建Basic Auth头（注意处理特殊字符）
    const authString = `${B2_KEY_ID}:${B2_APP_KEY}`;
    const encodedAuth = Buffer.from(authString).toString('base64');

    // 2. 调用B2授权接口
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { 
        'Authorization': `Basic ${encodedAuth}`,
        'Accept': 'application/json'
      }
    });
    
    // 3. 处理响应
    if (!authRes.ok) {
      const errorData = await authRes.json();
      throw new Error(`Backblaze API错误: ${errorData.code || authRes.status}`);
    }

    const authData = await authRes.json();
    res.status(200).json({
      apiUrl: authData.apiUrl,
      authToken: authData.authorizationToken,
      // 可选返回其他必要字段
      downloadUrl: authData.downloadUrl
    });

  } catch (error) {
    console.error('[B2 Auth Error]', error);
    res.status(500).json({ 
      error: "授权失败",
      details: error.message,
      tip: "请检查密钥是否正确且有权限"
    });
  }
};

