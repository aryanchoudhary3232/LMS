const fs = require('fs');
const path = require('path');

// Simple contact handler: validates input and appends to a local JSON file (contacts.json)
// In a production app you'd persist to a DB and add rate-limiting / spam protection.
async function submitContact(req, res) {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'name, email and message are required' });
    }

    // basic email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ success: false, message: 'invalid email' });
    }

    const contact = {
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };

    const storePath = path.join(__dirname, '..', 'contacts.json');

    let existing = [];
    if (fs.existsSync(storePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(storePath, 'utf8') || '[]');
      } catch (err) {
        existing = [];
      }
    }

    existing.push(contact);
    fs.writeFileSync(storePath, JSON.stringify(existing, null, 2));

    // Log to server console for now
    console.log('New contact received:', contact);

    return res.json({ success: true, message: 'contact received' });
  } catch (err) {
    console.error('contact error', err);
    return res.status(500).json({ success: false, message: 'internal server error' });
  }
}

module.exports = { submitContact };
