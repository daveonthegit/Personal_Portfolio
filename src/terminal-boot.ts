import { initStartupAnimation } from './components/StartupAnimation';
import { initSurveillanceWindows } from './utils/surveillanceWindows';

document.addEventListener('DOMContentLoaded', () => {
  initStartupAnimation();
  setTimeout(() => initSurveillanceWindows(), 500);
});
