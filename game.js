function openTab(evt, tabName) {
    let contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    let buttons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function startGame() {
    const music = document.getElementById('bgMusic');
    const wind = document.getElementById('windAudio');
    music.volume = 0.5; music.play().catch(e => {});
    wind.volume = 1.0; wind.play().catch(e => {});

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'block';
    document.getElementById('game-controls').style.display = 'flex';
    gameStarted = true; paused = false; startTime = Date.now();
    showDialogue("COMMANDER: Red Sand Outpost reached. The heat is 48°C. Destroy those bunkers!");
}

function checkVictory() {
    if (buildings.every(b => b.destroyed)) {
        paused = true;
        document.getElementById('win-screen').style.display = 'flex';
        document.getElementById('bgMusic').pause();
    }
}

function showDialogue(text) {
    const box = document.getElementById('dialogue-box');
    box.innerText = text; box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 4000);
}

function toggleShop() {
    if(!gameStarted) return;
    paused = !paused;
    document.getElementById('shop-menu').style.display = paused ? 'block' : 'none';
}
document.getElementById('shopBtn').onclick = toggleShop;

function buyWeapon(idx) {
    if (cash >= weapons[idx].price) { cash -= weapons[idx].price; weapons[idx].owned = true; equip(idx); }
}

function buyHuman(type) {
    if (type === 'hunter' && cash >= 200) {
        cash -= 200;
        humans.push({ name: 'Hunter', x: tank.x, y: GROUND_Y - 35, speed: 2, fireRate: 48, fireTimer: 0, type: 'bullet', color: '#c2b280', weaponColor: '#333', facingRight: true });
        toggleShop();
    } else if (type === 'adrian' && cash >= 1000) {
        cash -= 1000;
        humans.push({ name: 'Adrian', x: tank.x, y: GROUND_Y - 35, speed: 1.5, fireRate: 120, fireTimer: 0, type: 'heavy-rocket', color: '#4a3728', weaponColor: '#000', facingRight: true });
        toggleShop();
    }
}

function buyHeli(type) {
    if (type === 1 && cash >= 3000 && !helis.green.active) {
        cash -= 3000; helis.green.active = true; helis.green.x = tank.x;
    } else if (type === 2 && cash >= 4000 && !helis.blue.active) {
        cash -= 4000; helis.blue.active = true; helis.blue.x = tank.x;
    }
    toggleShop();
}

function equip(idx) {
    if (weapons[idx].owned) { currentWeapon = idx; document.getElementById('weaponName').innerText = weapons[idx].name; if (paused) toggleShop(); }
}

function shoot() {
    const currentType = weapons[currentWeapon].type;

    if (currentType === "nuke") {
        if (bomber.active) return;
        let camX = Math.max(0, Math.min(tank.x - canvas.width/2, WORLD_WIDTH - canvas.width));
        bomber = {
            active: true,
            x: camX - 200,
            y: 60,
            speed: 18,
            dropped: false,
            bomb: { active: false, x: 0, y: 0, vy: 0 }
        };
        showDialogue("PILOT: Bomber inbound! Package away in T-minus 3 seconds.");
        return;
    }

    tank.recoil = 12;
    const dir = facingRight ? 1 : -1;
    
    if (currentType === "rocket") {
        const rSfx = document.getElementById('rocketLaunchSfx');
        rSfx.currentTime = 0; rSfx.volume = 0.7; rSfx.play();
    }

    if (currentType === "cluster") {
        projectiles.push({ 
            x: facingRight ? tank.x + tank.w : tank.x, y: tank.y + 15, vx: 6 * dir, vy: -18,
            type: "cluster-main", isCluster: true, dmg: 0 
        });
    } else {
        projectiles.push({ 
            x: facingRight ? tank.x + tank.w : tank.x, y: tank.y + 15, vx: 20 * dir, vy: 0,
            type: currentType, dmg: weapons[currentWeapon].dmg 
        });
    }
}

