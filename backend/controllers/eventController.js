const { dbQuery } = require('../config/db');
const nodemailer = require('nodemailer');

// GET all events
async function getEvents(req, res) {
  try {
    const { user_email, all } = req.query || {};
    let q = `SELECT id, title, description, event_date, event_time, duration, location, is_virtual, event_type, image_url, tags, organizer, max_attendees, current_attendees, price, approval_status FROM events`;
    const params = [];
    if (!all || String(all) !== 'true') {
      q += ` WHERE approval_status = 'approved'`;
    }
    q += ` ORDER BY created_at DESC`;

    const { rows } = await dbQuery(q, params);
    const mapped = (rows || []).map(r => ({
      id: r.id ? String(r.id) : '',
      title: r.title || '',
      description: r.description || '',
      event_date: r.event_date ? new Date(r.event_date).toISOString() : null,
      event_time: r.event_time || '',
      duration: r.duration || '',
      location: r.location || '',
      is_virtual: !!r.is_virtual,
      event_type: r.event_type || '',
      image_url: r.image_url || '',
      tags: r.tags ? (Array.isArray(r.tags) ? r.tags : String(r.tags).split(',').map(s => s.trim()).filter(Boolean)) : [],
      organizer: r.organizer || '',
      max_attendees: r.max_attendees || null,
      current_attendees: r.current_attendees || 0,
      price: r.price || 0,
      approval_status: r.approval_status || 'pending'
    }));

    if (user_email) {
      const registrationsRes = await dbQuery('SELECT event_id FROM event_registrations WHERE user_email = ?', [user_email]);
      const registeredEventIds = new Set((registrationsRes.rows || []).map(r => Number(r.event_id)));
      mapped.forEach(ev => {
        ev.isRegistered = registeredEventIds.has(Number(ev.id));
      });
    }

    return res.json(mapped);
  } catch (e) {
    console.error('Events fetch error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to fetch events' });
  }
}

// POST create event
async function createEvent(req, res) {
  try {
    const { title, description, event_date, event_time, duration, location, event_type, is_virtual, image_url, tags, organizer } = req.body;
    console.log("POST /api/events received:", { title, image_url, organizer });

    const user_auth0_id = req.auth?.sub || 'anonymous';
    const tagsVal = Array.isArray(tags) ? tags.join(',') : tags;

    const sqlHelper = `
      INSERT INTO events 
      (user_auth0_id, title, description, event_date, event_time, duration, location, event_type, is_virtual, image_url, tags, organizer, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;

    const statusVal = req.body.approval_status || 'approved';
    const values = [
      user_auth0_id,
      title,
      description,
      event_date,
      event_time,
      duration,
      location,
      event_type,
      is_virtual,
      image_url,
      tagsVal,
      organizer,
      statusVal
    ];

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const result = await dbQuery(sqlHelper, values);
    res.json({ message: "Success", id: result.rows[0].id });
  } catch (e) {
    console.error("Event Create Error:", e);
    res.status(500).json({ error: e.message });
  }
}

// PATCH update event
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const allowed = ['approval_status', 'title', 'description', 'event_date', 'event_time', 'duration', 'location', 'is_virtual', 'event_type', 'image_url', 'tags', 'organizer', 'max_attendees', 'current_attendees', 'price'];
    const fields = [];
    const params = [];
    Object.keys(updates).forEach(key => {
      if (allowed.includes(key)) {
        fields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });
    if (fields.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });
    params.push(id);
    const q = `UPDATE events SET ${fields.join(', ')} WHERE id = ? RETURNING id`;
    const { rows } = await dbQuery(q, params);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    return res.json({ message: 'Event updated', id });
  } catch (e) {
    console.error('Event update error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to update event' });
  }
}

// DELETE single event
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const q = `DELETE FROM events WHERE id = ? RETURNING id`;
    const { rows } = await dbQuery(q, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json({ message: 'Event deleted successfully', id });
  } catch (e) {
    console.error('Event deletion error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to delete event' });
  }
}

// DELETE clear all events
async function clearAllEvents(req, res) {
  try {
    await dbQuery('DELETE FROM events');
    return res.json({ message: 'All events cleared successfully' });
  } catch (e) {
    console.error('Events clear error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to clear events' });
  }
}

// POST register for event
async function registerEvent(req, res) {
  try {
    const { id } = req.params;
    const { user_email, user_name } = req.body;

    if (!user_email) return res.status(400).json({ error: 'Email is required' });

    const eventRes = await dbQuery('SELECT * FROM events WHERE id = ?', [id]);
    const event = eventRes.rows[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const check = await dbQuery('SELECT * FROM event_registrations WHERE event_id = ? AND user_email = ?', [id, user_email]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Already registered' });

    await dbQuery('INSERT INTO event_registrations (event_id, user_email, user_name) VALUES (?, ?, ?)', [id, user_email, user_name]);
    await dbQuery('UPDATE events SET current_attendees = current_attendees + 1 WHERE id = ?', [id]);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mode = event.is_virtual ? 'Virtual (Online)' : 'Offline (In-person)';
      const locationLabel = event.is_virtual ? 'Meeting Link' : 'Venue';
      const locationValue = event.location || 'TBD';
      const organizer = event.organizer || 'Alumni Coordinator';

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user_email,
        subject: `Registration Confirmed: ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Event Registration Confirmed</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="font-size: 16px; color: #333;">Hi ${user_name || 'Student'},</p>
              <p style="font-size: 16px; color: #333;">You have successfully registered for <strong>${event.title}</strong>.</p>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 8px 0; color: #555; font-style: italic;">"${event.description || 'Join us for this exciting event!'}"</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
                <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${new Date(event.event_date).toDateString()}</p>
                <p style="margin: 8px 0;"><strong>🕒 Time:</strong> ${event.event_time} (${event.duration || 'N/A'})</p>
                <p style="margin: 8px 0;"><strong>📍 Format:</strong> ${mode}</p>
                <p style="margin: 8px 0;"><strong>🗺️ ${locationLabel}:</strong> ${locationValue}</p>
              </div>
              <p style="font-size: 14px; color: #666;">If you have any questions or need to cancel your registration, please contact ${organizer}.</p>
              <p style="margin-top: 25px; font-size: 12px; color: #999; text-align: center;">AlumNex Mentorship Platform</p>
            </div>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("SMTP error sending event registration confirmation:", error);
      });
    }

    return res.json({ message: 'Registered successfully' });
  } catch (e) {
    console.error('Event registration error:', e.message || e);
    return res.status(500).json({ error: e.message || 'Failed to register for event' });
  }
}

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  clearAllEvents,
  registerEvent
};
