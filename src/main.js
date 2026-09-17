import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { BOARD_LINKS, boardPosition, createGame, takeTurn } from './game.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x171411);
scene.fog = new THREE.Fog(0x171411, 34, 78);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 150);
const HOME_POSITION = new THREE.Vector3(14, 15, 18);
const HOME_TARGET = new THREE.Vector3(0, -.3, 0);
camera.position.copy(HOME_POSITION);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.dampingFactor = .075;
controls.enablePan = true;
controls.enableZoom = true;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 38;
controls.minPolarAngle = .3;
controls.maxPolarAngle = Math.PI * .47;
controls.panSpeed = .65;
controls.rotateSpeed = .6;
controls.zoomSpeed = .8;
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
controls.update();

const room = new THREE.Group();
scene.add(room);
const box = (w, h, d, material, x, y, z) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; room.add(mesh); return mesh;
};
const woodDark = new THREE.MeshStandardMaterial({ color: 0x351e11, roughness: .62 });
const cream = new THREE.MeshStandardMaterial({ color: 0xc9bda7, roughness: .92 });
const charcoal = new THREE.MeshStandardMaterial({ color: 0x292622, roughness: .82 });

function createWoodTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  const gradient = x.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#70472d'); gradient.addColorStop(.5, '#8f5d38'); gradient.addColorStop(1, '#5e3924');
  x.fillStyle = gradient; x.fillRect(0, 0, 1024, 512);
  let seed = 1147; const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 180; i++) {
    const y = random() * 512, amp = 2 + random() * 10;
    x.beginPath(); x.moveTo(0, y);
    for (let px = 0; px <= 1024; px += 16) x.lineTo(px, y + Math.sin(px * (.008 + random() * .003) + i) * amp);
    x.strokeStyle = `rgba(${35 + random() * 30},18,8,${.04 + random() * .12})`; x.lineWidth = .5 + random() * 2.5; x.stroke();
  }
  for (let i = 1; i < 8; i++) { x.fillStyle = 'rgba(30,15,6,.23)'; x.fillRect(i * 128 - 2, 0, 4, 512); }
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 2); texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); return texture;
}
const woodTexture = createWoodTexture();
const tabletopMaterial = new THREE.MeshPhysicalMaterial({ map: woodTexture, color: 0xffffff, roughness: .42, clearcoat: .28, clearcoatRoughness: .6 });

// Architecture: warm plaster walls, oak floorboards, window and rug.
const floorMat = new THREE.MeshStandardMaterial({ map: woodTexture, color: 0x9a7457, roughness: .78 });
box(56, .35, 48, floorMat, 0, -5.1, 0);
box(56, 25, .35, cream, 0, 7.3, -24);
box(.35, 25, 48, cream, -28, 7.3, 0);
for (let z = -22; z < 24; z += 2.1) box(55, .025, .035, woodDark, 0, -4.9, z);
const rug = new THREE.Mesh(new THREE.BoxGeometry(27, .08, 22), new THREE.MeshStandardMaterial({ color: 0x713d32, roughness: .95 }));
rug.position.set(0, -4.84, 0); rug.receiveShadow = true; room.add(rug);
for (let i = -6; i <= 6; i++) box(.035, .09, 20, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xc69b62 : 0x3c6670 }), i * 1.75, -4.77, 0);

const windowGroup = new THREE.Group(); windowGroup.position.set(-27.75, 6, -5); room.add(windowGroup);
const glass = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshPhysicalMaterial({ color: 0x9ecbe0, emissive: 0x4f7188, emissiveIntensity: .5, roughness: .18, transmission: .15 }));
glass.rotation.y = Math.PI / 2; windowGroup.add(glass);
for (const z of [-7, 7]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.35, 11, .45), woodDark); f.position.z = z; windowGroup.add(f); }
for (const y of [-5, 0, 5]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.35, .35, 14.4), woodDark); f.position.y = y; windowGroup.add(f); }
const daylight = new THREE.DirectionalLight(0xc9e8ff, 2.8); daylight.position.set(-17, 19, 10); daylight.castShadow = true; daylight.shadow.mapSize.set(2048, 2048); daylight.shadow.camera.left = daylight.shadow.camera.bottom = -20; daylight.shadow.camera.right = daylight.shadow.camera.top = 20; scene.add(daylight);
scene.add(new THREE.HemisphereLight(0xffe3c2, 0x32251f, 1.4));

