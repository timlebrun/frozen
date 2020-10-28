import { IFrozenCanvasPoint } from 'src/interfaces/point.interface';
import { IFrozenColor } from '../interfaces/color.interface';

export class FrozenStarsEffect {

  public readonly stars: IFrozenStarsEffectStar[] = this.generateStars(this.options.amount);

  constructor(
    public readonly context: CanvasRenderingContext2D,
    public readonly options: IFrozenStarsEffectOptions,
  ) {}

  generateStars(amount: number): IFrozenStarsEffectStar[] {
    const stars: IFrozenStarsEffectStar[] = [];

    for (let index = 0; index < amount; index++) {
      const point = this.generateRandomPoint();
      const size = this.options.size * Math.random();
      stars.push({ point, size });
    }

    return stars;
  }

  draw(opacity: number) {
    this.context.fillStyle = `rgba(${this.options.color.red},${this.options.color.green},${this.options.color.blue}, ${opacity})`;
    for (const star of this.stars) {
      this.updateStar(star);
      this.maybeKillStar(star);

      this.context.beginPath();
      this.context.arc(star.point.x * this.context.canvas.width, star.point.y * this.context.canvas.height, star.size, 0, 360);
      this.context.fill();
      this.context.closePath();

    }
  }

  updateStar(star: IFrozenStarsEffectStar) {
    star.point.x = star.point.x + ((star.point.x - .5) * star.size * this.options.movementSpeed);
    star.point.y = star.point.y + ((star.point.y - .5) * star.size * this.options.movementSpeed);
    star.size = star.size + (star.size * this.options.growthSpeed / 1000);
    // const angleRatio = (star.point.x - .5) / star.point.y - .5);
    // const 
  }

  maybeKillStar(star: IFrozenStarsEffectStar) {
    if (star.point.x > 1) return this.doThePhoenixStuff(star);
    if (star.point.y > 1) return this.doThePhoenixStuff(star);
    if (star.point.x < 0) return this.doThePhoenixStuff(star);
    if (star.point.y < 0) return this.doThePhoenixStuff(star);
  }

  doThePhoenixStuff(star: IFrozenStarsEffectStar) {
    star.point = this.generateRandomPoint();
    star.size = Math.random() * this.options.size;
    console.log('a star died :(');
  }

  generateRandomPoint(): IFrozenCanvasPoint {
    return {
      x: Math.random(),
      y: Math.random(),
    };
  }



}

export interface IFrozenStarsEffectOptions {
  movementSpeed: number;
  growthSpeed: number;
  color: IFrozenColor;
  amount: number;
  size: number;
}

export interface IFrozenStarsEffectStar {
  point: IFrozenCanvasPoint;
  size: number;
}