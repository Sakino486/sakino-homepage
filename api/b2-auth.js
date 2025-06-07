export default async (req, res) => {
  const { B2_KEY_ID, B2_APP_KEY } = process.env;
  
  if (!B2_KEY_ID || !B2_APP_KEY) {
    return res.status(500).json({ error: "Backblaze 凭证未配置" });
  }

  try {
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { 'Authorization': `Basic ${Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64')}` }
    });
    
    const authData = await authRes.json();
    res.status(200).json({
      apiUrl: authData.apiUrl,
      authToken: authData.authorizationToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