function update() {
    if (paused || !gameStarted) return;
    document.getElementById('timeVal').innerText = Math.floor((Date.now() - startTime)/1000) + "s";
    document.getElementById('scoreVal').innerText = score;
    document.getElementById('money-ui').innerText = "$" + cash;
    
    sandParticles.forEach(p => { p.x += p.vx; p.y += p.vy; if(p.x < 0) p.x = WORLD_WIDTH; });
    tumbleweeds.forEach(t => { t.x -= t.speed; t.rot -= 0.1; if(t.x < 0) t.x = WORLD_WIDTH; });

    if(movingLeft && tank.x > 0) tank.x -= tank.speed;
    if(movingRight && tank.x < WORLD_WIDTH - tank.w) tank.x += tank.speed;
    updateHeli(helis.green, -50); updateHeli(helis.blue, -150);

    if (bomber.active) {
        bomber.x += bomber.speed;
        if (!bomber.dropped && bomber.x >= tank.x) {
            bomber.dropped = true;
            bomber.bomb.active = true;
            bomber.bomb.x = bomber.x;
            bomber.bomb.y = bomber.y + 20;
            bomber.bomb.vy = 0;
        }

        if (bomber.bomb.active) {
            bomber.bomb.y += bomber.bomb.vy;
            bomber.bomb.vy += 0.5;

            if (bomber.bomb.y >= GROUND_Y) {
                bomber.bomb.active = false;
                const nSfx = document.getElementById('nukeExplosionSfx');
                nSfx.volume = 1.0; nSfx.play();
                
                explosions.push({ 
                    x: bomber.bomb.x, y: GROUND_Y - 150, r: 10, maxR: 2000, 
                    life: 480, isNuke: true 
                });

                buildings.forEach(b => {
                    if (!b.destroyed && Math.abs(b.x - bomber.bomb.x) < 1000) {
                        b.hp -= 2500; b.shake = 50;
                        if (b.hp <= 0) { b.destroyed = true; cash += 500; score += 200; checkVictory(); }
                    }
                });
            }
        }
        if (bomber.x > tank.x + 2000) bomber.active = false;
    }

    humans.forEach(h => {
        h.x += h.speed; if(h.x >= WORLD_WIDTH - 20 || h.x <= 0) h.speed *= -1;
        h.fireTimer++;
        if(h.fireTimer >= h.fireRate) {
            let target = buildings.find(b => !b.destroyed && Math.abs(b.x - h.x) < 800);
            if(target) {
                h.facingRight = target.x > h.x;
                const pDir = h.facingRight ? 1 : -1;
                projectiles.push({ x: h.facingRight ? h.x + 20 : h.x, y: h.y + 10, vx: 12 * pDir, vy: 0, type: h.type, dmg: h.type === 'heavy-rocket' ? 50 : 5 });
                h.fireTimer = 0;
            }
        }
    });

    projectiles.forEach((p, pi) => {
        p.x += p.vx; p.y += (p.vy || 0);
        if(p.type === "cluster-main" || p.type === "cannon") p.vy = (p.vy || 0) + 0.4;

        if (p.isCluster && p.vy >= 0 && p.y <= 120) {
            projectiles.splice(pi, 1);
            for (let i = 0; i < 5; i++) {
                projectiles.push({
                    x: p.x, y: p.y, vx: (p.vx * 1.5) + (i - 2) * 3, vy: 1 + i,
                    type: "cannon", dmg: 25 
                });
            }
        } else {
            if(p.x < 0 || p.x > WORLD_WIDTH) projectiles.splice(pi, 1);
            buildings.forEach(b => {
                if (!b.destroyed && p.type !== "cluster-main" && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) {
                    b.hp -= p.dmg; b.shake = 12;
                    if (p.type !== 'bullet') explosions.push({ x: p.x, y: p.y, r: 5, maxR: p.type === 'heavy-rocket' ? 120 : 50 });
                    for(let i=0; i < 2; i++) zombies.push({ x: b.x + (Math.random()*b.w), y: GROUND_Y - 30, speed: (1.5 + Math.random()) * (Math.random() > 0.5 ? 1 : -1) });
                    projectiles.splice(pi, 1);
                    if (b.hp <= 0) { b.destroyed = true; cash += 500; score += 200; checkVictory(); }
                }
            });
        }
    });

    buildings.forEach(b => { if(b.destroyed && b.h > 15) { b.h -= 2; b.y += 2; } });

    zombies.forEach((z, zi) => {
        z.x -= z.speed;
        if(z.x <= 0 || z.x >= WORLD_WIDTH - 22) z.speed *= -1;
        if (z.x < tank.x + tank.w && z.x > tank.x) {
            for(let i=0; i<6; i++) bloodSplats.push({ x: z.x + (Math.random()-0.5)*40, y: GROUND_Y - 5, r: 4 + Math.random()*10 });
            zombies.splice(zi, 1); cash += 5; score += 10;
        }
    });
}

