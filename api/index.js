// Vercel Node function: forwards every /api/* request (see vercel.json rewrites)
// to the NestJS app built by `nx build api`. Do not add logic here.
module.exports = require('../dist/apps/api/vercel.js').default;
