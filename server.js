import 'dotenv/config';

import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import cors from 'cors';

import { checkAuth } from './authMiddleware.js';

const app = express();
const PORT = 3000;

const whitelist = ['http://localhost:5173', 'https://test-redis-front.vercel.app'];

app.use(cors({
  origin: whitelist,
  credentials: true,
}));

app.use(express.json());

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

console.log('PRODUCTION?', process.env.NODE_ENV === 'production');

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
    }
  })
);

app.get('/', (req, res) => {
  req.session.views = (req.session.views || 0) + 1;
  res.send(`Number of views: ${req.session.views}`);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'pwd') {
    req.session.user = { username };
    
    return res.status(200).json({
      message: 'Connexion réussie',
      user: req.session.user,
    });
  } else {
    return res.status(401).json({
      message: 'Identifiants incorrects',
    })
  }
});

app.get('/session', (req, res) => {
  if (req.session.user) {
    res.status(200).json({
      message: 'Session existante',
      session: req.session.user,
    });
  } else {
    res.status(200).json({
      message: 'Aucune session active',
    });
  }
});

app.get('/private', checkAuth, (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur la page privée',
    user: req.session.user,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
