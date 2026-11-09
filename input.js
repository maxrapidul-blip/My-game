const setup = (id, start, end) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => { e.preventDefault(); start(); });
    el.addEventListener('touchend', e => { e.preventDefault(); end(); });
    el.addEventListener('mousedown', e => { e.preventDefault(); start(); });
    el.addEventListener('mouseup', e => { e.preventDefault(); end(); });
};

setup('leftBtn', () => { if(!paused) movingLeft = true; facingRight = false; }, () => movingLeft = false);
setup('rightBtn', () => { if(!paused) movingRight = true; facingRight = true; }, () => movingRight = false);
setup('fireBtn', () => { if(!paused) shoot(); }, () => {});

window.addEventListener('keydown', e => {
    if (!gameStarted) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (!paused) movingLeft = true;
        facingRight = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (!paused) movingRight = true;
        facingRight = true;
    }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (!paused) {
            e.preventDefault();
            shoot();
        }
    }
    if (e.key === 'e' || e.key === 'E') {
        toggleShop();
    }
});

window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movingLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movingRight = false;
});

canvas.addEventListener('click', e => {
    if (!paused && gameStarted) shoot();
});