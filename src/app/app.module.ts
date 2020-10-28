import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { FrozenRootComponent } from './components/root/root.component';
import { FrozenAudioService } from './services/audio.service';
import { FrozenIcecastService } from './services/icecast.service';

import { FROZEN_AUDIO_CONTEXT, FROZEN_OPTIONS_ICECAST_URL } from 'src/helpers';
import { FrozenVisualizerComponent } from './components/visualizer/visualizer.component';

// @ts-ignore
// const { FROZEN_ICECAST_URL = 'https://live.timlapse.fr/test' } = process?.env;
const FROZEN_ICECAST_URL = 'https://icecast.timlapse.fr/test';

@NgModule({
  declarations: [
    FrozenRootComponent,
    FrozenVisualizerComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
  ],
  providers: [
    { provide: FROZEN_AUDIO_CONTEXT, useValue: new AudioContext() },
    { provide: FROZEN_OPTIONS_ICECAST_URL, useValue: FROZEN_ICECAST_URL },
    FrozenAudioService,
    FrozenIcecastService,
  ],
  bootstrap: [FrozenRootComponent]
})
export class AppModule { }