function updateHeli(h, xOffset) {
    if (!h.active) return;
    const targetX = tank.x + xOffset;
    if (h.x < targetX) h.x += h.speed;
    if (h.x > targetX) h.x -= h.speed;
    h.bladeAngle += 0.5; h.fireTimer++;
    if (h.fireTimer >= h.fireRate) {
        let target = buildings.find(b => !b.destroyed && Math.abs(b.x - h.x) < 1500);
        if(target) {
            h.facingRight = target.x > h.x;
            const angle = Math.atan2((target.y + target.h/2) - (h.y + 20), (target.x + target.w/2) - (h.x + 40));
            projectiles.push({ x: h.x + 40, y: h.y + 20, vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18, type: h.weaponType, dmg: h.weaponType === 'rocket' ? 10 : 5 });
            h.fireTimer = 0;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#fff5e6"; ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 50; ctx.beginPath();
    ctx.arc(canvas.width - 100, 100, 60, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff4400"; ctx.font = "bold 20px Courier New"; ctx.fillText("TEMP: 48°C", canvas.width - 160, 180);

    if (!gameStarted) { requestAnimationFrame(draw); return; }
    
    let camX = Math.max(0, Math.min(tank.x - canvas.width/2, WORLD_WIDTH - canvas.width));
    ctx.save(); ctx.translate(-camX, 0);
    
    ctx.fillStyle = '#9e7b5e'; ctx.fillRect(0, GROUND_Y - 10, WORLD_WIDTH, 10); 
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 40);
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3; ctx.setLineDash([30, 30]);
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 20); ctx.lineTo(WORLD_WIDTH, GROUND_Y + 20); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2d5a27';
    cacti.forEach(c => {
        ctx.fillRect(c.x, GROUND_Y - c.h, 10, c.h);
        ctx.fillRect(c.x - 10, GROUND_Y - c.h + 10, 20, 5);
    });
    ctx.fillStyle = '#5d4037';
    tumbleweeds.forEach(t => {
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot);
        ctx.strokeRect(-t.r, -t.r, t.r*2, t.r*2); ctx.restore();
    });

    bloodSplats.forEach(s => { ctx.fillStyle = 'rgba(200, 0, 0, 0.6)'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); });
    
    buildings.forEach(b => {
        ctx.save();
        if (!b.destroyed && b.shake > 0) { ctx.translate((Math.random()-0.5)*b.shake, 0); b.shake *= 0.8; }
        ctx.fillStyle = b.destroyed ? '#2d1b0d' : b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if(!b.destroyed) {
            ctx.strokeStyle = '#4a3728'; ctx.strokeRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = '#111'; for(let c=0; c<4; c++) ctx.fillRect(b.x + 20 + (c*60), b.y + 40, 40, 15);
            ctx.fillStyle = b.hp > 500 ? '#0f0' : '#f00'; ctx.fillRect(b.x, b.y-25, b.w*(b.hp/b.maxHp), 12);
        }
        ctx.restore();
    });

    humans.forEach(h => {
        ctx.save(); ctx.translate(h.x + 10, h.y + 17); if(!h.facingRight) ctx.scale(-1, 1);
        ctx.fillStyle = h.color; ctx.fillRect(-10, -17, 20, 35);
        ctx.fillStyle = h.weaponColor; ctx.fillRect(0, -7, 25, 6); ctx.restore();
    });

    drawHeli(helis.green); drawHeli(helis.blue);

    ctx.save(); ctx.translate(tank.x + tank.w/2, tank.y + tank.h/2);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.fillStyle = '#000'; ctx.fillRect(-tank.w/2, 10, tank.w, 15);
    ctx.fillStyle = '#333'; for(let i=-35; i<=35; i+=18) { ctx.beginPath(); ctx.arc(i, 18, 7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#556b2f'; ctx.fillRect(-tank.w/2 + 5, -15, tank.w - 10, 25);
    ctx.fillStyle = '#6b8e23'; ctx.fillRect(-20, -30, 40, 20);
    ctx.fillStyle = '#1a2b14'; ctx.fillRect(15 - tank.recoil, -25, 45, 10);
    ctx.restore();
    if(tank.recoil > 0) tank.recoil -= 1;

    projectiles.forEach(p => {
        if(p.type === 'cluster-main') {
            ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = (p.type === 'rocket' || p.type === 'heavy-rocket') ? 'red' : (p.type === 'cannon' ? '#000' : '#ffd700');
            ctx.fillRect(p.x, p.y, 12, 6);
        }
    });

    if (bomber.active) {
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(bomber.x, bomber.y);
        ctx.lineTo(bomber.x - 70, bomber.y - 20);
        ctx.lineTo(bomber.x - 70, bomber.y + 20);
        ctx.closePath();
        ctx.fill();
        
        if (bomber.bomb.active) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(bomber.bomb.x, bomber.bomb.y, 18, 10, Math.PI/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#006400';
            ctx.fillRect(bomber.bomb.x - 8, bomber.bomb.y - 15, 16, 5);
        }
    }

    explosions.forEach((ex, ei) => {
        if (ex.isNuke) {
            if (ex.r < ex.maxR) ex.r += 25; 
            let alpha = ex.life / 480;
            ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
            ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2); ctx.fill();
            if (ex.life > 420) {
                ctx.fillStyle = `rgba(255, 255, 255, ${(ex.life - 420) / 60})`;
                ctx.fillRect(camX, 0, canvas.width, canvas.height);
            }
            ex.life--; if (ex.life <= 0) explosions.splice(ei, 1);
        } else {
            ctx.fillStyle = `rgba(255, ${Math.floor(165 * (1 - ex.r/ex.maxR))}, 0, ${1 - ex.r/ex.maxR})`;
            ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2); ctx.fill();
            ex.r += 5; if (ex.r > ex.maxR) explosions.splice(ei, 1);
        }
    });

    zombies.forEach(z => {
        ctx.fillStyle = '#4e7a4e'; ctx.fillRect(z.x, z.y, 22, 32);
        ctx.fillStyle = 'blue'; ctx.fillRect(z.x, z.y+20, 22, 12);
        ctx.fillStyle = 'red'; ctx.fillRect(z.x + (z.speed > 0 ? 0 : 16), z.y+5, 4, 4);
    });

    ctx.restore(); 

    ctx.fillStyle = 'rgba(210, 180, 140, 0.4)';
    sandParticles.forEach(p => { ctx.beginPath(); ctx.arc(p.x % canvas.width, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });

    update(); requestAnimationFrame(draw);
}

function drawHeli(h) {
    if (!h.active) return;
    ctx.save(); ctx.translate(h.x, h.y); if(!h.facingRight) ctx.scale(-1, 1);
    ctx.fillStyle = h.tailColor; ctx.fillRect(-20, 10, 40, 8);
    ctx.fillStyle = h.color; ctx.beginPath(); ctx.ellipse(30, 15, 40, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; const bladeW = Math.cos(h.bladeAngle) * 80; ctx.fillRect(30 - bladeW/2, -5, bladeW, 4);
    ctx.restore();
}

draw();