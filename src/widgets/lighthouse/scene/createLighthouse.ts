import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from "three";
import moonUrl from "@/shared/assets/images/moon.png";

const START_Z = 8;
const EYE = 1.62;
const SPEED = 2.8;
const LIGHTHOUSE_SCALE = 2.7;
const TOWER_X = 0;
const TOWER_Z = -26;
const TOWER_RADIUS = 1.55 * LIGHTHOUSE_SCALE;
const ARRIVE_RADIUS = TOWER_RADIUS + 1.5;

const ISLAND = { x: 0, z: 16, radius: 8.8 };
const PAD = { x: 0, z: TOWER_Z, radius: 6.6 };
const MOON = { x: 12, y: 13, z: 2 };
const MOON_VIEW = { x: 0.62, y: 0.52 };

function viewTowardMoon(fov: number, aspect: number) {
  const dx = MOON.x;
  const dy = MOON.y - EYE;
  const dz = MOON.z - START_Z;
  const horiz = Math.hypot(dx, dz) || 1;
  const dist = Math.hypot(horiz, dy) || 1;
  const halfV = (fov * Math.PI) / 360;
  const halfH = Math.atan(aspect * Math.tan(halfV));
  const yaw = Math.atan2(-dx / horiz, -dz / horiz) + Math.atan(MOON_VIEW.x * Math.tan(halfH));
  const pitch = Math.asin(dy / dist) - Math.atan(MOON_VIEW.y * Math.tan(halfV));
  return {
    yaw,
    pitch: Math.min(1.05, Math.max(-1.05, pitch)),
  };
}

function onLand(x: number, z: number) {
  const island = Math.hypot(x - ISLAND.x, z - ISLAND.z) < ISLAND.radius;
  const pad = Math.hypot(x - PAD.x, z - PAD.z) < PAD.radius;
  const bridge = Math.abs(x) < 1.2 && z > TOWER_Z + 2 && z < 10;
  return island || pad || bridge;
}

function lit(color: number, roughness = 0.86) {
  return new MeshStandardMaterial({ color, roughness, metalness: 0, flatShading: true });
}

function beamTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  if (!ctx) return texture;
  const along = ctx.createLinearGradient(0, 0, 256, 0);
  along.addColorStop(0, "rgba(255, 236, 190, 0.95)");
  along.addColorStop(0.35, "rgba(255, 214, 140, 0.45)");
  along.addColorStop(1, "rgba(255, 196, 110, 0)");
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, 256, 64);
  const across = ctx.createLinearGradient(0, 0, 0, 64);
  across.addColorStop(0, "rgba(0, 0, 0, 1)");
  across.addColorStop(0.5, "rgba(0, 0, 0, 0)");
  across.addColorStop(1, "rgba(0, 0, 0, 1)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, 256, 64);
  texture.needsUpdate = true;
  return texture;
}

function roundMoonTexture(url: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const image = new Image();
  image.onload = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, 0, 0, 512, 512);
    texture.needsUpdate = true;
  };
  image.src = url;
  return texture;
}

function moonGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  if (!ctx) return texture;
  const glow = ctx.createRadialGradient(128, 128, 72, 128, 128, 128);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  glow.addColorStop(0.55, "rgba(255, 255, 255, 0.28)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 256);
  texture.needsUpdate = true;
  return texture;
}

function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  if (!ctx) return texture;
  const glow = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  glow.addColorStop(0, "rgba(255, 236, 196, 1)");
  glow.addColorStop(0.18, "rgba(255, 196, 96, 0.75)");
  glow.addColorStop(1, "rgba(255, 160, 40, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  texture.needsUpdate = true;
  return texture;
}

function makeHands() {
  const coat = lit(0xefe6d6, 0.78);
  const skin = lit(0xf0c4a6, 0.7);
  const root = new Group();

  const arm = (side: number) => {
    const pivot = new Group();
    pivot.position.set(side * 0.32, -0.34, -0.38);
    const sleeve = new Mesh(new CapsuleGeometry(0.05, 0.26, 2, 6), coat);
    sleeve.position.set(0, -0.12, -0.08);
    sleeve.rotation.x = 1.15;
    const hand = new Mesh(new SphereGeometry(0.055, 7, 6), skin);
    hand.position.set(0, -0.22, -0.28);
    pivot.add(sleeve, hand);
    return pivot;
  };

  const armL = arm(-1);
  const armR = arm(1);
  root.add(armL, armR);
  return { root, armL, armR };
}

