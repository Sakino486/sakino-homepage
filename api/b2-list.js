export default async (req, res) => {
  // 1. 验证查询参数
  const { bucketId, prefix } = req.query;
  if (!bucketId) {
    return res.status(400).json({ 
      error: "缺少必要参数",
      message: "必须提供 bucketId 参数"
    });
  }

  try {
    // 2. 获取授权 (添加错误处理)
    const authRes = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : req.headers.origin}/api/b2-auth`);
    
    if (!authRes.ok) {
      throw new Error(`授权失败: ${authRes.status}`);
    }

    const { apiUrl, authToken } = await authRes.json();
    if (!apiUrl || !authToken) {
      throw new Error("无效的授权响应");
    }

    // 3. 获取文件列表 (添加超时处理)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const listRes = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: { 
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        bucketId,
        prefix: prefix || "",
        maxFileCount: 1000,
        delimiter: "/"  // 添加分隔符以便目录结构
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!listRes.ok) {
      const errorData = await listRes.json();
      throw new Error(`B2 API错误: ${errorData.code || listRes.status}`);
    }

    // 4. 处理响应数据
    const listData = await listRes.json();
    
    // 过滤无效文件
    const validFiles = (listData.files || []).filter(file => 
      file.fileName && file.fileId
    );

    res.status(200).json({
      files: validFiles,
      nextFileName: listData.nextFileName, // 用于分页
      nextFileId: listData.nextFileId
    });

  } catch (error) {
    console.error('[B2 List Error]', error);
    res.status(500).json({ 
      error: "获取文件列表失败",
      details: error.message,
      tip: error.message.includes('授权') ? 
        "请检查授权服务是否正常" : 
        "请检查bucketId是否正确"
    });
  }
};
