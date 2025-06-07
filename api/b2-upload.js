export const config = {
  api: {
    bodyParser: false
  }
};

export default async (req, res) => {
  const { bucketId } = req.query;
  
  try {
    // 获取授权和上传URL
    const [authRes, uploadUrlRes] = await Promise.all([
      fetch(`${req.headers.origin}/api/b2-auth`),
      fetch(`${req.headers.origin}/api/b2-auth`).then(a => a.json())
        .then(({ apiUrl, authToken }) => fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
          method: 'POST',
          headers: { 
            'Authorization': authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bucketId })
        }))
    ]);
    
    const { uploadUrl, authorizationToken } = await uploadUrlRes.json();
    
    // 处理文件上传
    const formData = await new Promise((resolve, reject) => {
      const form = new multiparty.Form();
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });
    
    const file = formData.files.file[0];
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': authorizationToken,
        'X-Bz-File-Name': file.originalFilename,
        'Content-Type': file.headers['content-type'],
        'X-Bz-Content-Sha1': 'do_not_verify'
      },
      body: fs.createReadStream(file.path)
    });
    
    res.status(200).json(await uploadRes.json());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