function makeLighthouse() {
  const white = lit(0xe4ddd0, 0.72);
  const red = lit(0x9c3a36, 0.68);
  const stone = lit(0x59615c, 0.95);
  const wood = lit(0x2c241c, 0.8);
  const glass = new MeshStandardMaterial({
    color: 0xffe3b0,
    emissive: 0xffb24a,
    emissiveIntensity: 1.6,
    roughness: 0.22,
    metalness: 0.05,
    flatShading: true,
  });

  const group = new Group();
  let y = 0;
  const stack = (mesh: Mesh, height: number) => {
    mesh.position.y = y + height / 2;
    y += height;
    group.add(mesh);
  };

  stack(new Mesh(new CylinderGeometry(1.2, 1.45, 0.42, 8), stone), 0.42);
  stack(new Mesh(new CylinderGeometry(0.74, 0.9, 1.2, 14), white), 1.2);
  stack(new Mesh(new CylinderGeometry(0.7, 0.76, 0.36, 14), red), 0.36);
  stack(new Mesh(new CylinderGeometry(0.62, 0.72, 1.15, 14), white), 1.15);
  stack(new Mesh(new CylinderGeometry(0.58, 0.64, 0.32, 14), red), 0.32);
  stack(new Mesh(new CylinderGeometry(0.5, 0.58, 1.05, 14), white), 1.05);
  stack(new Mesh(new CylinderGeometry(0.98, 0.98, 0.12, 16), stone), 0.12);

  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const post = new Mesh(new BoxGeometry(0.045, 0.26, 0.045), white);
    post.position.set(Math.cos(angle) * 0.9, y + 0.13, Math.sin(angle) * 0.9);
    group.add(post);
  }

  const room = new Mesh(new CylinderGeometry(0.4, 0.44, 0.7, 8), glass);
  room.position.y = y + 0.42;
  group.add(room);

  const cap = new Mesh(new ConeGeometry(0.58, 0.46, 8), red);
  cap.position.y = y + 0.7 + 0.23;
  group.add(cap);

  const finial = new Mesh(new SphereGeometry(0.07, 8, 6), white);
  finial.position.y = cap.position.y + 0.28;
  group.add(finial);

  const door = new Mesh(new BoxGeometry(0.28, 0.56, 0.08), wood);
  door.position.set(0, 0.78, 0.9);
  group.add(door);

  const windowMat = glass.clone();
  const windowA = new Mesh(new BoxGeometry(0.12, 0.16, 0.06), windowMat);
  windowA.position.set(0.28, 2.55, 0.66);
  const windowB = windowA.clone();
  windowB.position.x = -0.28;
  group.add(windowA, windowB);

  const beam = new Group();
  beam.position.y = room.position.y;
  const beamMap = beamTexture();
  const beamMat = new MeshBasicMaterial({
    map: beamMap,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    fog: false,
  });
  const fan = new Mesh(new PlaneGeometry(8, 1.5), beamMat);
  fan.rotation.y = -Math.PI / 2;
  fan.position.z = 4;
  const sheet = new Mesh(new PlaneGeometry(8, 0.7), beamMat);
  sheet.rotation.y = -Math.PI / 2;
  sheet.rotateX(Math.PI / 2);
  sheet.position.z = 4;
  const fanBack = fan.clone();
  fanBack.position.z = -4;
  fanBack.rotation.y = Math.PI / 2;
  const sheetBack = sheet.clone();
  sheetBack.position.z = -4;
  sheetBack.rotation.y = Math.PI / 2;
  beam.add(fan, sheet, fanBack, sheetBack);
  group.add(beam);

  return { group, beam, lampY: room.position.y };
}