// Dining table with layered edge, apron, and tapered legs.
box(19, .72, 17, tabletopMaterial, 0, -1.1, 0);
box(19.35, .18, 17.35, woodDark, 0, -.7, 0);
box(16.8, .75, .55, woodDark, 0, -1.72, -7.65); box(16.8, .75, .55, woodDark, 0, -1.72, 7.65);
for (const x of [-8.1, 8.1]) for (const z of [-7.1, 7.1]) { const leg = box(.8, 4, .8, woodDark, x, -3, z); leg.rotation.z = x * .003; }

function addChair(x, z, rotation = 0) {
  const g = new THREE.Group(); g.position.set(x, -3.2, z); g.rotation.y = rotation; room.add(g);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(5, .55, 4.5), charcoal); seat.position.y = 1.1; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, .55), charcoal); back.position.set(0, 3.1, 2); back.castShadow = true; g.add(back);
  for (const lx of [-2, 2]) for (const lz of [-1.6, 1.6]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.4, 2.4, .4), woodDark); leg.position.set(lx, 0, lz); g.add(leg); }
}
addChair(-12.2, 0, Math.PI / 2); addChair(12.2, 0, -Math.PI / 2); addChair(0, -11.4, 0);
function addShelf() {
  const g = new THREE.Group(); g.position.set(15, 1, -22.8); room.add(g);
  for (const x of [-6, 6]) { const side = new THREE.Mesh(new THREE.BoxGeometry(.5, 12, 3), woodDark); side.position.x = x; g.add(side); }
  for (const y of [-5.8, -2, 1.8, 5.8]) { const shelf = new THREE.Mesh(new THREE.BoxGeometry(12.5, .38, 3.1), woodDark); shelf.position.y = y; g.add(shelf); }
  const bookColors = [0x8f3f38, 0x31586b, 0xb58a43, 0x53643c];
  for (let i = 0; i < 18; i++) { const book = new THREE.Mesh(new THREE.BoxGeometry(.45 + (i % 3) * .12, 1.8 + (i % 4) * .25, 1.8), new THREE.MeshStandardMaterial({ color: bookColors[i % 4], roughness: .85 })); book.position.set(-5 + (i % 6) * 1.7, -4.65 + Math.floor(i / 6) * 3.8, .25); book.rotation.z = (i % 5 === 0) ? .12 : 0; g.add(book); }
}
addShelf();
// Couch hint and warm floor lamp.
box(12, 2.4, 4.2, charcoal, -18, -3.5, 14); box(12, 4.5, 1.4, charcoal, -18, -.8, 15.7);
const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, 9, 12), new THREE.MeshStandardMaterial({ color: 0x7a5a2e, metalness: .7, roughness: .3 })); lampStem.position.set(20, -.2, 12); room.add(lampStem);
const shade = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.3, 3.2, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8c58e, side: THREE.DoubleSide, roughness: .7 })); shade.position.set(20, 4.1, 12); room.add(shade);
const warmLamp = new THREE.PointLight(0xffb665, 65, 22, 2); warmLamp.position.set(20, 4.2, 12); scene.add(warmLamp);

