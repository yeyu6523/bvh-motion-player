/** Clock in seconds. Rendering FPS never controls motion speed. */
export class Playback {
  constructor() { this.duration = 0; this.frameTime = 1 / 30; this.frameCount = 0; this.time = 0; this.speed = 1; this.playing = false; this.loop = true; }
  load(clip) {
    this.duration = clip.duration; this.frameTime = clip.frameTime; this.frameCount = clip.frameCount; this.time = 0; this.playing = false;
  }
  get frame() { return Math.min(this.frameCount - 1, Math.floor(this.time / this.frameTime + 1e-9)); }
  get lastFrameTime() { return Math.max(0, (this.frameCount - 1) * this.frameTime); }
  play() { if (this.frameCount) { if (this.time >= this.duration) this.time = 0; this.playing = true; } }
  pause() { this.playing = false; }
  toggle() { this.playing ? this.pause() : this.play(); }
  setSpeed(speed) { if (!Number.isFinite(speed) || speed < 0.1 || speed > 4) throw new RangeError('速度须在 0.1 到 4 倍之间。'); this.speed = speed; }
  seek(time) { if (!Number.isFinite(time)) return; this.time = Math.max(0, Math.min(this.lastFrameTime, time)); }
  step(delta) { this.pause(); this.seek((this.frame + delta) * this.frameTime); }
  advance(deltaSeconds) {
    if (!this.playing || !this.duration || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    this.time += deltaSeconds * this.speed;
    if (this.time >= this.duration) {
      if (this.loop) this.time %= this.duration;
      else { this.time = this.duration; this.pause(); }
    }
  }
  sample() {
    const index = this.frame;
    // Hold the last pose until the loop boundary, rather than blending it to a distant first pose.
    return { first: Math.max(0, index), second: Math.max(0, Math.min(index + 1, this.frameCount - 1)), alpha: Math.min(1, Math.max(0, this.time / this.frameTime - index)) };
  }
}
