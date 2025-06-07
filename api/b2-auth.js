export default async (req, res) => {
  const { 0056a27240916c80000000001, K005LYE7Ol246Em2MDa0bxhV9sqtixY } = process.env;
  
  if (!B2_KEY_ID || !B2_APP_KEY) {
    return res.status(500).json({ error: "Backblaze 凭证未配置" });
  }

  try {
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { 'Authorization': `Basic ${Buffer.from(`${0056a27240916c80000000001}:${K005LYE7Ol246Em2MDa0bxhV9sqtixY}`).toString('base64')}` }
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
