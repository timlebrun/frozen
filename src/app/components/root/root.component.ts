import { Component, Inject, OnInit } from '@angular/core';
import { FrozenAudioService } from 'src/app/services/audio.service';
import { FrozenIcecastService } from 'src/app/services/icecast.service';
import { FROZEN_AUDIO_CONTEXT, FROZEN_OPTIONS_ICECAST_URL } from 'src/helpers';

@Component({
  selector: 'frozen-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss']
})
export class FrozenRootComponent implements OnInit {

  public analyzer: AnalyserNode;

  constructor(
    @Inject(FROZEN_OPTIONS_ICECAST_URL) private readonly icecastUrl: string,
    @Inject(FROZEN_AUDIO_CONTEXT) private readonly audioContext: AudioContext,
    public readonly icecast: FrozenIcecastService,
    public readonly audio: FrozenAudioService,
  ) {}

  ngOnInit() {
    // @todo find a way to pipe a single stream through
    // this.icecastService.load(this.icecastUrl);

    this.audio.load(this.icecastUrl);
    console.debug(this.icecastUrl);

    // this.audio.source.connect(this.audioContext.destination);

    // const test = await this.icecast.fetch(this.icecastUrl);
    // console.log(test);
  }

}
