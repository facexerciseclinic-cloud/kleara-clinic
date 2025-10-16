const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let app;
let mongod;

describe('Auth flow', function() {
  this.timeout(20000);

  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    // require app after setting env
    app = require('../../server/app');
    // wait a bit for db connect if needed
    await new Promise(r => setTimeout(r, 500));
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  it('should login, refresh and logout (demo user)', async () => {
    const agent = request.agent(app);
    // login
    const loginRes = await agent.post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
    if (loginRes.status !== 200) throw new Error('Login failed: ' + JSON.stringify(loginRes.body));
    // refresh
    const refreshRes = await agent.post('/api/auth/refresh').send();
    if (refreshRes.status !== 200) throw new Error('Refresh failed: ' + JSON.stringify(refreshRes.body));
    // logout
    const logoutRes = await agent.post('/api/auth/logout').send();
    if (logoutRes.status !== 200) throw new Error('Logout failed: ' + JSON.stringify(logoutRes.body));
  });
});
