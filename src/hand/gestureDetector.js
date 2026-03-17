const DEBOUNCE_MS = 120;

const GestureState = {
  IDLE: 'IDLE',
  GRABBING: 'GRABBING',
  RELEASED: 'RELEASED',
  GLOBAL_SCATTER: 'GLOBAL_SCATTER',
  GLOBAL_REASSEMBLE: 'GLOBAL_REASSEMBLE',
};

class GestureDetector {
  constructor() {
    this.state = GestureState.IDLE;
    this.lastState = GestureState.IDLE;
    this.lastChange = performance.now();
    this.handStates = [GestureState.IDLE, GestureState.IDLE];
  }

  update(landmarks, velocities) {
    const now = performance.now();
    let detected = [GestureState.IDLE, GestureState.IDLE];

    for (let i = 0; i < 2; i++) {
      if (!landmarks[i]) {
        detected[i] = GestureState.IDLE;
        continue;
      }
      const lms = landmarks[i];
      // Thumb-index pinch (grab)
      const thumbTip = lms[4];
      const indexTip = lms[8];
      const palmBase = lms[0];
      const middleTip = lms[12];
      const ringTip = lms[16];
      const pinkyTip = lms[20];

      const pinchDist = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2) +
        Math.pow(thumbTip.z - indexTip.z, 2)
      );
      const palmOpenDist =
        Math.sqrt(Math.pow(palmBase.x - middleTip.x, 2) + Math.pow(palmBase.y - middleTip.y, 2)) +
        Math.sqrt(Math.pow(palmBase.x - ringTip.x, 2) + Math.pow(palmBase.y - ringTip.y, 2)) +
        Math.sqrt(Math.pow(palmBase.x - pinkyTip.x, 2) + Math.pow(palmBase.y - pinkyTip.y, 2));
      const fistDist =
        Math.sqrt(Math.pow(middleTip.x - palmBase.x, 2) + Math.pow(middleTip.y - palmBase.y, 2)) < 0.08 &&
        Math.sqrt(Math.pow(ringTip.x - palmBase.x, 2) + Math.pow(ringTip.y - palmBase.y, 2)) < 0.08 &&
        Math.sqrt(Math.pow(pinkyTip.x - palmBase.x, 2) + Math.pow(pinkyTip.y - palmBase.y, 2)) < 0.08;

      if (pinchDist < 0.06) {
        detected[i] = GestureState.GRABBING;
      } else if (fistDist) {
        detected[i] = GestureState.RELEASED;
      } else if (palmOpenDist > 0.5) {
        detected[i] = GestureState.IDLE;
      } else {
        detected[i] = GestureState.IDLE;
      }
    }

    // Both palms open
    if (detected[0] === GestureState.IDLE && detected[1] === GestureState.IDLE && landmarks[0] && landmarks[1]) {
      this.setState(GestureState.GLOBAL_REASSEMBLE, now);
    }
    // Both fists closed
    else if (detected[0] === GestureState.RELEASED && detected[1] === GestureState.RELEASED && landmarks[0] && landmarks[1]) {
      this.setState(GestureState.GLOBAL_SCATTER, now);
    }
    // Single hand gestures
    else if (detected.includes(GestureState.GRABBING)) {
      this.setState(GestureState.GRABBING, now);
    }
    else if (detected.includes(GestureState.RELEASED)) {
      this.setState(GestureState.RELEASED, now);
    }
    else {
      this.setState(GestureState.IDLE, now);
    }

    this.handStates = detected;
    return this.state;
  }

  setState(newState, now) {
    if (newState !== this.state && now - this.lastChange > DEBOUNCE_MS) {
      this.lastState = this.state;
      this.state = newState;
      this.lastChange = now;
    }
  }
}

export { GestureState };
export default GestureDetector;
