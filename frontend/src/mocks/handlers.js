import { http, HttpResponse } from 'msw';import { http, HttpResponse } from 'msw';



/**export const handlers = [

 * @file This file configures the Mock Service Worker (MSW) for API mocking.  // تسجيل الدخول - Proxy إلى Backend debug endpoint

 * It intercepts API requests during development and returns mock data,  http.post('/api/v1/auth/login', async ({ request }) => {

 * allowing the frontend to be developed and tested independently of the backend.    console.log('🔄 MSW: Proxying login to Backend debug endpoint');

 */    

    try {

// --- Mock Data ---      const formData = await request.formData();

      const username = formData.get('username');

const mockUsers = [      const password = formData.get('password');

  {      

    id: 1,      console.log('📧 Login attempt for:', username);

    name: 'Test User',      

    email: 'test@example.com',      const response = await fetch('http://localhost:8000/api/v1/debug/simple-login', {

    password: 'password123',        method: 'POST',

    role: 'user',        headers: {

  },          'Content-Type': 'application/x-www-form-urlencoded',

  {        },

    id: 2,        body: new URLSearchParams({

    name: 'Admin User',          username: username?.toString() || '',

    email: 'admin@gplus.com',          password: password?.toString() || ''

    password: 'admin123',        })

    role: 'admin',      });

  },      

];      if (!response.ok) {

        console.log('❌ Backend login failed');

// --- API Handlers ---        return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });

      }

export const handlers = [      

  /**      const result = await response.json();

   * Intercepts POST requests to /api/v1/auth/login for user authentication.      console.log('✅ Backend login successful:', result.user?.name);

   * Validates credentials against the mockUsers array.      return HttpResponse.json(result);

   */      

  http.post('/api/v1/auth/login', async ({ request }) => {    } catch (error) {

    try {      console.error('🔥 MSW Proxy Error:', error);

      const formData = await request.formData();      return HttpResponse.json({ detail: 'Authentication service unavailable' }, { status: 503 });

      const email = formData.get('username'); // The form uses 'username' for the email field    }

      const password = formData.get('password');  }),



      const user = mockUsers.find((u) => u.email === email);  // بيانات النقاط

  http.get('/api/v1/users/me/points', () => {

      if (!user || user.password !== password) {    return HttpResponse.json({

        return HttpResponse.json(      total_points: 250,

          { detail: 'Invalid username or password' },      current_balance: 180,

          { status: 401 }      points_used: 70,

        );      transactions: [

      }        { id: 1, type: 'earned', amount: 50, description: 'Plastic recycling', date: '2024-01-15' },

        { id: 2, type: 'earned', amount: 30, description: 'Paper recycling', date: '2024-01-14' },

      // On successful login, return a mock JWT and user data.        { id: 3, type: 'used', amount: -20, description: 'Reward redemption', date: '2024-01-13' }

      return HttpResponse.json({      ]

        access_token: `mock-jwt-token-for-${user.id}`,    });

        token_type: 'bearer',  }),

        user: {

          id: user.id,  // طلبات الاستلام

          name: user.name,  http.get('/api/v1/pickup-requests', () => {

          email: user.email,    return HttpResponse.json([

          role: user.role,      {

        },        id: 1,

      });        status: 'pending',

    } catch (error) {        materials: ['plastic', 'paper'],

      return HttpResponse.json(        estimated_weight: 5.5,

        { detail: 'An unexpected error occurred during login.' },        scheduled_date: '2024-01-20',

        { status: 500 }        address: 'شارع التحرير، القاهرة'

      );      },

    }      {

  }),        id: 2,

        status: 'completed',

  /**        materials: ['glass', 'metal'],

   * Intercepts GET requests to /api/v1/dashboard/stats to provide mock statistics.        estimated_weight: 3.2,

   */        scheduled_date: '2024-01-18',

  http.get('/api/v1/dashboard/stats', () => {        address: 'شارع الجامعة، الجيزة'

    return HttpResponse.json({      }

      total_users: 2840,    ]);

      total_recycled_kg: 12500,  }),

      active_drivers: 67,

      pending_pickups: 35,  // بيانات الشركات

    });  http.get('/api/v1/companies', () => {

  }),    return HttpResponse.json([

      {

  /**        id: 1,

   * Intercepts GET requests for user points.        name: 'شركة إعادة التدوير الخضراء',

   */        type: 'recycling',

  http.get('/api/v1/user/points', () => {        rating: 4.5,

    return HttpResponse.json({        services: ['plastic', 'paper', 'glass'],

      total_points: 1850,        location: 'القاهرة'

      carbon_credits: 120,      },

    });      {

  }),        id: 2,

        name: 'مؤسسة البيئة النظيفة',

  /**        type: 'waste_management',

   * Intercepts GET requests for recent pickup requests.        rating: 4.8,

   */        services: ['electronic', 'metal', 'battery'],

  http.get('/api/v1/pickup-requests', () => {        location: 'الإسكندرية'

    return HttpResponse.json([      }

      {    ]);

        id: 'REQ-001',  }),

        status: 'Completed',

        date: '2025-10-12',  // بيانات الإحصائيات

        waste_type: 'Plastics',  http.get('/api/v1/dashboard/stats', () => {

        points_earned: 150,    return HttpResponse.json({

      },      total_pickups: 15,

      {      total_weight: 45.7,

        id: 'REQ-002',      carbon_saved: 23.4,

        status: 'Pending',      points_earned: 180,

        date: '2025-10-14',      monthly_stats: {

        waste_type: 'Mixed',        pickups: 5,

        points_earned: 0,        weight: 12.3,

      },        carbon: 6.7,

    ]);        points: 45

  }),      }

];    });
  })
];        pickups: 5,
        weight: 12.3,
        carbon: 6.7,
        points: 45
      }
    });
  })
];
