import multiparty from 'multiparty';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async (req, res) => {
  // 1. 验证请求方法和参数
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  const { bucketId } = req.query;
  if (!bucketId) {
    return res.status(400).json({ error: '缺少 bucketId 参数' });
  }

  try {
    // 2. 获取授权和上传URL（添加错误处理和超时）
    const [authRes, uploadUrlRes] = await Promise.all([
      fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : req.headers.origin}/api/b2-auth`),
      fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : req.headers.origin}/api/b2-auth`)
        .then(res => {
          if (!res.ok) throw new Error(`授权失败: ${res.status}`);
          return res.json();
        })
        .then(({ apiUrl, authToken }) => {
          return fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: { 
              'Authorization': authToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bucketId }),
            timeout: 5000 // 5秒超时
          });
        })
    ]);

    const { uploadUrl, authorizationToken } = await uploadUrlRes.json();
    if (!uploadUrl || !authorizationToken) {
      throw new Error('无效的上传URL或令牌');
    }

    // 3. 解析多部分表单数据
    const { fields, files } = await new Promise((resolve, reject) => {
      const form = new multiparty.Form();
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('表单解析错误:', err);
          reject(new Error('文件解析失败'));
        }
        resolve({ fields, files });
      });
    });

    // 4. 验证文件存在
    if (!files?.file?.[0]) {
      return res.status(400).json({ error: '未上传文件' });
    }

    const file = files.file[0];
    const fileName = `uploads/${Date.now()}-${file.originalFilename.replace(/[^\w.-]/g, '_')}`;

    // 5. 上传文件到B2
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'Content-Type': file.headers['content-type'] || 'application/octet-stream',
        'X-Bz-Content-Sha1': 'do_not_verify'
      },
      body: fs.createReadStream(file.path),
      timeout: 30000 // 30秒超时
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      throw new Error(`上传失败: ${errorData.code || uploadRes.status}`);
    }

    const uploadResult = await uploadRes.json();

    // 6. 清理临时文件
    fs.unlink(file.path, (err) => {
      if (err) console.error('临时文件删除失败:', err);
    });

    // 7. 返回成功响应
    res.status(200).json({
      success: true,
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      downloadUrl: `${process.env.B2_DOWNLOAD_URL || 'https://f005.backblazeb2.com'}/file/${bucketId}/${uploadResult.fileName}`
    });

  } catch (error) {
    console.error('[B2 Upload Error]', error);
    res.status(500).json({ 
      error: '文件上传失败',
      details: error.message,
      tip: error.message.includes('授权') ? 
           '请检查B2授权配置' : 
           '请检查网络连接或文件大小'
    });
  }
};
