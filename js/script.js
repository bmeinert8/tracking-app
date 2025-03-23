import { initializeCommits } from './commits.js';
import { initializeCodeTime } from './codeTime.js';
import { initializeLanguages } from './languages.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeCommits();
  initializeCodeTime();
  initializeLanguages();
});
