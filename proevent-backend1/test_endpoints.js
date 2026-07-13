async function testEndpoint() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:8080/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: 'rubelmanuelcedano447@gmail.com',
        contrasena: 'admin123'
      })
    });
    
    const loginData = await loginRes.json();
    console.log("Login response:", loginData);
    
    // Extract cookies
    const cookies = loginRes.headers.get('set-cookie');
    console.log("Cookies received:", cookies);
    
    if (!cookies) {
      console.log("No cookies received!");
      return;
    }
    
    const cookieStr = cookies.split(';')[0];
    
    // 2. Fetch /eventos
    const eventsRes = await fetch('http://localhost:8080/eventos', {
      headers: { Cookie: cookieStr }
    });
    const eventsData = await eventsRes.json();
    
    console.log("\nEvents response data length:", Array.isArray(eventsData) ? eventsData.length : 'Not an array');
    console.log("First item:", Array.isArray(eventsData) && eventsData.length > 0 ? eventsData[0] : eventsData);
    
    // 3. Fetch /eventos for specific user
    const userEventsRes = await fetch(`http://localhost:8080/eventos?usuario_id=${loginData.usuario.id_usuario}`, {
      headers: { Cookie: cookieStr }
    });
    const userEventsData = await userEventsRes.json();
    
    console.log(`\nEvents for user ${loginData.usuario.id_usuario} length:`, Array.isArray(userEventsData) ? userEventsData.length : 'Not an array');
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testEndpoint();
