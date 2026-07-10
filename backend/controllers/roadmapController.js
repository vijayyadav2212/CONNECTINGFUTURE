const { dbQuery } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const { isAdminRequest } = require('../middlewares/authMiddleware');

const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || process.env.AUTH0_SECRET || 'connectingfuture-quiz-secret';

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signQuizPayload(payload) {
  const data = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', QUIZ_TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyQuizPayload(token) {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', QUIZ_TOKEN_SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(data));
    if (!parsed || !parsed.exp || Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const normalizeRoadmap = (roadmap) => {
  if (!roadmap) return null;
  const r = { ...roadmap };
  if (typeof r.tags === 'string') {
    r.tags = r.tags.split(',').filter(Boolean);
  } else if (!r.tags) {
    r.tags = [];
  }
  
  if (r.milestones_json) {
    r.milestones = r.milestones_json;
    delete r.milestones_json;
  }
  if (r.resources_json) {
    r.resources = r.resources_json;
    delete r.resources_json;
  }
  if (r.generation_meta_json) {
    r.generation_meta = r.generation_meta_json;
    delete r.generation_meta_json;
  }
  
  r.is_published = !!r.is_published;
  return r;
};

// GET all roadmaps
async function getRoadmaps(req, res) {
  try {
    const { owner_email, is_published, page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const statsAll = await dbQuery('SELECT COUNT(*) as count FROM roadmaps');
    const statsPub = await dbQuery('SELECT COUNT(*) as count FROM roadmaps WHERE is_published = TRUE');
    const totalCount = parseInt(statsAll.rows[0]?.count || 0, 10);
    const publishedCount = parseInt(statsPub.rows[0]?.count || 0, 10);

    let query = 'SELECT * FROM roadmaps';
    const params = [];
    const conditions = [];

    if (owner_email) {
      conditions.push('owner_email = ?');
      params.push(owner_email);
    }

    if (is_published === 'true') {
      conditions.push('is_published = TRUE');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(l, offset);

    const { rows } = await dbQuery(query, params);
    
    return res.json({ 
      roadmaps: rows.map(normalizeRoadmap), 
      page: p, 
      limit: l, 
      totalCount, 
      publishedCount 
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST create roadmap
async function createRoadmap(req, res) {
  try {
    const {
      owner_email,
      title,
      description,
      category,
      level,
      duration,
      phases,
      modules_link,
      tags,
      is_published = false
    } = req.body || {};

    if (!owner_email || !title || !description || !category || !level || !duration || !phases) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await dbQuery(`
      INSERT INTO roadmaps (owner_email, title, description, category, level, duration, phases, modules_link, tags, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [owner_email, title, description, category, level, duration, parseInt(phases, 10), modules_link || null, tags || null, !!is_published]);

    return res.status(201).json(rows && rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET single roadmap
async function getRoadmapById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await dbQuery('SELECT * FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(normalizeRoadmap(rows[0]));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// PUT update roadmap
async function updateRoadmap(req, res) {
  try {
    const { id } = req.params;
    const allowed = ['title', 'description', 'category', 'level', 'duration', 'phases', 'modules_link', 'tags', 'is_published'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'phases' ? parseInt(req.body[key], 10) : req.body[key]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push('updated_at = NOW()');
    values.push(id);
    await dbQuery(`UPDATE roadmaps SET ${updates.join(', ')} WHERE id = ?`, values);
    const { rows } = await dbQuery('SELECT * FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    return res.json(normalizeRoadmap(rows && rows[0]));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// DELETE roadmap
async function deleteRoadmap(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await dbQuery('DELETE FROM roadmaps WHERE id = ?', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST generate roadmap using Gemini (Admin only)
async function generateRoadmap(req, res) {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { domain, specialization, prompt: customPrompt } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const adminPrompt = customPrompt || `Generate a detailed learning roadmap for ${specialization} in the domain of ${domain || 'career development'}.`;

    const systemInstruction = `
You are an expert roadmap generator and career mentor.
Generate a structured, step-by-step learning roadmap.

Output Format (STRICT JSON ONLY — no extra text):
{
  "title": "Roadmap Title",
  "input_prompt": "${adminPrompt.replace(/"/g, '\\"')}",
  "description": "High level description",
  "category": "e.g. programming",
  "level": "Beginner/Intermediate/Advanced",
  "duration": "e.g. 6 months",
  "phases": 5,
  "tags": ["tag1", "tag2"],
  "milestones": [
    {
      "order": 1,
      "title": "Milestone Title",
      "description": "Clear and practical description",
      "subtopics": [
        { "title": "Subtopic Title", "description": "Quick summary", "level": "Beginner" }
      ],
      "learning_steps": ["Step 1", "Step 2"],
      "resources": {
        "youtube": [{ "label": "Video Title", "url": "https://youtube.com/..." }],
        "github": [{ "label": "Repo Name", "url": "https://github.com/..." }],
        "reading": [{ "label": "Article Title", "url": "https://..." }]
      }
    }
  ],
  "resources": {
    "youtube": [],
    "github": [],
    "reading": []
  }
}

Instructions:
1. Create a complete roadmap from beginner → advanced → real-world level.
2. Divide the roadmap into 5–7 milestones.
3. Each milestone must include title, description, subtopics (as objects with title/description/level), learning_steps (as strings), and resources (as objects with label/url).
4. Include real-world project suggestions in later milestones.
5. Attach useful resources: YouTube links, GitHub repositories, Articles/documentation.
6. Ensure logical progression between milestones.
7. Return ONLY the JSON object.
    `;

    const result = await model.generateContent(systemInstruction);
    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const roadmap = JSON.parse(jsonStr);

    roadmap.generation_meta = {
      stage: 'final',
      generated_at: new Date().toISOString(),
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash'
    };

    return res.json(roadmap);
  } catch (e) {
    console.error('Gemini generation error:', e);
    return res.status(500).json({ error: e.message || 'Failed to generate roadmap' });
  }
}

// POST save generated roadmap (Admin only)
async function saveGeneratedRoadmap(req, res) {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const {
      owner_email,
      title,
      description,
      category,
      level,
      duration,
      phases,
      tags,
      domain,
      specialization,
      milestones,
      resources,
      generation_meta,
      is_published = false
    } = req.body || {};

    const { rows } = await dbQuery(`
      INSERT INTO roadmaps (
        owner_email, title, description, category, level, duration, phases, 
        tags, domain, specialization, milestones_json, resources_json, 
        generation_meta_json, is_published
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      owner_email, title, description, category, level, duration, phases,
      Array.isArray(tags) ? tags.join(',') : tags,
      domain, specialization,
      JSON.stringify(milestones),
      JSON.stringify(resources),
      JSON.stringify(generation_meta),
      !!is_published
    ]);

    return res.status(201).json(normalizeRoadmap(rows && rows[0]));
  } catch (e) {
    console.error('Roadmap save error:', e);
    return res.status(500).json({ error: e.message });
  }
}

// PUT publish roadmap (Admin only)
async function publishRoadmap(req, res) {
  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    const { is_published = true } = req.body;

    const { rows } = await dbQuery(`
      UPDATE roadmaps 
      SET is_published = ?, updated_at = NOW() 
      WHERE id = ? 
      RETURNING *
    `, [!!is_published, id]);

    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Roadmap not found' });
    return res.json(normalizeRoadmap(rows[0]));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// Helper: Pick roadmap milestone
function pickRoadmapMilestone(roadmap, milestoneOrder) {
  const milestones = Array.isArray(roadmap?.milestones_json)
    ? roadmap.milestones_json
    : (Array.isArray(roadmap?.milestones) ? roadmap.milestones : []);
  const target = Number(milestoneOrder);
  const direct = milestones.find((m) => Number(m?.order) === target);
  if (direct) return direct;
  return milestones[target - 1] || null;
}

// Helper: Get or create student roadmap progress
async function getOrCreateRoadmapProgress(roadmapId, userEmail) {
  const lookup = await dbQuery('SELECT * FROM roadmap_student_progress WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?) LIMIT 1', [roadmapId, userEmail]);
  if (lookup.rows && lookup.rows[0]) return lookup.rows[0];
  const inserted = await dbQuery(`
    INSERT INTO roadmap_student_progress (roadmap_id, user_email, unlocked_milestone_order, completed_milestones_json)
    VALUES (?, ?, 1, '[]'::jsonb)
    RETURNING *
  `, [roadmapId, userEmail]);
  return inserted.rows && inserted.rows[0];
}

// Helper: Generate milestone quiz using Gemini
async function generateMilestoneQuizWithGemini({ roadmap, milestone, questionCount = 5 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const prompt = `
Generate a technical quiz for a student milestone.

Return STRICT JSON only in this shape:
{
  "pass_score": 70,
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_option_index": 0,
      "explanation": "why"
    }
  ]
}

Rules:
1. Create exactly ${Math.max(3, Math.min(8, Number(questionCount) || 5))} MCQ questions.
2. questions[].options must always contain exactly 4 options.
3. correct_option_index must be 0..3.
4. Questions must align to the milestone concepts and learning steps.
5. Difficulty should match milestone level and should test practical understanding.
6. Return only JSON, no markdown.

Roadmap title: ${roadmap.title}
Roadmap level: ${roadmap.level}
Milestone order: ${milestone.order || ''}
Milestone title: ${milestone.title || ''}
Milestone description: ${milestone.description || ''}
Subtopics: ${JSON.stringify((milestone.subtopics || []).map(s => s.title || s))}
Learning steps: ${JSON.stringify(milestone.learning_steps || [])}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const normalizedQuestions = questions
    .map((q) => ({
      question: String(q?.question || '').trim(),
      options: Array.isArray(q?.options) ? q.options.slice(0, 4).map((o) => String(o || '').trim()) : [],
      correct_option_index: Number.isInteger(q?.correct_option_index) ? q.correct_option_index : -1,
      explanation: String(q?.explanation || '').trim(),
    }))
    .filter((q) => q.question && q.options.length === 4 && q.correct_option_index >= 0 && q.correct_option_index <= 3);

  if (!normalizedQuestions.length) {
    throw new Error('Gemini returned invalid quiz format');
  }

  return {
    pass_score: Number(parsed?.pass_score) > 0 ? Number(parsed.pass_score) : 70,
    questions: normalizedQuestions,
  };
}

// GET roadmap progress
async function getRoadmapProgress(req, res) {
  try {
    const { id } = req.params;
    const identity = req.identity || {}; // assume populated by checkJwtFlexible fallback handler or extract directly
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const roadmapRes = await dbQuery('SELECT id, title, milestones_json FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!roadmapRes.rows || !roadmapRes.rows[0]) return res.status(404).json({ error: 'Roadmap not found' });
    const roadmap = roadmapRes.rows[0];
    const progress = await getOrCreateRoadmapProgress(id, identity.email);

    const followRes = await dbQuery('SELECT id FROM roadmap_resource_follows WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?) LIMIT 1', [id, identity.email]);
    const followerCountRes = await dbQuery('SELECT COUNT(*)::int AS cnt FROM roadmap_resource_follows WHERE roadmap_id = ?', [id]);

    return res.json({
      roadmap_id: Number(id),
      total_milestones: Array.isArray(roadmap.milestones_json) ? roadmap.milestones_json.length : 0,
      unlocked_milestone_order: Number(progress.unlocked_milestone_order || 1),
      completed_milestones: Array.isArray(progress.completed_milestones_json) ? progress.completed_milestones_json : [],
      last_quiz_score: progress.last_quiz_score !== null ? Number(progress.last_quiz_score) : null,
      followed: !!(followRes.rows && followRes.rows[0]),
      followers: Number(followerCountRes.rows?.[0]?.cnt || 0),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST complete milestone
async function completeMilestone(req, res) {
  try {
    const { id, milestoneOrder } = req.params;
    const identity = req.identity || {};
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const roadmapRes = await dbQuery('SELECT id, milestones_json FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!roadmapRes.rows || !roadmapRes.rows[0]) return res.status(404).json({ error: 'Roadmap not found' });
    const roadmap = roadmapRes.rows[0];
    const targetOrder = Number(milestoneOrder);
    const milestone = pickRoadmapMilestone(roadmap, targetOrder);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const progress = await getOrCreateRoadmapProgress(id, identity.email);
    const completed = Array.isArray(progress.completed_milestones_json)
      ? progress.completed_milestones_json.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    if (!completed.includes(targetOrder)) completed.push(targetOrder);
    completed.sort((a, b) => a - b);

    const updated = await dbQuery(`
      UPDATE roadmap_student_progress
      SET completed_milestones_json = ?, updated_at = NOW()
      WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?)
      RETURNING *
    `, [JSON.stringify(completed), id, identity.email]);

    return res.json({
      completed_milestones: updated.rows?.[0]?.completed_milestones_json || completed,
      unlocked_milestone_order: Number(updated.rows?.[0]?.unlocked_milestone_order || 1),
      requires_quiz: true,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST generate milestone quiz
async function generateMilestoneQuiz(req, res) {
  try {
    const { id, milestoneOrder } = req.params;
    const identity = req.identity || {};
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const roadmapRes = await dbQuery('SELECT id, title, level, milestones_json FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    if (!roadmapRes.rows || !roadmapRes.rows[0]) return res.status(404).json({ error: 'Roadmap not found' });
    const roadmap = roadmapRes.rows[0];
    const targetOrder = Number(milestoneOrder);
    const milestone = pickRoadmapMilestone(roadmap, targetOrder);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const progress = await getOrCreateRoadmapProgress(id, identity.email);
    if (targetOrder > Number(progress.unlocked_milestone_order || 1)) {
      return res.status(403).json({ error: 'Milestone is locked. Pass previous milestone quiz first.' });
    }

    const quiz = await generateMilestoneQuizWithGemini({ roadmap, milestone, questionCount: 5 });
    const answerKey = quiz.questions.map((q) => q.correct_option_index);
    const tokenPayload = {
      roadmap_id: Number(id),
      milestone_order: targetOrder,
      pass_score: Number(quiz.pass_score || 70),
      answer_key: answerKey,
      exp: Date.now() + 1000 * 60 * 20,
    };
    const quizToken = signQuizPayload(tokenPayload);

    const questionsForClient = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options,
      explanation_hint: q.explanation,
    }));

    return res.json({
      roadmap_id: Number(id),
      milestone_order: targetOrder,
      pass_score: Number(quiz.pass_score || 70),
      quiz_token: quizToken,
      questions: questionsForClient,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST submit milestone quiz
async function submitMilestoneQuiz(req, res) {
  try {
    const { id, milestoneOrder } = req.params;
    const identity = req.identity || {};
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const { quiz_token, answers } = req.body || {};
    if (!quiz_token || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quiz_token and answers[] are required' });
    }

    const tokenPayload = verifyQuizPayload(quiz_token);
    if (!tokenPayload) return res.status(400).json({ error: 'Invalid or expired quiz token' });
    if (Number(tokenPayload.roadmap_id) !== Number(id) || Number(tokenPayload.milestone_order) !== Number(milestoneOrder)) {
      return res.status(400).json({ error: 'Quiz token does not match roadmap milestone' });
    }

    const answerKey = Array.isArray(tokenPayload.answer_key) ? tokenPayload.answer_key : [];
    const total = answerKey.length;
    if (!total) return res.status(400).json({ error: 'Quiz token has no answer key' });

    let correct = 0;
    for (let i = 0; i < total; i += 1) {
      if (Number(answers[i]) === Number(answerKey[i])) correct += 1;
    }
    const score = Number(((correct / total) * 100).toFixed(2));
    const passScore = Number(tokenPayload.pass_score || 70);
    const passed = score >= passScore;

    await dbQuery(`
      INSERT INTO roadmap_quiz_attempts (roadmap_id, milestone_order, user_email, score, question_count, passed)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, milestoneOrder, identity.email, score, total, passed]);

    const progress = await getOrCreateRoadmapProgress(id, identity.email);
    const completed = Array.isArray(progress.completed_milestones_json)
      ? progress.completed_milestones_json.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const currentOrder = Number(milestoneOrder);
    if (!completed.includes(currentOrder)) completed.push(currentOrder);
    completed.sort((a, b) => a - b);

    const nextUnlocked = passed
      ? Math.max(Number(progress.unlocked_milestone_order || 1), currentOrder + 1)
      : Number(progress.unlocked_milestone_order || 1);

    const updated = await dbQuery(`
      UPDATE roadmap_student_progress
      SET completed_milestones_json = ?, unlocked_milestone_order = ?, last_quiz_score = ?, updated_at = NOW()
      WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?)
      RETURNING *
    `, [JSON.stringify(completed), nextUnlocked, score, id, identity.email]);

    return res.json({
      score,
      pass_score: passScore,
      passed,
      unlocked_milestone_order: Number(updated.rows?.[0]?.unlocked_milestone_order || nextUnlocked),
      completed_milestones: updated.rows?.[0]?.completed_milestones_json || completed,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// POST follow / unfollow roadmap resource
async function followRoadmap(req, res) {
  try {
    const { id } = req.params;
    const { follow = true } = req.body || {};
    const identity = req.identity || {};
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    if (follow) {
      await dbQuery(`
        INSERT INTO roadmap_resource_follows (roadmap_id, user_email)
        VALUES (?, ?)
        ON CONFLICT (roadmap_id, user_email) DO NOTHING
      `, [id, identity.email]);
    } else {
      await dbQuery('DELETE FROM roadmap_resource_follows WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?)', [id, identity.email]);
    }

    await dbQuery(`
      UPDATE roadmaps
      SET followers = (
        SELECT COUNT(*)::int FROM roadmap_resource_follows WHERE roadmap_id = ?
      )
      WHERE id = ?
    `, [id, id]);

    const countRes = await dbQuery('SELECT followers FROM roadmaps WHERE id = ? LIMIT 1', [id]);
    return res.json({ followed: !!follow, followers: Number(countRes.rows?.[0]?.followers || 0) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET follow status
async function getFollowStatus(req, res) {
  try {
    const { id } = req.params;
    const identity = req.identity || {};
    if (!identity.email) return res.status(401).json({ error: 'Authenticated email is required' });

    const followRes = await dbQuery('SELECT id FROM roadmap_resource_follows WHERE roadmap_id = ? AND LOWER(user_email) = LOWER(?) LIMIT 1', [id, identity.email]);
    const followerCountRes = await dbQuery('SELECT COUNT(*)::int AS cnt FROM roadmap_resource_follows WHERE roadmap_id = ?', [id]);

    return res.json({
      followed: !!(followRes.rows && followRes.rows[0]),
      followers: Number(followerCountRes.rows?.[0]?.cnt || 0),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getRoadmaps,
  createRoadmap,
  getRoadmapById,
  updateRoadmap,
  deleteRoadmap,
  generateRoadmap,
  saveGeneratedRoadmap,
  publishRoadmap,
  getRoadmapProgress,
  completeMilestone,
  generateMilestoneQuiz,
  submitMilestoneQuiz,
  followRoadmap,
  getFollowStatus
};
