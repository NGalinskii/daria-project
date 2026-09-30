import {
  Application,
  Assets,
  Container,
  Rectangle,
  Sprite,
  Texture,
  TextureSource,
} from "pixi.js";
import backgroundUrl from "@/shared/assets/images/background-day.png";
import baseUrl from "@/shared/assets/images/base.png";
import birdUrl from "@/shared/assets/images/bird.png";
import birdSheet from "@/shared/assets/images/bird.json";
import gameoverUrl from "@/shared/assets/images/gameover.png";
import messageUrl from "@/shared/assets/images/message.png";
import numbersUrl from "@/shared/assets/images/numbers.png";
import numbersSheet from "@/shared/assets/images/numbers.json";
import pipeUrl from "@/shared/assets/images/pipe-green.png";
import dieOgg from "@/shared/assets/sounds/die.ogg";
import dieWav from "@/shared/assets/sounds/die.wav";
import hitOgg from "@/shared/assets/sounds/hit.ogg";
import hitWav from "@/shared/assets/sounds/hit.wav";
import pointOgg from "@/shared/assets/sounds/point.ogg";
import pointWav from "@/shared/assets/sounds/point.wav";
import swooshOgg from "@/shared/assets/sounds/swoosh.ogg";
import swooshWav from "@/shared/assets/sounds/swoosh.wav";
import wingOgg from "@/shared/assets/sounds/wing.ogg";
import wingWav from "@/shared/assets/sounds/wing.wav";

const WIDTH = 288;
const HEIGHT = 512;
const GROUND_HEIGHT = 112;
const GROUND_Y = HEIGHT - GROUND_HEIGHT;
const BIRD_X = 64;
const GRAVITY = 0.25;
const FLAP = -4.8;
const MAX_FALL = 9;
const PIPE_SPEED = 1.85;
const PIPE_GAP = 104;
const PIPE_SPACING = 176;
const PIPE_WIDTH = 52;
const WIN_SCORE = 3;

type Phase = "ready" | "play" | "dead" | "won";

type Sheet = {
  frames: Record<
    string,
    { frame: { x: number; y: number; w: number; h: number } }
  >;
  meta: { size: { w: number; h: number } };
};

type PipePair = {
  x: number;
  gapY: number;
  scored: boolean;
  top: Sprite;
  bottom: Sprite;
};

function nearest(texture: Texture) {
  texture.source.scaleMode = "nearest";
  texture.source.autoGenerateMipmaps = false;
  texture.source.style.update();
  return texture;
}

function matchSheet(texture: Texture, sheet: Sheet) {
  const scale = texture.source.pixelWidth / sheet.meta.size.w;
  if (scale > 1 && texture.source.pixelWidth % sheet.meta.size.w === 0) {
    texture.source.resolution = scale;
    texture.update();
  }
  return nearest(texture);
}

function slice(base: Texture, sheet: Sheet, name: string) {
  const cell = sheet.frames[name]?.frame;
  if (!cell) throw new Error(`Нет кадра ${name}`);
  const scale = base.width / sheet.meta.size.w;
  return new Texture({
    source: base.source,
    frame: new Rectangle(
      cell.x * scale,
      cell.y * scale,
      cell.w * scale,
      cell.h * scale,
    ),
  });
}

function sheetScale(base: Texture, sheet: Sheet) {
  return sheet.meta.size.w / base.width;
}

const preferOgg =
  typeof Audio !== "undefined" &&
  new Audio().canPlayType("audio/ogg; codecs=vorbis") !== "";

function loadSound(ogg: string, wav: string) {
  const audio = new Audio(preferOgg ? ogg : wav);
  audio.preload = "auto";
  return audio;
}

