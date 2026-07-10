export default function handler(req, res) {
  res.status(404).json({ error: "Auth0 endpoints are disabled. Please use /login." });
}
