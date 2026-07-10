const { expressjwt: jwt } = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const { dbQuery } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-connecting-future-key-change-me-in-production';

// 1. Strict JWT Middleware (HS256 symmetric signature using local secret)
const checkJwt = jwt({
  secret: JWT_SECRET,
  algorithms: ['HS256'],
});

// Custom JWT validator for flexible verify
const verifyLocalToken = async (token) => {
  if (!token) return null;
  try {
    return jsonwebtoken.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (err) {
    console.warn('Local Token Verification Failed:', err.message);
    return null;
  }
};

// 2. Helper to determine if a request comes from an Admin
async function isAdminRequest(req) {
  const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
  const sub = req.auth && req.auth.sub;
  if (!email && !sub) return false;
  
  try {
    if (email) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') return true;
    }
    if (sub) {
      const { rows } = await dbQuery('SELECT user_type FROM users WHERE auth0_id = ? LIMIT 1', [sub]);
      if (rows && rows[0] && String(rows[0].user_type || '').toLowerCase() === 'admin') return true;
    }
  } catch (error) {
    console.warn('Admin verification failed:', error.message);
  }
  return false;
}

// 3. Identity extractors
function getRequestIdentity(req) {
  const email = req.auth && (req.auth['https://schemas.quickstart/email'] || req.auth.email);
  const auth0Id = req.auth && req.auth.sub;
  return {
    email: email ? String(email).trim().toLowerCase() : null,
    auth0Id: auth0Id ? String(auth0Id).trim() : null,
  };
}

// 4. Flexible JWT validation middleware
const checkJwtFlexible = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const verified = await verifyLocalToken(token);

    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.auth = verified;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Async version that fetches email from DB if missing from JWT (Auth0 fallback retired, but kept helper shape for compat)
async function getRequestIdentityWithAuth0Fallback(req) {
  return getRequestIdentity(req);
}

// Identity injection middleware
const injectIdentity = async (req, res, next) => {
  req.identity = await getRequestIdentityWithAuth0Fallback(req);
  next();
};

module.exports = {
  checkJwt,
  verifyAuth0Token: verifyLocalToken, // Keep name for compatibility across other components
  isAdminRequest,
  getRequestIdentity,
  checkJwtFlexible,
  getRequestIdentityWithAuth0Fallback,
  injectIdentity
};
