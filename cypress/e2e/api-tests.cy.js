// api-tests.cy.js - Testing API endpoints directly

describe('API Endpoints', () => {
  let authToken;
  let testUser;

  before(() => {
    // Create a test user and get auth token before tests
    const userData = {
      name: `API Test User ${Date.now()}`,
      email: `api_test_${Date.now()}@example.com`,
      password: 'SecureApiTest123!'
    };

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/register`,
      body: userData
    }).then((registerResponse) => {
      expect(registerResponse.status).to.eq(201);
      
      // Login to get auth token
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: {
          email: userData.email,
          password: userData.password
        }
      }).then((loginResponse) => {
        expect(loginResponse.status).to.eq(200);
        authToken = loginResponse.body.access_token;
        testUser = loginResponse.body.user;
      });
    });
  });

  describe('Authentication Endpoints', () => {
    it('should refresh the auth token', () => {
      // Wait a moment to ensure the token isn't too fresh
      cy.wait(1000);
      
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/refresh`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('access_token');
        expect(response.body.access_token).to.be.a('string');
        expect(response.body.access_token).to.not.eq(authToken);
        
        // Update token for subsequent requests
        authToken = response.body.access_token;
      });
    });

    it('should validate token', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/auth/validate`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('valid', true);
        expect(response.body).to.have.property('user');
        expect(response.body.user.id).to.eq(testUser.id);
      });
    });
  });

  describe('Pickup Endpoints', () => {
    let pickupId;
    
    it('should create a pickup request', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      
      const pickupData = {
        scheduledDate: futureDate.toISOString().split('T')[0],
        scheduledTime: '14:00',
        address: '789 API Test Street',
        materials: ['PLASTIC', 'PAPER'],
        estimatedWeight: 3.5,
        notes: 'API test pickup request'
      };
      
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/pickups`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: pickupData
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body.address).to.eq(pickupData.address);
        expect(response.body.status).to.eq('SCHEDULED');
        
        pickupId = response.body.id;
      });
    });
    
    it('should get user pickups', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/pickups/user`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.at.least(1);
        
        // Verify our created pickup is in the list
        const ourPickup = response.body.find(p => p.id === pickupId);
        expect(ourPickup).to.exist;
      });
    });
    
    it('should update a pickup', () => {
      const updateData = {
        notes: 'Updated via API test',
        estimatedWeight: 4.5
      };
      
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/pickups/${pickupId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: updateData
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.id).to.eq(pickupId);
        expect(response.body.notes).to.eq(updateData.notes);
        expect(response.body.estimatedWeight).to.eq(updateData.estimatedWeight);
      });
    });
    
    it('should cancel a pickup', () => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/pickups/${pickupId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        
        // Verify pickup is cancelled
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/pickups/${pickupId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.status).to.eq('CANCELLED');
        });
      });
    });
  });

  describe('Points and Rewards Endpoints', () => {
    it('should get user points balance', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/points/balance`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('balance');
        expect(response.body.balance).to.be.a('number');
      });
    });
    
    it('should get available rewards', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/rewards`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        // There should be at least some rewards available
        expect(response.body.length).to.be.at.least(1);
        
        // Check reward structure
        const firstReward = response.body[0];
        expect(firstReward).to.have.property('id');
        expect(firstReward).to.have.property('name');
        expect(firstReward).to.have.property('description');
        expect(firstReward).to.have.property('pointsCost');
      });
    });
  });

  describe('User Profile Endpoints', () => {
    it('should get user profile', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/users/profile`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.id).to.eq(testUser.id);
        expect(response.body.email).to.eq(testUser.email);
        expect(response.body.name).to.eq(testUser.name);
      });
    });
    
    it('should update user profile', () => {
      const updatedProfile = {
        name: `Updated Name ${Date.now()}`,
        preferences: {
          notifications: {
            email: true,
            push: false
          },
          theme: 'dark'
        }
      };
      
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/users/profile`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: updatedProfile
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.name).to.eq(updatedProfile.name);
        expect(response.body.preferences).to.deep.equal(updatedProfile.preferences);
      });
    });
  });

  // Clean up after tests
  after(() => {
    if (testUser && testUser.id) {
      // Delete the test user if cleanup endpoint exists
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/test/users/${testUser.id}`,
        failOnStatusCode: false // Don't fail the test if this endpoint doesn't exist
      });
    }
  });
});