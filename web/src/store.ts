import { get, set, update } from 'idb-keyval';
import type { Question } from './api';

export const getCachedQuestion = (slug: string) => get<Question>(`question:${slug}`);
export const cacheQuestion = (slug: string, question: Question) => set(`question:${slug}`, question);

export const getCode = (slug: string, lang: string) => get<string>(`code:${slug}:${lang}`);
export const saveCode = (slug: string, lang: string, code: string) => set(`code:${slug}:${lang}`, code);

// slug -> time of first Accepted submit; drives weekly progress (DECISIONS D3).
export const getAccepted = async () => (await get<Record<string, number>>('accepted')) ?? {};
export const markAccepted = (slug: string) =>
  update<Record<string, number>>('accepted', (accepted = {}) => ({ [slug]: Date.now(), ...accepted }));
