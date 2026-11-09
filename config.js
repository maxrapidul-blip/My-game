const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WORLD_WIDTH = 5000;
const GROUND_Y = canvas.height - 60;

let cash = 0, score = 0, startTime = Date.now();
let movingLeft = false, movingRight = false, facingRight = true, paused = true;
let gameStarted = false;
let projectiles = [], zombies = [], buildings = [], bloodSplats = [], explosions = [], humans = [];

let bomber = { active: false, x: 0, y: 60, speed: 15, dropped: false, bomb: { active: false, x: 0, y: 0, vy: 0 } };

let sandParticles = [];
for(let i=0; i < 150; i++) {
    sandParticles.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * canvas.height,
        vx: -(8 + Math.random() * 12),
        vy: (Math.random() - 0.5) * 2,
        size: 2 + Math.random() * 3
    });
}

let tumbleweeds = [];
for(let i=0; i<3; i++) {
    tumbleweeds.push({ x: Math.random() * WORLD_WIDTH, y: GROUND_Y - 15, r: 15, rot: 0, speed: 2 + Math.random()*2 });
}

let cacti = [];
for(let i=0; i<20; i++) {
    cacti.push({ x: 200 + Math.random() * (WORLD_WIDTH - 400), h: 30 + Math.random() * 40 });
}

const weapons = [
    { name: "Main Gun", dmg: 5, price: 0, owned: true, type: "bullet" },
    { name: "Rockets", dmg: 10, price: 800, owned: false, type: "rocket" },
    { name: "Cannonballs", dmg: 25, price: 2000, owned: false, type: "cannon" },
    { name: "Tactical Nuke", dmg: 2500, price: 15000, owned: false, type: "nuke" },
    { name: "Cluster Bomb", dmg: 0, price: 3500, owned: false, type: "cluster" }
];
let currentWeapon = 0;

const tank = { x: 400, y: GROUND_Y - 55, w: 90, h: 45, speed: 6, recoil: 0 };
const helis = {
    green: { active: false, x: -100, y: 100, speed: 7.5, bladeAngle: 0, fireTimer: 0, color: '#3a5a2a', tailColor: '#2d4d22', fireRate: 8, weaponType: 'bullet', facingRight: true },
    blue: { active: false, x: -200, y: 60, speed: 8.0, bladeAngle: 0, fireTimer: 0, color: '#2a3a5a', tailColor: '#222d4d', fireRate: 24, weaponType: 'rocket', facingRight: true }
};

for (let i = 0; i < 12; i++) {
    const h = 100 + Math.random() * 150;
    const w = 240 + Math.random() * 100;
    const hp = 1500 + Math.floor(Math.random() * 5000);
    buildings.push({ 
        x: 800 + (i * 320), y: GROUND_Y - h, w: w, h: h, 
        hp: hp, maxHp: hp, destroyed: false, shake: 0,
        color: `rgb(${160+Math.random()*40},${140+Math.random()*20},100)`
    });
}