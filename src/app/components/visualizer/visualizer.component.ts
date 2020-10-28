import { Component, ElementRef, HostListener, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { Noise } from 'noisejs'; // typings are broken, dont try to add

import { FROZEN_AUDIO_CONTEXT, average, getPointOnCircle } from 'src/helpers';
import { IFrozenCanvasPoint } from 'src/interfaces/point.interface';

import { IFrozenColor } from 'src/interfaces/color.interface';
import { FrozenStarsEffect } from 'src/effects/stars.effect';

import { generateGradient } from './helpers';

const { PI, floor, sqrt, pow } = Math;

const white: IFrozenColor = { red: 255, green: 255, blue: 255 };
const purple: IFrozenColor = { red: 128, green: 0, blue: 128 };
const crimson: IFrozenColor = { red: 220, green: 20, blue: 60 };

@Component({
  selector: 'frozen-visualizer',
  template: '<canvas #canvas></canvas><canvas #stars></canvas>',
  styles: ['canvas{position: absolute; top: 0; left: 0;}']
})
export class FrozenVisualizerComponent implements OnInit {

  @ViewChild('stars', { static: true }) private readonly starsCanvasRef: ElementRef<HTMLCanvasElement>;
  private starrer: FrozenStarsEffect;

  @ViewChild('canvas', { static: true }) private readonly canvasRef: ElementRef<HTMLCanvasElement>;

  private canvas: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;
  private canvasTime = Date.now();
  private canvasSmallestDimension = 0;

  private readonly canvasDotAngle = 17;
  private canvasDotColors: IFrozenColor[] = [];
  private canvasDotEffectSize = 0;

  private canvasLineEffectSize = 0;
  private readonly canvasLineRotationSpeed = 200;

  private canvasBezierEffectSize = 0;

  private canvasOrbGradient: CanvasGradient;

  private canvasBezierFrequencyHistory: Array<number[]> = [];


  public readonly canvasCenter: IFrozenCanvasPoint = { x: 0, y: 0 };

  @Input('source') private readonly audioSource: MediaElementAudioSourceNode;
  private readonly audioAnalyzer = this.audioContext.createAnalyser();
  private readonly audioGain = this.audioContext.createGain();
  private readonly audioSampleRate = this.audioContext.sampleRate;
  private readonly audioFftSize = 8192;
  private readonly audioFftLength = this.audioFftSize / 2;

  private readonly audioBassIndex = floor(60 / this.audioSampleRate * this.audioFftLength );
  private readonly audioMidIndex = floor(300 / this.audioSampleRate * this.audioFftLength);
  private readonly audioHighIndex = floor(2000 / this.audioSampleRate * this.audioFftLength);
  private readonly audioEndIndex = floor(8000 / this.audioSampleRate * this.audioFftLength);

  private readonly audioFrequencyBuffer: Uint8Array;

  // Various allocated frequency and intensity arrays
  // filled every frame
  private audioFrequencies = Array().fill(0);
  private audioSubFrequencies = [];
  private audioBassFrequencies = [];
  private audioMidFrequencies = [];
  private audioHighFrequencies = [];

  private audioIntensity = 0;
  private audioBassIntensity = 0;
  private audioMidIntensity = 0;
  private audioHighIntensity = 0;

  private readonly noiser = new Noise(Math.random());

  constructor(
    @Inject(FROZEN_AUDIO_CONTEXT) private readonly audioContext: AudioContext,
    private readonly element: ElementRef,
  ) {
    console.log(this.audioContext.sampleRate);
    this.audioAnalyzer.fftSize = this.audioFftSize;
    // this.audioAnalyzer.minDecibels = 10;
    this.audioAnalyzer.minDecibels = -60;
    this.audioAnalyzer.smoothingTimeConstant = 0.8;
    this.audioFrequencyBuffer = new Uint8Array(this.audioAnalyzer.frequencyBinCount);

    // Initialize empty arrays
    this.audioFrequencies = Array(this.audioBassIndex).fill(0);
    this.audioSubFrequencies = Array(this.audioBassIndex).fill(0);
    this.audioBassFrequencies = Array(this.audioMidIndex - this.audioBassIndex).fill(0);
    this.audioMidFrequencies = Array(this.audioHighIndex - this.audioMidIndex).fill(0);
    this.audioHighFrequencies = Array(this.audioEndIndex - this.audioHighIndex).fill(0);

  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(e: any = null) {
    if (!this.canvas) return;
    this.canvas.width = this.element.nativeElement.clientWidth;
    this.canvas.height = this.element.nativeElement.clientHeight;
    this.canvasCenter.x = this.canvas.width / 2;
    this.canvasCenter.y = this.canvas.height / 2;

    if (!this.starsCanvasRef.nativeElement) return;
    this.starsCanvasRef.nativeElement.width = this.element.nativeElement.clientWidth;
    this.starsCanvasRef.nativeElement.height = this.element.nativeElement.clientHeight;

    this.canvasSmallestDimension = Math.min(this.canvas.width, this.canvas.height);
    this.canvasDotEffectSize = this.canvasSmallestDimension / 2;
    this.canvasLineEffectSize = this.canvasSmallestDimension / 3;
    this.canvasBezierEffectSize = this.canvasSmallestDimension / 4;
  }

  ngOnInit() {
    this.audioSource.connect(this.audioAnalyzer);

    this.canvas = this.canvasRef.nativeElement;
    this.canvasContext = this.canvas.getContext('2d');

    this.canvasDotColors = generateGradient(purple, crimson, this.audioMidFrequencies.length)
    this.starrer = new FrozenStarsEffect(this.canvasContext, { size: 3, amount: 500, color: white, movementSpeed: 10, growthSpeed: .1 });

    this.onWindowResize(); // Force resize once
    console.log(this);

    this.start();
  }

  private nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  async start() {
    while (true) {
      await this.nextFrame();
      this.draw();
    }
  }

  draw() {
    this.audioAnalyzer.getByteFrequencyData(this.audioFrequencyBuffer); // Wut ?

    // Compute these once a frame only (optimization)
    this.audioFrequencies = this.audioFrequencyBuffer ? [...this.audioFrequencyBuffer] : [];
    this.audioSubFrequencies = this.audioFrequencyBuffer ? [...this.audioFrequencyBuffer.slice(0, this.audioBassIndex)] : [];
    this.audioBassFrequencies = this.audioFrequencyBuffer ? [...this.audioFrequencyBuffer.slice(this.audioBassIndex, this.audioMidIndex)] : []; 
    this.audioMidFrequencies = this.audioFrequencyBuffer ? [...this.audioFrequencyBuffer.slice(this.audioMidIndex, this.audioHighIndex)] : [];
    this.audioHighFrequencies = this.audioFrequencyBuffer ? [...this.audioFrequencyBuffer.slice(this.audioHighIndex, this.audioEndIndex)] : [];
    
    // Update all computed intensities
    this.audioIntensity = average(this.audioBassFrequencies) / 0xff;
    this.audioBassIntensity = average(this.audioBassFrequencies) / 0xff;
    this.audioMidIntensity = average(this.audioMidFrequencies) / 0xff;
    this.audioHighIntensity = average(this.audioHighFrequencies) / 0xff;

    this.canvasTime = Date.now();

    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Movement noiser
    const noiseX = this.noiser.simplex2(1000, this.canvasTime / 500);
    const noiseY = this.noiser.simplex2(100, this.canvasTime / 500);

    const veryInternsity = easeOutQuert(this.audioIntensity);

    const center = { ... this.canvasCenter }; // Clone center point to avoid reference issues
    center.x = center.x + (center.x * (noiseX * veryInternsity * .05));
    center.y = center.y + (center.y * (noiseY * veryInternsity * .05));

    // Make stars go faster when music more louder
    this.starrer.options.movementSpeed = .0001 + (.01 * this.audioMidIntensity);
    this.starrer.draw(1 - easeCirc(this.audioIntensity));

    // this.drawOrb(center, veryInternsity); nah is ugly
    this.drawLineCircle(center, this.audioMidFrequencies, (this.canvasLineEffectSize / 3) + (this.canvasLineEffectSize * this.audioMidIntensity));
    this.drawDotCircle(center, this.audioMidFrequencies, (this.canvasDotEffectSize / 3) + (this.canvasDotEffectSize * veryInternsity));
    this.drawBezierCircle(center, this.audioBassFrequencies, this.canvasBezierEffectSize / 2 * veryInternsity);
  }

  createOrbGradient() {
    this.canvasOrbGradient = this.canvasContext.createRadialGradient(this.canvasCenter.x, this.canvasCenter.y, 0, this.canvasCenter.x, this.canvasCenter.y, 100);

    this.canvasOrbGradient.addColorStop(0, '#800080');
    this.canvasOrbGradient.addColorStop(1.0, '#000000');
  }

  drawDotCircle(center: IFrozenCanvasPoint, frequencies: number[], size: number) {
    frequencies.forEach((v, i) => {
      const intensity = v / 0xff;

      const color = this.canvasDotColors[i];
      const point = getPointOnCircle(center, this.canvasDotAngle * i, (size * .5) + size * (v / 0xff));

      // Draw a filled circle at point
      this.canvasContext.beginPath();
      this.canvasContext.arc(point.x, point.y, 64, 0, 2 * PI);
      this.canvasContext.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${intensity * intensity})`;
      this.canvasContext.fill();
    });
  }

  drawLineCircle(center: IFrozenCanvasPoint, frequencies: number[], size: number) {
    const startAngle = (this.canvasTime / this.canvasLineRotationSpeed) % 360;
    const separationAngle = 360 / frequencies.length;
    const intensity = easeOutQuert(this.audioMidIntensity);

    this.canvasContext.strokeStyle = `rgba(255,255,255,${intensity})`;
    this.canvasContext.lineWidth = 2;

    frequencies.forEach((v, i) => {
      const lineAngle = startAngle + separationAngle * i;
      const centerPoint = getPointOnCircle(center, lineAngle, size);
      const startPoint = getPointOnCircle(centerPoint, lineAngle, v * .5);
      const endPoint = getPointOnCircle(centerPoint, lineAngle, -v* .5);

      // Draw a filled circle at point
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(startPoint.x, startPoint.y);
      this.canvasContext.lineTo(endPoint.x, endPoint.y);
      this.canvasContext.stroke();
    });
  }

  drawBezierCircle(center: IFrozenCanvasPoint, frequencies: number[], size: number) {
    const intensity = easeOutQuert(this.audioIntensity);

    if (this.canvasBezierFrequencyHistory.length >= 9) this.canvasBezierFrequencyHistory.pop();
    this.canvasBezierFrequencyHistory.unshift(frequencies);

    if (this.canvasBezierFrequencyHistory.length > 2)
      this.drawBezierCircleOfColor(center, this.canvasBezierFrequencyHistory[2], size, `rgba(255,219,0,${intensity})`);
    if (this.canvasBezierFrequencyHistory.length > 4)
      this.drawBezierCircleOfColor(center, this.canvasBezierFrequencyHistory[4], size, `rgba(15,134,252,${intensity})`);
    if (this.canvasBezierFrequencyHistory.length > 6)
      this.drawBezierCircleOfColor(center, this.canvasBezierFrequencyHistory[6], size, `rgba(252,15,134,${intensity})`);
      
    // Draw last las to be on top
    this.drawBezierCircleOfColor(center, this.canvasBezierFrequencyHistory[0], size, `rgba(255,255,255,${intensity})`);
  }

  private drawBezierCircleOfColor(center: IFrozenCanvasPoint, frequencies: number[], size: number, color: string) {
    const angle = 360 / frequencies.length;

    this.canvasContext.lineWidth = 3;
    this.canvasContext.strokeStyle = color;

    const points = frequencies.map((v, i) => getPointOnCircle(center, angle * i, size + v / 2));

    this.canvasContext.moveTo(points[0].x, points[0].y);
    this.canvasContext.beginPath();

    let pointIndex = 0;
    let nextPointIndex = 0;

    for (pointIndex = 0; pointIndex < points.length; pointIndex++) {
      nextPointIndex = points[pointIndex + 1] ? pointIndex + 1 : 0;
      var xc = (points[pointIndex].x + points[nextPointIndex].x) / 2;
      var yc = (points[pointIndex].y + points[nextPointIndex].y) / 2;
      this.canvasContext.quadraticCurveTo(points[pointIndex].x, points[pointIndex].y, xc, yc);
    }

    this.canvasContext.closePath();
    this.canvasContext.stroke();
  }
}

export const easeOutQuert = t => 1-(--t)*t*t*t;
export const easeInQuert = t => t*t*t*t;

export const easeCirc = t => t < 0.5
  ? (1 - sqrt(1 - pow(2 * t, 2))) / 2
  : (sqrt(1 - pow(-2 * t + 2, 2)) + 1) / 2;

export function randomize(value: number, amount: number = .5) {
  const variation = Math.random() - .5;

  return value + (value * variation * amount);
}