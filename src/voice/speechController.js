// Modular voice controller using Web Speech API
class SpeechController {
  constructor({ onCommand }) {
    this.onCommand = onCommand;
    this.recognition = null;
    this.lastCommand = '';
    this.active = false;
    this.partialBuffer = '';
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showError('Web Speech API not supported in this browser.');
      return;
    }
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      this.recognition.onresult = this.handleResult.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      this.recognition.onend = () => {
        if (this.active) this.recognition.start();
      };
      this.start();
    } catch (err) {
      console.error('SpeechController initialization failed:', err);
      this.showError('Speech recognition failed to initialize. Please check microphone permissions and reload.');
    }
  }

  start() {
    try {
      this.recognition.start();
      this.active = true;
    } catch (e) {
      // Already started
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.active = false;
    }
  }

  handleResult(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    transcript = transcript.trim().toLowerCase();
    // Prevent duplicate firing from partials
    if (transcript === this.partialBuffer) return;
    this.partialBuffer = transcript;
    this.showVoiceCommand(transcript);
    // Parse commands robustly
    const commands = [
      { keywords: ['create cube'], action: 'createCube' },
      { keywords: ['create sphere'], action: 'createSphere' },
      { keywords: ['delete object', 'remove object'], action: 'deleteObject' },
      { keywords: ['turn off gravity', 'disable gravity'], action: 'turnOffGravity' },
      { keywords: ['increase gravity', 'more gravity'], action: 'increaseGravity' },
      { keywords: ['scatter particles', 'explode particles'], action: 'scatterParticles' },
      { keywords: ['reassemble particles', 'gather particles'], action: 'reassembleParticles' },
    ];
    for (const cmd of commands) {
      for (const kw of cmd.keywords) {
        if (transcript.includes(kw) && this.lastCommand !== cmd.action) {
          this.lastCommand = cmd.action;
          this.onCommand(cmd.action);
          setTimeout(() => { this.lastCommand = ''; }, 800); // debounce
          return;
        }
      }
    }
  }

  handleError(event) {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      this.showError('Microphone access denied. Please enable microphone permissions.');
      this.stop();
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  showVoiceCommand(command) {
    const voiceCommandDiv = document.getElementById('voice-command');
    voiceCommandDiv.textContent = `Command: "${command}"`;
    voiceCommandDiv.style.display = 'block';
    setTimeout(() => {
      voiceCommandDiv.style.display = 'none';
    }, 3000);
  }

  destroy() {
    this.stop();
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
    }
  }
}

export default SpeechController;
