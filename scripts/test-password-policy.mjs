#!/usr/bin/env node
import assert from 'node:assert/strict';

const HANAKAI_PASSWORD_MIN_LENGTH = 8;
const HANAKAI_PASSWORD_MAX_LENGTH = 72;

function validateHanakaiPassword(password, confirm) {
  if (password.length < HANAKAI_PASSWORD_MIN_LENGTH) return 'short';
  if (password.length > HANAKAI_PASSWORD_MAX_LENGTH) return 'long';
  if (password !== confirm) return 'mismatch';
  return null;
}

function classifyPasswordUpdateError(error) {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  if (code === 'session_not_found' || message.includes('auth session missing') || error.status === 401) {
    return 'auth';
  }
  if (code === 'weak_password' || message.includes('easy to guess') || message.includes('known to be weak')) {
    return 'weak';
  }
  return 'failed';
}

assert.equal(validateHanakaiPassword('short', 'short'), 'short');
assert.equal(validateHanakaiPassword('longenough', 'different'), 'mismatch');
assert.equal(validateHanakaiPassword('longenough', 'longenough'), null);
assert.equal(classifyPasswordUpdateError({ message: 'Auth session missing!' }), 'auth');
assert.equal(classifyPasswordUpdateError({ code: 'weak_password' }), 'weak');
console.log('PASS password-policy');