function playSound(audio: HTMLAudioElement) {
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

export async function createFlappy(hooks: { onComplete: () => void }) {
  const app = new Application();

  TextureSource.defaultOptions.scaleMode = "nearest";

  await app.init({
    width: WIDTH,
    height: HEIGHT,
    antialias: false,
    resolution: 1,
    autoDensity: false,
    background: 0x70c5ce,
  });

  const [
    backgroundTex,
    baseTex,
    pipeTex,
    messageTex,
    gameoverTex,
    birdTex,
    numberTex,
  ] = await Promise.all([
    Assets.load<Texture>(backgroundUrl),
    Assets.load<Texture>(baseUrl),
    Assets.load<Texture>(pipeUrl),
    Assets.load<Texture>(messageUrl),
    Assets.load<Texture>(gameoverUrl),
    Assets.load<Texture>(birdUrl),
    Assets.load<Texture>(numbersUrl),
  ]);

  for (const texture of [
    backgroundTex,
    baseTex,
    pipeTex,
    messageTex,
    gameoverTex,
  ]) {
    nearest(texture);
  }

  matchSheet(birdTex, birdSheet);
  matchSheet(numberTex, numbersSheet);
  const birdScale = sheetScale(birdTex, birdSheet);
  const numberScale = sheetScale(numberTex, numbersSheet);
  const wingNames = [
    "yellowbird-midflap.png",
    "yellowbird-upflap.png",
    "yellowbird-downflap.png",
  ] as const;
  const wings = wingNames.map((name) => slice(birdTex, birdSheet, name));
  const birdFrame = birdSheet.frames[wingNames[0]]?.frame;
  if (!birdFrame) throw new Error("Нет кадра птицы");
  const birdW = birdFrame.w;
  const birdH = birdFrame.h;

  const digits = Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => [
      String(index),
      slice(numberTex, numbersSheet, `${index}.png`),
    ]),
  );

  const background = new Sprite(backgroundTex);
  const pipes = new Container();
  const groundA = new Sprite(baseTex);
  const groundB = new Sprite(baseTex);
  groundA.y = GROUND_Y;
  groundB.y = GROUND_Y;

  const bird = new Sprite(wings[0]);
  bird.anchor.set(0.5);
  bird.scale.set(birdScale);
  bird.roundPixels = true;
  bird.x = BIRD_X + birdW / 2;

  const scoreView = new Container();
  const message = new Sprite(messageTex);
  message.x = (WIDTH - message.width) / 2;
  message.y = 64;
  const gameover = new Sprite(gameoverTex);
  gameover.anchor.set(0.5);
  gameover.position.set(WIDTH / 2, 180);
  gameover.visible = false;

  app.stage.addChild(
    background,
    pipes,
    groundA,
    groundB,
    bird,
    scoreView,
    message,
    gameover,
  );

  const wingSound = loadSound(wingOgg, wingWav);
  const pointSound = loadSound(pointOgg, pointWav);
  const hitSound = loadSound(hitOgg, hitWav);
  const dieSound = loadSound(dieOgg, dieWav);
  const swooshSound = loadSound(swooshOgg, swooshWav);
  const sounds = [wingSound, pointSound, hitSound, dieSound, swooshSound];

  const pairs: PipePair[] = [];
  let phase: Phase = "ready";
  let birdY = 236;
  let velocity = 0;
  let hover = 0;
  let wingTime = 0;
  let wingIndex = 0;
  let groundOffset = 0;
  let score = 0;
  let deathLock = 0;
  let winTime = 0;
  let finished = false;
  let playDieOnLand = false;

  const placeBird = () => {
    bird.y = birdY;
    bird.rotation = phase === "ready" ? 0 : bird.rotation;
  };

  const drawScore = () => {
    scoreView.removeChildren();
    if (phase === "ready") return;
    const text = String(score);
    let cursor = 0;
    for (const char of text) {
      const digit = new Sprite(digits[char]);
      digit.scale.set(numberScale);
      digit.roundPixels = true;
      digit.x = cursor;
      cursor += digit.width + 2;
      scoreView.addChild(digit);
    }
    scoreView.x = Math.round((WIDTH - Math.max(0, cursor - 2)) / 2);
    scoreView.y = 36;
  };

  const spawnPipe = (x: number) => {
    const gapY = 70 + Math.random() * (GROUND_Y - PIPE_GAP - 140);
    const top = new Sprite(pipeTex);
    const bottom = new Sprite(pipeTex);
    top.scale.y = -1;
    top.x = x;
    bottom.x = x;
    pipes.addChild(top, bottom);
    const pair: PipePair = { x, gapY, scored: false, top, bottom };
    layoutPipe(pair);
    pairs.push(pair);
  };

  const layoutPipe = (pair: PipePair) => {
    pair.top.x = pair.x;
    pair.bottom.x = pair.x;
    pair.top.y = pair.gapY;
    pair.bottom.y = pair.gapY + PIPE_GAP;
    const cover = GROUND_Y - pair.bottom.y;
    pair.bottom.scale.y = Math.max(1, cover / pipeTex.height);
  };

  const reset = (announce = true) => {
    phase = "ready";
    birdY = 236;
    velocity = 0;
    hover = 0;
    score = 0;
    deathLock = 0;
    winTime = 0;
    bird.rotation = 0;
    message.visible = true;
    gameover.visible = false;
    for (const pair of pairs) {
      pair.top.destroy();
      pair.bottom.destroy();
    }
    pairs.length = 0;
    playDieOnLand = false;
    drawScore();
    placeBird();
    if (announce) playSound(swooshSound);
  };

  const flap = () => {
    if (phase === "won" || finished) return;
    if (phase === "dead") {
      if (deathLock <= 0) reset();
      return;
    }
    if (phase === "ready") {
      phase = "play";
      message.visible = false;
      spawnPipe(WIDTH + 80);
      drawScore();
      playSound(swooshSound);
    }
    velocity = FLAP;
    bird.rotation = -0.45;
    playSound(wingSound);
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.code !== "Space" && event.code !== "ArrowUp") return;
    event.preventDefault();
    flap();
  };

  const hitPipe = (pair: PipePair) => {
    const left = BIRD_X + 6;
    const right = BIRD_X + birdW - 6;
    const top = birdY - birdH / 2 + 3;
    const bottom = birdY + birdH / 2 - 2;
    const overlapsX = right > pair.x + 2 && left < pair.x + PIPE_WIDTH - 2;
    const inGap = top > pair.gapY && bottom < pair.gapY + PIPE_GAP;
    return overlapsX && !inGap;
  };

  const die = () => {
    phase = "dead";
    deathLock = 18;
    gameover.visible = true;
    playDieOnLand = birdY + birdH / 2 < GROUND_Y;
    velocity = Math.min(velocity, 0);
    playSound(hitSound);
  };

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointerdown", flap);
  window.addEventListener("keydown", onKey);

  reset(false);

  app.ticker.add((ticker) => {
    const dt = Math.min(ticker.deltaTime, 2.2);

    wingTime += dt;
    if (wingTime >= 6) {
      wingTime = 0;
      wingIndex = (wingIndex + 1) % wings.length;
      bird.texture = wings[wingIndex] ?? wings[0];
    }

    if (phase === "ready" || phase === "play") {
      groundOffset -= PIPE_SPEED * dt;
      if (groundOffset <= -baseTex.width) groundOffset += baseTex.width;
      groundA.x = groundOffset;
      groundB.x = groundOffset + baseTex.width;
    }

    if (phase === "ready") {
      hover += dt;
      birdY = 236 + Math.sin(hover * 0.12) * 5;
      bird.rotation = 0;
      placeBird();
      return;
    }

    if (phase === "won") {
      winTime += dt;
      if (winTime > 36 && !finished) {
        finished = true;
        hooks.onComplete();
      }
      return;
    }

    velocity = Math.min(MAX_FALL, velocity + GRAVITY * dt);
    birdY += velocity * dt;
    if (phase === "play") {
      bird.rotation = Math.max(-0.5, Math.min(1.35, velocity * 0.075));
    } else {
      bird.rotation = Math.min(Math.PI / 2, bird.rotation + 0.08 * dt);
      deathLock = Math.max(0, deathLock - dt);
    }

    if (birdY - birdH / 2 < 0) {
      birdY = birdH / 2;
      velocity = 0;
    }

    if (phase === "play") {
      const rightmost = pairs.reduce((max, pair) => Math.max(max, pair.x), 0);
      if (pairs.length === 0 || rightmost < WIDTH - PIPE_SPACING) {
        spawnPipe(Math.max(WIDTH + 20, rightmost + PIPE_SPACING));
      }

      for (const pair of pairs) {
        pair.x -= PIPE_SPEED * dt;
        layoutPipe(pair);
        if (!pair.scored && pair.x + PIPE_WIDTH < BIRD_X) {
          pair.scored = true;
          score += 1;
          drawScore();
          playSound(pointSound);
          if (score >= WIN_SCORE) phase = "won";
        }
      }

      for (let index = pairs.length - 1; index >= 0; index -= 1) {
        const pair = pairs[index];
        if (!pair || pair.x > -PIPE_WIDTH) continue;
        pair.top.destroy();
        pair.bottom.destroy();
        pairs.splice(index, 1);
      }

      if (
        phase === "play" &&
        (birdY + birdH / 2 >= GROUND_Y || pairs.some(hitPipe))
      ) {
        die();
      }
    }

    if (birdY + birdH / 2 >= GROUND_Y) {
      birdY = GROUND_Y - birdH / 2;
      velocity = 0;
      if (playDieOnLand) {
        playDieOnLand = false;
        playSound(dieSound);
      }
    }

    placeBird();
  });

  let observer: ResizeObserver | undefined;
  let density: MediaQueryList | undefined;

  const fit = () => {
    const parent = app.canvas.parentElement;
    if (!parent || parent.clientWidth < 1 || parent.clientHeight < 1) return;
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (parent.clientWidth * dpr) / WIDTH,
          (parent.clientHeight * dpr) / HEIGHT,
        ),
      ),
    );
    if (app.renderer.resolution !== scale) {
      app.renderer.resize(WIDTH, HEIGHT, scale);
    }
    app.canvas.style.width = `${(WIDTH * scale) / dpr}px`;
    app.canvas.style.height = `${(HEIGHT * scale) / dpr}px`;
  };

  const watchDensity = () => {
    density?.removeEventListener("change", onDensity);
    density = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`,
    );
    density.addEventListener("change", onDensity);
  };

  const onDensity = () => {
    fit();
    watchDensity();
  };

  return {
    canvas: app.canvas,
    fit() {
      const parent = app.canvas.parentElement;
      if (parent && !observer) {
        observer = new ResizeObserver(() => fit());
        observer.observe(parent);
        watchDensity();
      }
      fit();
    },
    destroy() {
      observer?.disconnect();
      density?.removeEventListener("change", onDensity);
      window.removeEventListener("keydown", onKey);
      for (const sound of sounds) {
        sound.pause();
      }
      app.destroy(true, { children: true, texture: false });
    },
  };
}
