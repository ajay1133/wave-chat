import { randomBytes } from 'crypto';

export const newId = () => randomBytes(12).toString('hex');
