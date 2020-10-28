import { Inject, Injectable } from '@angular/core';
import { FROZEN_AUDIO_CONTEXT } from 'src/helpers';

@Injectable()
export class FrozenAudioService {

  /**
   * Audio element
   */
  public readonly element = new Audio();

  /**
   * The current elemtn source object
   */
  public readonly source = this.context.createMediaElementSource(this.element);

  constructor(
    @Inject(FROZEN_AUDIO_CONTEXT) private readonly context: AudioContext,
  ) {
    this.element.crossOrigin = 'anonymous';

    this.source.connect(this.context.destination);
    this.attachListeners(this.element);
  }

  private attachListeners(element: HTMLAudioElement): void {
    // element.addEventListener('timeupdate', this.calculateTime, false);
    // element.addEventListener('playing', this.setPlayerStatus, false);
    // element.addEventListener('pause', this.setPlayerStatus, false);
    // element.addEventListener('progress', this.calculatePercentLoaded, false);
    // element.addEventListener('waiting', this.setPlayerStatus, false);
    // element.addEventListener('ended', this.setPlayerStatus, false);
  }

  pause() {
    this.element.pause();

    return this;
  }

  play() {
    this.context.resume();
    this.element.play();

    return this;
  }

  load(src: string) {
    this.element.src = src;

    return this;
  }

  // pipe(stream: Stream) {
  //   this.element.src = stream;
  // }
}