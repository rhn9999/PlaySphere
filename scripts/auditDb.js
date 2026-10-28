import axios from 'axios';

async function testHttpLogin() {
  const payloads = [
    { email: 'khankng432@gmail.com', password: '123456' },
    { username: 'yug_49', password: '123456' },
    { identifier: 'khankng432@gmail.com', password: '123456' },
    { login: 'khankng432@gmail.com', password: '123456' },
    { login: 'yug_49', password: '123456' },
    { login: '@yug_49', password: '123456' },
    { emailOrUsername: 'khankng432@gmail.com', password: '123456' },
  ];

  for (const p of payloads) {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', p);
      console.log(`✅ HTTP 200 for ${JSON.stringify(p)}: user=${res.data.data?.user?.username}`);
    } catch (err) {
      console.log(`❌ HTTP ${err.response?.status} for ${JSON.stringify(p)}: ${JSON.stringify(err.response?.data)}`);
    }
  }
}

testHttpLogin();