const world = new THREE.Group(); world.rotation.y = -.12; world.position.y = -.28; scene.add(world);
const tileGeo = new THREE.BoxGeometry(1.06, .18, 1.06);
const tileMats = [0x171936, 0x202448, 0x241539, 0x17343a].map((color, i) => new THREE.MeshPhysicalMaterial({ color, roughness: .3, metalness: .35, clearcoat: 1, emissive: [0x07091a, 0x091127, 0x120619, 0x051b1b][i] }));
function coords(square, y = .2) { if (!square) return new THREE.Vector3(-6.3, y, 5); const { row, col } = boardPosition(square); return new THREE.Vector3((col - 4.5) * 1.12, y, (4.5 - row) * 1.12); }
function numberSprite(n) { const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); x.font = '600 27px Space Grotesk, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = n === 100 ? '#76ffec' : '#c8cbe0'; x.fillText(n, 48, 48); const tex = new THREE.CanvasTexture(c); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(.48, .48, .48); return s; }
for (let n = 1; n <= 100; n++) { const { row, col } = boardPosition(n), m = new THREE.Mesh(tileGeo, tileMats[(row + col) % 4]); m.position.copy(coords(n, .02)); m.castShadow = m.receiveShadow = true; world.add(m); const spr = numberSprite(n); spr.position.copy(coords(n, .145)); spr.rotation.x = -Math.PI / 2; world.add(spr); }
const base = new THREE.Mesh(new THREE.BoxGeometry(12.35, .42, 12.35), new THREE.MeshPhysicalMaterial({ color: 0x130e16, metalness: .45, roughness: .25, clearcoat: 1 })); base.position.y = -.25; base.receiveShadow = true; world.add(base);
const frameMat = new THREE.MeshPhysicalMaterial({ map: woodTexture, color: 0x7b4b2a, roughness: .38, clearcoat: .5 });
for (const [w, d, x, z] of [[13.1, .45, 0, -6.35], [13.1, .45, 0, 6.35], [.45, 12.2, -6.35, 0], [.45, 12.2, 6.35, 0]]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(w, .55, d), frameMat); rail.position.set(x, .05, z); rail.castShadow = true; world.add(rail); }
function addLadder(a, b) { const p1 = coords(a, .25), p2 = coords(b, .25), d = p2.clone().sub(p1), len = d.length(), g = new THREE.Group(); g.position.copy(p1.clone().add(p2).multiplyScalar(.5)); g.rotation.y = Math.atan2(d.x, d.z); const mat = new THREE.MeshStandardMaterial({ color: 0xd3a04b, metalness: .55, roughness: .25 }); for (const x of [-.18, .18]) { const rail = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, len, 8), mat); rail.rotation.x = Math.PI / 2; rail.position.x = x; g.add(rail); } for (let z = -len / 2 + .18; z < len / 2; z += .3) { const rung = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .36, 7), mat); rung.rotation.z = Math.PI / 2; rung.position.z = z; g.add(rung); } world.add(g); }
function addChute(a, b) { const p1 = coords(a, .3), p2 = coords(b, .3), curve = new THREE.CatmullRomCurve3([p1, p1.clone().lerp(p2, .32).add(new THREE.Vector3(.6, .55, .25)), p1.clone().lerp(p2, .66).add(new THREE.Vector3(-.55, .25, -.2)), p2]); world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, .115, 10, false), new THREE.MeshPhysicalMaterial({ color: 0xe63876, emissive: 0x4b001d, emissiveIntensity: .7, roughness: .2, clearcoat: 1 }))); }
Object.entries(BOARD_LINKS).forEach(([a, b]) => b > a ? addLadder(+a, b) : addChute(+a, b));

// Weighted pawn silhouettes with felt bases and subtle lacquer.
const colors = [0x4ae3ce, 0xe8468d, 0xe7b849, 0x8069de], pieces = [];
const pawnProfile = [new THREE.Vector2(.32, 0), new THREE.Vector2(.35, .08), new THREE.Vector2(.22, .16), new THREE.Vector2(.13, .36), new THREE.Vector2(.22, .52), new THREE.Vector2(.2, .66), new THREE.Vector2(0, .78)];
for (let i = 0; i < 4; i++) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.LatheGeometry(pawnProfile, 20), new THREE.MeshPhysicalMaterial({ color: colors[i], metalness: .18, roughness: .22, clearcoat: 1 })); body.castShadow = true; g.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 14), body.material); head.position.y = .83; head.castShadow = true; g.add(head); g.position.copy(coords(0, .22)).add(new THREE.Vector3(i * .25, 0, 0)); world.add(g); pieces.push(g); }
// Decorative ivory dice beside the board.
const die = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05, 3, 3, 3), new THREE.MeshPhysicalMaterial({ color: 0xeee8dc, roughness: .3, clearcoat: .6 })); die.geometry.translate(0, .52, 0); die.position.set(7.25, .05, 4.4); die.rotation.set(.15, .5, -.12); die.castShadow = true; world.add(die);
for (const p of [[7.28, .82, 4.12], [7.55, .76, 4.4], [7.02, .84, 4.38]]) { const pip = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 6), new THREE.MeshStandardMaterial({ color: 0x171313 })); pip.position.set(...p); world.add(pip); }

