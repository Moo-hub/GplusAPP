import { http, HttpResponse, delay } from 'msw';

// محاكاة قاعدة البيانات المحلية
const mockUsers = [
  {
    id: 1,
    name: 'User Demo',
    email: 'user@example.com',
    // كلمة المرور هي "password"
    password: '$2a$10$dRQlqAhHWf0j0yHLZ3KE0.PakyVc.gXyaQMrjXzl27Y3GXlQH4I1u'
  },
  {
    id: 2,
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  },
  {
    id: 3,
    name: 'Admin User',
    email: 'admin@gplus.com',
    password: 'adminpassword123'
  }
];

// بيانات وهمية
const mockPoints = {
  balance: 1200,
  impact: "~8kg CO₂",
  reward: "20% off next pickup"
};

const mockCompanies = [
  { id: 1, name: "EcoCorp", icon: "🏢" },
  { id: 2, name: "GreenTech", icon: "🌱" },
  { id: 3, name: "RecycleNow", icon: "♻️" }
];

const mockVehicles = [
  { id: 1, name: "Truck #12", status: "Active", icon: "🚛" },
  { id: 2, name: "Van #8", status: "Idle", icon: "🚚" },
  { id: 3, name: "Loader #3", status: "On Route", icon: "🚜" }
];

const mockPaymentMethods = [
  { id: 1, name: "Credit Card", icon: "💳" },
  { id: 2, name: "Wallet", icon: "👛" },
  { id: 3, name: "Bank Transfer", icon: "🏦" }
];

// محاكاة المصادقة
export const handlers = [
  // Backend-style login endpoint (for form data)
  http.post('/api/v1/auth/login', async ({ request }) => {
    await delay(500);
    
    // Get form data (the way the backend expects it)
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');
    
    const user = mockUsers.find(u => u.email === username);
    
    // Simple password check
    if (!user || user.password !== password) {
      return new HttpResponse(
        JSON.stringify({ 
          detail: 'Incorrect username or password'
        }), 
        { status: 401 }
      );
    }
    
    // Create mock token
    const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2, 10);
    
    // Match the format expected by the frontend
    return HttpResponse.json({
      access_token: token,
      token_type: 'bearer',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.id === 3 ? 'admin' : 'user'
      }
    }, { status: 200 });
  }),
  
  // Original login endpoint (keep for compatibility)
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500);
    const body = await request.json();
    const email = body.email;
    const password = body.password;
    
    const user = mockUsers.find(u => u.email === email);
    
    // في الحالة الحقيقية، يجب التحقق من كلمة المرور بشكل آمن
    if (!user || password !== user.password) {
      return new HttpResponse(
        JSON.stringify({ message: 'خطأ في البريد الإلكتروني أو كلمة المرور' }), 
        { status: 401 }
      );
    }
    
    // إنشاء توكن وهمي
    const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2, 10);
    
    return HttpResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: token
    }, { status: 200 });
  }),
  
  // التسجيل
  http.post('/api/auth/register', async ({ request }) => {
    await delay(700);
    const userData = await request.json();
    
    // التحقق من عدم وجود المستخدم
    if (mockUsers.some(u => u.email === userData.email)) {
      return new HttpResponse(
        JSON.stringify({ message: 'البريد الإلكتروني مستخدم بالفعل' }), 
        { status: 422 }
      );
    }
    
    // إنشاء مستخدم جديد
    const newUser = {
      id: mockUsers.length + 1,
      name: userData.name,
      email: userData.email,
      password: 'hashed_password' // في الواقع، يجب تشفير كلمة المرور
    };
    
    mockUsers.push(newUser);
    
    const token = 'mock-jwt-token-' + Math.random().toString(36).substr(2, 10);
    
    return HttpResponse.json({
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      token: token
    }, { status: 201 });
  }),
  
  // Backend style "me" endpoint
  http.get('/api/v1/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Find user based on token (in a real app, we'd decode the JWT)
    // Here we'll just return a default user
    const user = mockUsers[1]; // Using test@example.com user
    
    return HttpResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.id === 3 ? 'admin' : 'user'
    }, { status: 200 });
  }),
  
  // Original "me" endpoint (for compatibility)
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    const user = mockUsers[0]; // للبساطة، نفترض أنه المستخدم الأول دائمًا
    
    return HttpResponse.json({
      id: user.id,
      name: user.name,
      email: user.email
    }, { status: 200 });
  }),
  
  // تسجيل الخروج
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ message: 'تم تسجيل الخروج بنجاح' }, { status: 200 });
  }),
  
  // إضافة ال Authorization Header requirement للـ API الأخرى
  http.get('/api/points', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    return HttpResponse.json(mockPoints, { status: 200 });
  }),
  
  // شركات
  http.get('/api/companies', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json(mockCompanies, { status: 200 });
  }),
  
  // مركبات
  http.get('/api/vehicles', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json(mockVehicles, { status: 200 });
  }),
  
  // طرق الدفع
  http.get('/api/payment-methods', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json(mockPaymentMethods, { status: 200 });
  }),
  
  // طلب الالتقاط
  http.post('/api/pickup', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return new HttpResponse(null, { status: 401 });
    
    return HttpResponse.json({
      success: true,
      requestId: "REQ-" + Math.floor(Math.random() * 10000),
      estimatedTime: "30 minutes"
    }, { status: 201 });
  })
];