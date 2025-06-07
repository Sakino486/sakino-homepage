export default async (req, res) => {
  const { bucketId, prefix } = req.query;
  
  try {
    // 先获取授权
    const authRes = await fetch(`${req.headers.origin}/api/b2-auth`);
    const { apiUrl, authToken } = await authRes.json();
    
    // 获取文件列表
    const listRes = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: { 
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        bucketId,
        prefix,
        maxFileCount: 1000
      })
    });
    
    res.status(200).json(await listRes.json());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