function makeSea() {
  const uniforms = {
    uTime: { value: 0 },
    uDeep: { value: new Color("#0c2436") },
    uLift: { value: new Color("#1d4a62") },
    uHorizon: { value: new Color("#1a3c56") },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 p = position;
        float wave = sin(p.x * 0.35 + uTime * 1.1) * 0.08 + cos(p.z * 0.22 + uTime * 0.8) * 0.06;
        p.y += wave;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        vWave = wave;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uDeep;
      uniform vec3 uLift;
      uniform vec3 uHorizon;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        float dist = length(vWorld - cameraPosition);
        float fade = smoothstep(24.0, 150.0, dist);
        vec3 col = mix(uDeep, uLift, clamp(vWave * 6.0 + 0.35, 0.0, 1.0));
        gl_FragColor = vec4(mix(col, uHorizon, fade), 1.0);
      }
    `,
  });
  const sea = new Mesh(new PlaneGeometry(420, 420, 70, 70), material);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -1.85;
  return { sea, uniforms };
}

function disposeObject(root: Scene) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((obj) => {
    if (obj instanceof Mesh || obj instanceof Points) {
      geometries.add(obj.geometry);
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      list.forEach((item) => materials.add(item));
    }
    if (obj instanceof Sprite) materials.add(obj.material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    if ("map" in material && material.map instanceof Texture) material.map.dispose();
    material.dispose();
  });
}

export function createLighthouse(host: HTMLElement, onComplete: () => void, onMove?: () => void) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x071018);
  host.appendChild(renderer.domElement);

  const scene = new Scene();
  scene.fog = new Fog(0x10283c, 36, 130);
  scene.background = new Color(0x071018);

  const camera = new PerspectiveCamera(68, 1, 0.08, 500);
  camera.rotation.order = "YXZ";
  const hands = makeHands();
  camera.add(hands.root);
  scene.add(camera);

  const sky = new Mesh(
    new SphereGeometry(240, 24, 16),
    new ShaderMaterial({
      side: DoubleSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new Color("#070b16") },
        uHorizon: { value: new Color("#1a3c56") },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        void main() {
          float h = normalize(vPos).y;
          gl_FragColor = vec4(mix(uHorizon, uTop, smoothstep(-0.05, 0.55, h)), 1.0);
        }
      `,
    }),
  );
  scene.add(sky);

  const starPositions: number[] = [];
  for (let index = 0; index < 280; index += 1) {
    const radius = 30 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * 0.7;
    starPositions.push(
      Math.cos(theta) * Math.sin(phi) * radius,
      6 + Math.cos(phi) * radius * 0.45,
      Math.sin(theta) * Math.sin(phi) * radius,
    );
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new Float32BufferAttribute(starPositions, 3));
  const stars = new Points(
    starGeometry,
    new PointsMaterial({ color: 0xf7f4ea, size: 0.12, sizeAttenuation: true, fog: false }),
  );
  scene.add(stars);

  const moonGlow = new Sprite(
    new SpriteMaterial({
      map: moonGlowTexture(),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: 0.85,
      fog: false,
    }),
  );
  moonGlow.position.set(MOON.x, MOON.y, MOON.z);
  moonGlow.scale.set(7.6, 7.6, 1);
  moonGlow.renderOrder = 1;

  const moon = new Sprite(
    new SpriteMaterial({
      map: roundMoonTexture(moonUrl),
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  moon.position.set(MOON.x, MOON.y, MOON.z);
  moon.scale.set(4, 4, 1);
  moon.renderOrder = 2;
  scene.add(moonGlow, moon);

  const { sea, uniforms } = makeSea();
  scene.add(sea);

  const grassMat = lit(0x234233, 0.95);
  const rockMat = lit(0x4e5654, 1);
  const deckMat = lit(0x8d7a58, 0.9);
  const pierMat = lit(0x3a403c, 0.95);

  const islandRock = new Mesh(new CylinderGeometry(8.2, 9.4, 2.6, 8), rockMat);
  islandRock.position.set(ISLAND.x, -1.3, ISLAND.z);
  const islandGrass = new Mesh(new CircleGeometry(8.35, 8), grassMat);
  islandGrass.rotation.x = -Math.PI / 2;
  islandGrass.position.set(ISLAND.x, 0.02, ISLAND.z);

  const padRock = new Mesh(new CylinderGeometry(5.6, 6.6, 2.6, 8), rockMat);
  padRock.position.set(PAD.x, -1.3, PAD.z);
  const padGrass = new Mesh(new CircleGeometry(5.7, 8), grassMat);
  padGrass.rotation.x = -Math.PI / 2;
  padGrass.position.set(PAD.x, 0.02, PAD.z);

  const deck = new Mesh(new BoxGeometry(2.5, 0.28, 32), deckMat);
  deck.position.set(0, 0.12, -7);

  scene.add(islandRock, islandGrass, padRock, padGrass, deck);

  for (let z = 4; z >= -20; z -= 6) {
    for (const side of [-0.85, 0.85]) {
      const pier = new Mesh(new BoxGeometry(0.32, 2.3, 0.32), pierMat);
      pier.position.set(side, -0.95, z);
      scene.add(pier);
    }
  }

  const railMat = lit(0xc8c0b0, 0.8);
  for (let z = 6; z >= -22; z -= 3) {
    for (const side of [-1.2, 1.2]) {
      const post = new Mesh(new BoxGeometry(0.08, 0.7, 0.08), railMat);
      post.position.set(side, 0.55, z);
      scene.add(post);
    }
  }

  const bushMat = lit(0x1b3a2c);
  const bushes: [number, number, number][] = [
    [-3.2, 0.45, 18.5],
    [2.6, 0.35, 19.2],
    [-4.4, 0.28, 14.2],
    [4.1, 0.4, 15.6],
    [1.4, 0.22, 21],
    [-1.8, 0.3, 12.4],
  ];
  for (const [x, height, z] of bushes) {
    const bush = new Mesh(new ConeGeometry(0.34 + height, 0.7 + height, 6), bushMat);
    bush.position.set(x, height, z);
    scene.add(bush);
  }

  const rocks: [number, number, number, number][] = [
    [-6.4, 0.2, 12.5, 0.8],
    [6.2, 0.16, 17.4, 0.55],
    [-2.2, 0.12, 23.2, 0.7],
    [3.4, 0.18, -23.2, 0.6],
    [-3.6, 0.14, -28.4, 0.75],
  ];
  for (const [x, y, z, scale] of rocks) {
    const rock = new Mesh(new SphereGeometry(0.5, 6, 5), rockMat);
    rock.scale.set(scale, scale * 0.65, scale);
    rock.position.set(x, y, z);
    scene.add(rock);
  }

  const lighthouse = makeLighthouse();
  lighthouse.group.scale.setScalar(LIGHTHOUSE_SCALE);
  lighthouse.group.position.set(TOWER_X, 0, TOWER_Z);
  scene.add(lighthouse.group);

  const lamp = new PointLight(0xffc56b, 22, 48, 2);
  lamp.position.set(TOWER_X, lighthouse.lampY * LIGHTHOUSE_SCALE, TOWER_Z);
  scene.add(lamp);

  const halo = glowTexture();
  const sprite = new Sprite(
    new SpriteMaterial({
      map: halo,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: 0.95,
      fog: false,
    }),
  );
  sprite.position.copy(lamp.position);
  sprite.scale.set(9, 9, 1);
  scene.add(sprite);

  scene.add(new AmbientLight(0x1c3148, 0.7));
  const moonLight = new DirectionalLight(0xc9d6f5, 1.7);
  moonLight.position.set(8, 14, 10);
  scene.add(moonLight);

  const place = { x: 0, z: START_Z };
  let yaw = 0;
  let pitch = 0;
  let aimed = false;
  camera.position.set(place.x, EYE, place.z);
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  const held = new Set<string>();
  const sticks = new Map<number, { side: "move" | "look"; x: number; y: number; ox: number; oy: number }>();
  let toldMove = false;

  const onKeyDown = (event: KeyboardEvent) => {
    if (!["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      return;
    }
    event.preventDefault();
    held.add(event.code);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    held.delete(event.code);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") {
      renderer.domElement.requestPointerLock();
      return;
    }
    if (!toldMove) {
      toldMove = true;
      onMove?.();
    }
    const rect = renderer.domElement.getBoundingClientRect();
    const side = event.clientX - rect.left < rect.width / 2 ? "move" : "look";
    sticks.set(event.pointerId, { side, x: event.clientX, y: event.clientY, ox: event.clientX, oy: event.clientY });
  };
  const onPointerMove = (event: PointerEvent) => {
    if (document.pointerLockElement === renderer.domElement) {
      yaw -= event.movementX * 0.0022;
      pitch = Math.min(1.05, Math.max(-1.05, pitch - event.movementY * 0.0022));
    }
    const stick = sticks.get(event.pointerId);
    if (!stick) return;
    if (stick.side === "look") {
      yaw -= (event.clientX - stick.x) * 0.005;
      pitch = Math.min(1.05, Math.max(-1.05, pitch - (event.clientY - stick.y) * 0.005));
    }
    stick.x = event.clientX;
    stick.y = event.clientY;
  };
  const onPointerUp = (event: PointerEvent) => {
    sticks.delete(event.pointerId);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!aimed) {
      aimed = true;
      const aim = viewTowardMoon(camera.fov, camera.aspect);
      yaw = aim.yaw;
      pitch = aim.pitch;
    }
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  let elapsed = 0;
  let last = performance.now();
  let frame = 0;
  let alive = true;
  let finished = false;
  let nearSince = 0;

  const render = (now: number) => {
    frame = window.requestAnimationFrame(render);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;

    let forward = 0;
    let strafe = 0;
    if (held.has("KeyW") || held.has("ArrowUp")) forward += 1;
    if (held.has("KeyS") || held.has("ArrowDown")) forward -= 1;
    if (held.has("KeyD") || held.has("ArrowRight")) strafe += 1;
    if (held.has("KeyA") || held.has("ArrowLeft")) strafe -= 1;
    for (const stick of sticks.values()) {
      if (stick.side !== "move") continue;
      strafe += Math.min(1, Math.max(-1, (stick.x - stick.ox) / 72));
      forward += Math.min(1, Math.max(-1, (stick.oy - stick.y) / 72));
    }

    const moving = !finished && (Math.abs(forward) > 0.05 || Math.abs(strafe) > 0.05);
    if (moving) {
      const length = Math.hypot(forward, strafe) || 1;
      const step = (SPEED * dt) / length;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      const nextX = place.x + (-sin * forward + cos * strafe) * step;
      const nextZ = place.z + (-cos * forward - sin * strafe) * step;
      if (onLand(nextX, nextZ)) {
        place.x = nextX;
        place.z = nextZ;
      } else if (onLand(nextX, place.z)) {
        place.x = nextX;
      } else if (onLand(place.x, nextZ)) {
        place.z = nextZ;
      }

      const dx = place.x - TOWER_X;
      const dz = place.z - TOWER_Z;
      const dist = Math.hypot(dx, dz) || 1;
      if (dist < TOWER_RADIUS) {
        place.x = TOWER_X + (dx / dist) * TOWER_RADIUS;
        place.z = TOWER_Z + (dz / dist) * TOWER_RADIUS;
      }
      if (!toldMove) {
        toldMove = true;
        onMove?.();
      }
    }

    const stride = Math.sin(elapsed * 8);
    camera.position.set(place.x, EYE + (moving ? Math.abs(stride) * 0.04 : 0), place.z);
    camera.rotation.set(pitch, yaw, moving ? stride * 0.012 : 0);

    const reach = Math.hypot(place.x - TOWER_X, place.z - TOWER_Z);
    if (reach < ARRIVE_RADIUS) {
      if (nearSince === 0) nearSince = elapsed;
      if (alive && !finished && elapsed - nearSince > 0.7) {
        finished = true;
        onComplete();
      }
    } else {
      nearSince = 0;
    }

    hands.armL.rotation.x = moving ? stride * 0.22 : 0;
    hands.armR.rotation.x = moving ? -stride * 0.22 : 0;
    uniforms.uTime.value = elapsed;
    lighthouse.beam.rotation.y = elapsed * 0.45;
    renderer.render(scene, camera);
  };
  frame = window.requestAnimationFrame(render);

  return {
    destroy() {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      observer.disconnect();
      halo.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
