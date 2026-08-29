import test from 'node:test';
import assert from 'node:assert/strict';
import { LoginSchema, ProjectSchema, getValidationErrorMessage } from '../lib/validations';

test('returns a friendly validation message from zod issues', () => {
  const parsed = LoginSchema.safeParse({ email: '', password: '123' });
  assert.equal(parsed.success, false);

  const message = getValidationErrorMessage(parsed.error);
  assert.ok(message.length > 0);
  assert.match(message, /valid|Password|review/i);
});

test('project slug trims whitespace and optional URLs normalize safely', () => {
  const parsed = ProjectSchema.safeParse({
    slug: ' halalpizzafun ',
    cat: 'Food Delivery',
    title: 'Halal Pizza Fun',
    casePdfUrl: '   ',
    liveUrl: '   ',
    techStack: [],
    overview: [],
    challenge: [],
    solution: [],
    process: [],
    gallery: [],
    results: [],
    additionalLinks: [],
    featured: false,
    published: true,
    order: 0,
  });

  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.equal(parsed.data.slug, 'halalpizzafun');
  assert.equal(parsed.data.casePdfUrl, undefined);
  assert.equal(parsed.data.liveUrl, null);
});

test('project casePdfUrl accepts relative media uploads as valid URLs', () => {
  const parsed = ProjectSchema.safeParse({
    slug: 'halalpizzafun',
    cat: 'Food Delivery',
    title: 'Halal Pizza Fun',
    casePdfUrl: '/uploads/case-study.pdf',
    techStack: [],
    overview: [],
    challenge: [],
    solution: [],
    process: [],
    gallery: [],
    results: [],
    additionalLinks: [],
    featured: false,
    published: true,
    order: 0,
  });

  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.equal(parsed.data.casePdfUrl, 'http://localhost:3000/uploads/case-study.pdf');
});
