import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:4000/api';

export const options = {
  scenarios: {
    browsing_user: {
      executor: 'constant-vus',
      vus: 56,
      duration: '10s',
      exec: 'browsing_user',
    },
    active_user: {
      executor: 'constant-vus',
      vus: 16,
      duration: '10s',
      exec: 'active_user',
    },
    payer: {
      executor: 'constant-vus',
      vus: 8,
      duration: '10s',
      exec: 'payer',
    },
  },
};

export function browsing_user() {
  const roadmapsRes = http.get(`${BASE_URL}/v2/roadmaps`);
  check(roadmapsRes, { 'roadmaps status 200': (r) => r.status === 200 });

  const mentorsRes = http.get(`${BASE_URL}/v2/mentorship/mentors`);
  check(mentorsRes, { 'mentors status 200': (r) => r.status === 200 });

  sleep(1);
}

export function active_user() {
  const payloadMessage = JSON.stringify({
    sender_email: 'student@example.com',
    receiver_email: 'mentor@example.com',
    content: 'Hello, I have a question about my career.',
  });

  const params = { headers: { 'Content-Type': 'application/json' } };

  const msgRes = http.post(`${BASE_URL}/v2/messages`, payloadMessage, params);
  check(msgRes, { 'message response ok (2xx or 4xx)': (r) => r.status < 500 });

  sleep(1);
}

export function payer() {
  const payloadSchedule = JSON.stringify({
    student_email: 'student@example.com',
    mentor_email: 'mentor@example.com',
    message: 'I want to schedule a mentorship session.',
  });

  const params = { headers: { 'Content-Type': 'application/json' } };

  const scheduleRes = http.post(`${BASE_URL}/v2/mentorship/request`, payloadSchedule, params);
  check(scheduleRes, { 'mentorship request ok (2xx or 4xx)': (r) => r.status < 500 });

  sleep(2);
}