let game = createGame(4), busy = false, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, soundOn = true, audio;
const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function renderPlayers() { $('#players').innerHTML = game.players.map((p, i) => `<div class="player ${i === game.current && game.winner === null ? 'active' : ''}" style="--color:#${colors[i].toString(16).padStart(6, '0')}"><i class="dot"></i><strong>${p.name}</strong><span>${p.square}</span></div>`).join(''); }
function setStatus(title, detail) { $('#status').textContent = title; $('#detail').textContent = detail; $('#round').textContent = `TURN ${game.turns + 1}`; }
function toast(text) { const t = $('#toast'); t.textContent = text; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1500); }
function initAudio() { if (audio) return; const C = window.AudioContext || window.webkitAudioContext; if (C) audio = new C(); }
function beep(freq = 440, d = .12, type = 'sine') { if (!soundOn || !audio) return; const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.setValueAtTime(freq, audio.currentTime); o.frequency.exponentialRampToValueAtTime(freq * 1.4, audio.currentTime + d); g.gain.setValueAtTime(.1, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + d); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + d); }
const wait = (ms) => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 30) : ms));
async function tweenPiece(piece, from, to, duration = 300) { if (reduced) { piece.position.copy(to); return; } await new Promise(resolve => { const start = performance.now(); function frame(now) { const t = Math.min(1, (now - start) / duration), e = 1 - (1 - t) ** 3; piece.position.lerpVectors(from, to, e); piece.position.y = to.y + Math.sin(t * Math.PI) * .32; if (t < 1) requestAnimationFrame(frame); else resolve(); } requestAnimationFrame(frame); }); }
async function animateMove(index, start, move) { const piece = pieces[index]; if (move.landing !== start) for (let s = start + 1; s <= move.landing; s++) { const target = coords(s, .22).add(new THREE.Vector3((index % 2 - .5) * .18, 0, (Math.floor(index / 2) - .5) * .18)); await tweenPiece(piece, piece.position.clone(), target, 145); beep(260 + s * 4, .035, 'triangle'); } if (move.link) { toast(move.link === 'ladder' ? 'LADDER BOOST!' : 'CHUTE DROP!'); beep(move.link === 'ladder' ? 620 : 180, .35, 'sawtooth'); await tweenPiece(piece, piece.position.clone(), coords(move.final, .22), 700); } }
async function performTurn() { if (busy || game.winner !== null) return; busy = true; $('#roll').disabled = true; initAudio(); const player = game.current, start = game.players[player].square, roll = 1 + Math.floor(Math.random() * 6); $('#roll').classList.add('rolling'); for (let i = 0; i < 8; i++) { await wait(55); $('#die-face').textContent = faces[Math.floor(Math.random() * 6)]; } $('#die-face').textContent = faces[roll - 1]; $('#roll').classList.remove('rolling'); beep(380 + roll * 35, .16); const next = takeTurn(game, roll); await animateMove(player, start, next.lastMove); game = next; renderPlayers(); if (game.winner !== null) { setStatus(game.winner === 0 ? 'You conquered the board!' : `${game.players[game.winner].name} wins`, `${game.turns} turns decided this match.`); toast('SQUARE 100 — VICTORY'); busy = false; return; } const p = game.players[game.current]; setStatus(game.current === 0 ? 'Your move' : `${p.name} is rolling`, game.current === 0 ? 'Roll the die and bend your fate.' : 'The table awaits their roll.'); busy = false; if (game.current === 0) { $('#roll').disabled = false; $('#roll-label').textContent = 'TAP TO ROLL'; } else { $('#roll-label').textContent = 'RIVAL TURN'; await wait(720); performTurn(); } }
function reset() { game = createGame(4); pieces.forEach((p, i) => p.position.copy(coords(0, .22)).add(new THREE.Vector3(i * .25, 0, 0))); renderPlayers(); setStatus('Your move', 'Roll the die and bend your fate.'); $('#roll').disabled = false; $('#die-face').textContent = '⚄'; $('#roll-label').textContent = 'TAP TO ROLL'; }
function resetView() { camera.position.copy(HOME_POSITION); controls.target.copy(HOME_TARGET); controls.update(); toast('VIEW RESET'); }
$('#start').onclick = () => { initAudio(); beep(330, .3); $('#hero').hidden = true; $('#game').hidden = false; reset(); };
$('#roll').onclick = performTurn; $('#restart').onclick = reset; $('#reset-view').onclick = resetView;
$('#sound').onclick = () => { soundOn = !soundOn; $('#sound').setAttribute('aria-pressed', String(!soundOn)); $('#sound').textContent = soundOn ? '♪' : '×'; };
$('#motion').onclick = () => { reduced = !reduced; $('#motion').setAttribute('aria-pressed', String(reduced)); controls.enableDamping = !reduced; };
function loop() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderPlayers();
