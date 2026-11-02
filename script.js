function copySecretCode(btn) {
            const temp = document.createElement('textarea');
            temp.value = '< THE MORNING MOON >';
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            btn.innerText = 'COPIED!';
            setTimeout(() => { btn.innerText = 'COPY CODE'; }, 2000);
        }

        // ==========================================
        // 1. DATA & STATE MANAGEMENT
        // ==========================================
        const levelData = [
            { id: 1, title: "Wood Chopper", desc: "Click the wood block 15 times fast!" },
            { id: 2, title: "Zombie Dodger", desc: "Avoid the bouncing red square for 10s. (Mouse)" },
            { id: 3, title: "Crafting Sequence", desc: "Memorize & repeat the 4-block pattern." },
            { id: 4, title: "Tiny Maze", desc: "Use Arrow Keys to reach the green exit." },
            { id: 5, title: "Apple Catcher", desc: "Move mouse to catch 5 falling apples." },
            { id: 6, title: "Speed Typing", desc: "Type 'Prarthana is the best' in 8 seconds." },
            { id: 7, title: "Creeper Whack", desc: "Whack 8 creepers before time runs out! (15s)" },
            { id: 8, title: "Lava Jump", desc: "Press Space to jump over 5 lava blocks." },
            { id: 9, title: "Minecart Runner", desc: "Up/Down arrows to dodge obstacles for 15s." },
            { id: 10, title: "Diamond Hunt", desc: "Find and click the 1 shiny blue diamond." },
            { id: 11, title: "Block Match", desc: "Match 4 pairs of blocks quickly." },
            { id: 12, title: "Final Boss", desc: "Spam click the boss 50 times in 12 seconds!" }
        ];

        const gameSystem = {
            unlockedLevel: 1,
            currentLevel: null,
            loopId: null,
            timerId: null,
            gameState: {},
            
            init() {
                const saved = localStorage.getItem('prarthanaArcadeProgress');
                if (saved) {
                    this.unlockedLevel = parseInt(saved);
                }
                ui.buildLevelGrid();
                
                // Volume default
                const bgm = document.getElementById('bgm');
                if(bgm) bgm.volume = 0.4;
            },

            saveProgress(levelBeaten) {
                if (levelBeaten >= this.unlockedLevel && levelBeaten < 12) {
                    this.unlockedLevel = levelBeaten + 1;
                    localStorage.setItem('prarthanaArcadeProgress', this.unlockedLevel);
                    ui.buildLevelGrid();
                }
            },

            resetProgress() {
                this.unlockedLevel = 1;
                localStorage.removeItem('prarthanaArcadeProgress');
                ui.buildLevelGrid();
            },

            startLevel(levelId) {
                this.currentLevel = levelId;
                ui.showScreen('screen-game');
                ui.setupGameUI(levelId);
                this.cleanup();
                
                // Show prep overlay
                ui.showOverlay(`Level ${levelId}: ${levelData[levelId-1].title}`, "START", () => {
                    this.runMiniGame(levelId);
                });
            },

            cleanup() {
                if (this.loopId) cancelAnimationFrame(this.loopId);
                if (this.timerId) clearInterval(this.timerId);
                document.onkeydown = null;
                document.onkeyup = null;
                document.onmousemove = null;
                document.onmousedown = null;
                
                const dom = document.getElementById('dom-game-area');
                dom.innerHTML = '';
                dom.classList.add('hidden');
                
                const cvs = document.getElementById('game-canvas');
                cvs.classList.add('hidden');
                const ctx = cvs.getContext('2d');
                ctx.clearRect(0,0, cvs.width, cvs.height);

                this.gameState = {};
            },

            quitToMenu() {
                this.cleanup();
                ui.showScreen('screen-level-select');
            },

            winLevel() {
                this.cleanup();
                if (this.currentLevel === 12) {
                    ui.showScreen('screen-ending');
                } else {
                    this.saveProgress(this.currentLevel);
                    ui.showOverlay("LEVEL CLEARED!", "NEXT LEVEL", () => {
                        this.startLevel(this.currentLevel + 1);
                    });
                }
            },

            loseLevel(reason = "GAME OVER") {
                this.cleanup();
                ui.showOverlay(reason, "RETRY", () => {
                    this.startLevel(this.currentLevel);
                });
            },

            runMiniGame(id) {
                switch(id) {
                    case 1: games.woodChopper(); break;
                    case 2: games.zombieDodger(); break;
                    case 3: games.craftingSequence(); break;
                    case 4: games.tinyMaze(); break;
                    case 5: games.appleCatcher(); break;
                    case 6: games.speedTyping(); break;
                    case 7: games.creeperWhack(); break;
                    case 8: games.lavaJump(); break;
                    case 9: games.minecartRunner(); break;
                    case 10: games.diamondHunt(); break;
                    case 11: games.blockMatch(); break;
                    case 12: games.finalBoss(); break;
                }
            }
        };

        // ==========================================
        // 2. UI MANAGEMENT
        // ==========================================
        const ui = {
            screens: ['screen-menu', 'screen-level-select', 'screen-game', 'screen-ending'],
            
            showScreen(id) {
                this.screens.forEach(s => {
                    document.getElementById(s).classList.add('hidden');
                });
                document.getElementById(id).classList.remove('hidden');
            },

            buildLevelGrid() {
                const grid = document.getElementById('level-grid');
                grid.innerHTML = '';
                levelData.forEach(lvl => {
                    const btn = document.createElement('button');
                    const isUnlocked = lvl.id <= gameSystem.unlockedLevel;
                    
                    btn.className = `pixel-btn w-full h-24 flex flex-col items-center justify-center text-white ${isUnlocked ? 'bg-green-800 hover:bg-green-700' : 'bg-gray-800'}`;
                    btn.disabled = !isUnlocked;
                    
                    btn.innerHTML = `
                        <span class="text-xl mb-2">${lvl.id}</span>
                        <span class="text-[10px] uppercase text-center px-1">${isUnlocked ? lvl.title : 'LOCKED'}</span>
                    `;
                    
                    if (isUnlocked) {
                        btn.onclick = () => gameSystem.startLevel(lvl.id);
                    }
                    grid.appendChild(btn);
                });
            },

            setupGameUI(id) {
                const data = levelData[id-1];
                document.getElementById('game-title').innerText = `Lvl ${id}: ${data.title}`;
                document.getElementById('game-timer').classList.add('hidden');
                document.getElementById('game-score').classList.add('hidden');
                document.getElementById('game-overlay').classList.add('hidden');
            },

            showOverlay(msg, btnText, callback) {
                const overlay = document.getElementById('game-overlay');
                const msgEl = document.getElementById('overlay-msg');
                const btnEl = document.getElementById('overlay-btn');
                
                overlay.classList.remove('hidden');
                msgEl.innerText = msg;
                
                if (btnText) {
                    btnEl.classList.remove('hidden');
                    btnEl.innerText = btnText;
                    btnEl.onclick = () => {
                        overlay.classList.add('hidden');
                        if (callback) callback();
                    };
                } else {
                    btnEl.classList.add('hidden');
                }
            },

            updateTimer(val) {
                const el = document.getElementById('game-timer');
                el.classList.remove('hidden');
                el.innerText = `Time: ${val}s`;
            },

            updateScore(val, max) {
                const el = document.getElementById('game-score');
                el.classList.remove('hidden');
                el.innerText = max ? `Score: ${val}/${max}` : `Score: ${val}`;
            }
        };

        // ==========================================
        // 3. MINI-GAMES LOGIC
        // ==========================================
        const games = {
            
            // Helper to prep DOM
            getDOM() {
                const dom = document.getElementById('dom-game-area');
                dom.classList.remove('hidden');
                dom.innerHTML = '';
                return dom;
            },

            // Helper to prep Canvas
            getCanvas() {
                const cvs = document.getElementById('game-canvas');
                cvs.classList.remove('hidden');
                return { cvs, ctx: cvs.getContext('2d') };
            },

            // 1. Wood Chopper
            woodChopper() {
                const dom = this.getDOM();
                let clicks = 0;
                const target = 15;
                
                const block = document.createElement('div');
                block.className = 'w-32 h-32 bg-amber-900 border-4 border-amber-950 flex items-center justify-center cursor-pointer pixel-btn active:scale-90 transition-transform';
                block.innerHTML = '<span class="text-white text-xs">CHOP ME</span>';
                
                ui.updateScore(clicks, target);

                block.onmousedown = () => {
                    clicks++;
                    ui.updateScore(clicks, target);
                    if (clicks >= target) gameSystem.winLevel();
                };
                
                dom.appendChild(block);
            },

            // 2. Zombie Dodger
            zombieDodger() {
                const {cvs, ctx} = this.getCanvas();
                let time = 10;
                let mouseX = cvs.width/2;
                let mouseY = cvs.height/2;
                
                const enemy = { x: 50, y: 50, size: 30, vx: 5, vy: 5 };
                const playerSize = 20;

                ui.updateTimer(time);
                gameSystem.timerId = setInterval(() => {
                    time--;
                    ui.updateTimer(time);
                    if (time <= 0) {
                        gameSystem.winLevel();
                    }
                }, 1000);

                document.onmousemove = (e) => {
                    const rect = cvs.getBoundingClientRect();
                    mouseX = e.clientX - rect.left;
                    mouseY = e.clientY - rect.top;
                };

                const loop = () => {
                    ctx.clearRect(0,0,cvs.width,cvs.height);
                    
                    // Update enemy
                    enemy.x += enemy.vx;
                    enemy.y += enemy.vy;
                    if(enemy.x <= 0 || enemy.x + enemy.size >= cvs.width) enemy.vx *= -1.05; // Gets slightly faster
                    if(enemy.y <= 0 || enemy.y + enemy.size >= cvs.height) enemy.vy *= -1.05;

                    // Draw Enemy (Zombie)
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
                    
                    // Draw Player
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(mouseX - playerSize/2, mouseY - playerSize/2, playerSize, playerSize);

                    // AABB Collision
                    if (
                        mouseX - playerSize/2 < enemy.x + enemy.size &&
                        mouseX + playerSize/2 > enemy.x &&
                        mouseY - playerSize/2 < enemy.y + enemy.size &&
                        mouseY + playerSize/2 > enemy.y
                    ) {
                        gameSystem.loseLevel("BITTEN BY ZOMBIE!");
                        return;
                    }

                    if (time > 0) gameSystem.loopId = requestAnimationFrame(loop);
                };
                loop();
            },

            // 3. Crafting Sequence (Simon Says)
            craftingSequence() {
                const dom = this.getDOM();
                const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
                let sequence = [];
                let playerStep = 0;

                // Create blocks
                const container = document.createElement('div');
                container.className = 'grid grid-cols-2 gap-4';
                const blocks = colors.map((col, i) => {
                    const b = document.createElement('div');
                    b.className = `w-24 h-24 ${col} border-4 border-white simon-block cursor-pointer`;
                    b.dataset.idx = i;
                    container.appendChild(b);
                    return b;
                });
                dom.appendChild(container);

                const playSequence = async () => {
                    playerStep = 0;
                    sequence.push(Math.floor(Math.random() * 4));
                    
                    // Disable clicking while showing
                    blocks.forEach(b => b.style.pointerEvents = 'none');
                    
                    await new Promise(r => setTimeout(r, 1000));
                    
                    for (let idx of sequence) {
                        blocks[idx].classList.add('active');
                        await new Promise(r => setTimeout(r, 500));
                        blocks[idx].classList.remove('active');
                        await new Promise(r => setTimeout(r, 200));
                    }
                    // Enable clicking
                    blocks.forEach(b => b.style.pointerEvents = 'auto');
                };

                blocks.forEach(b => {
                    b.onmousedown = () => {
                        b.classList.add('active');
                        setTimeout(() => b.classList.remove('active'), 200);
                        
                        if (parseInt(b.dataset.idx) === sequence[playerStep]) {
                            playerStep++;
                            if (playerStep === sequence.length) {
                                if (sequence.length >= 4) {
                                    setTimeout(() => gameSystem.winLevel(), 500);
                                } else {
                                    playSequence();
                                }
                            }
                        } else {
                            gameSystem.loseLevel("WRONG PATTERN!");
                        }
                    };
                });

                playSequence();
            },

            // 4. Tiny Maze
            tinyMaze() {
                const {cvs, ctx} = this.getCanvas();
                const tileSize = 40;
                // 1=wall, 0=path, 2=start, 3=end
                const map = [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,3,1],
                    [1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1],
                    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
                    [1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
                    [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
                    [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ];
                
                let player = { c: 1, r: 1 }; // Col, Row

                const draw = () => {
                    ctx.clearRect(0,0,cvs.width,cvs.height);
                    for(let r=0; r<map.length; r++) {
                        for(let c=0; c<map[r].length; c++) {
                            if(map[r][c] === 1) ctx.fillStyle = '#696969'; // wall
                            else if(map[r][c] === 3) ctx.fillStyle = '#00FF00'; // exit
                            else ctx.fillStyle = '#222'; // floor
                            
                            ctx.fillRect(c*tileSize, r*tileSize, tileSize, tileSize);
                            ctx.strokeStyle = '#111';
                            ctx.strokeRect(c*tileSize, r*tileSize, tileSize, tileSize);
                        }
                    }
                    // Player
                    ctx.fillStyle = '#00FFFF';
                    ctx.fillRect(player.c*tileSize+5, player.r*tileSize+5, tileSize-10, tileSize-10);
                };

                document.onkeydown = (e) => {
                    let nextC = player.c;
                    let nextR = player.r;
                    if(e.key === 'ArrowUp') nextR--;
                    if(e.key === 'ArrowDown') nextR++;
                    if(e.key === 'ArrowLeft') nextC--;
                    if(e.key === 'ArrowRight') nextC++;

                    if(map[nextR][nextC] !== 1) {
                        player.c = nextC;
                        player.r = nextR;
                    }
                    draw();
                    
                    if(map[player.r][player.c] === 3) {
                        document.onkeydown = null;
                        gameSystem.winLevel();
                    }
                };
                draw();
            },

            // 5. Apple Catcher
            appleCatcher() {
                const {cvs, ctx} = this.getCanvas();
                let mouseX = cvs.width/2;
                const paddle = { w: 100, h: 20, y: cvs.height - 30 };
                let apples = [];
                let caught = 0;
                let missed = 0;
                const target = 5;
                
                ui.updateScore(caught, target);

                document.onmousemove = (e) => {
                    const rect = cvs.getBoundingClientRect();
                    mouseX = e.clientX - rect.left;
                };

                const loop = () => {
                    ctx.clearRect(0,0,cvs.width,cvs.height);
                    
                    // Spawn apples
                    if(Math.random() < 0.02) {
                        apples.push({ x: Math.random()*(cvs.width-20), y: -20, size: 20 });
                    }

                    // Paddle limits
                    let px = mouseX - paddle.w/2;
                    if(px < 0) px = 0;
                    if(px + paddle.w > cvs.width) px = cvs.width - paddle.w;

                    // Draw Paddle
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(px, paddle.y, paddle.w, paddle.h);

                    // Update & Draw Apples
                    for (let i = apples.length - 1; i >= 0; i--) {
                        let a = apples[i];
                        a.y += 4;
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(a.x, a.y, a.size, a.size);

                        // Catch check
                        if (a.y + a.size > paddle.y && a.y < paddle.y + paddle.h &&
                            a.x + a.size > px && a.x < px + paddle.w) {
                            caught++;
                            apples.splice(i, 1);
                            ui.updateScore(caught, target);
                            if (caught >= target) {
                                gameSystem.winLevel();
                                return;
                            }
                        } else if (a.y > cvs.height) {
                            missed++;
                            apples.splice(i, 1);
                            if(missed >= 3) {
                                gameSystem.loseLevel("DROPPED TOO MANY!");
                                return;
                            }
                        }
                    }
                    gameSystem.loopId = requestAnimationFrame(loop);
                };
                loop();
            },

            // 6. Speed Typing
            speedTyping() {
                const dom = this.getDOM();
                const targetText = "Prarthana is the best";
                let time = 8;
                
                const container = document.createElement('div');
                container.className = 'flex flex-col items-center';
                
                const textDisp = document.createElement('div');
                textDisp.className = 'text-2xl text-yellow-300 mb-6';
                textDisp.innerText = targetText;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'bg-gray-800 border-4 border-white text-white p-4 w-96 text-center text-xl focus:outline-none';
                input.autocomplete = "off";
                
                container.appendChild(textDisp);
                container.appendChild(input);
                dom.appendChild(container);
                
                setTimeout(() => input.focus(), 100);

                ui.updateTimer(time);
                gameSystem.timerId = setInterval(() => {
                    time--;
                    ui.updateTimer(time);
                    if (time <= 0) gameSystem.loseLevel("TOO SLOW!");
                }, 1000);

                input.onkeyup = () => {
                    if (input.value === targetText) {
                        gameSystem.winLevel();
                    }
                };
            },

            // 7. Creeper Whack
            creeperWhack() {
                const dom = this.getDOM();
                let score = 0;
                const target = 8;
                let time = 15;
                
                ui.updateScore(score, target);
                ui.updateTimer(time);

                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-4 gap-4 w-[400px] h-[400px] bg-green-900 p-4 border-4 border-green-950';
                
                const cells = [];
                for(let i=0; i<16; i++) {
                    const c = document.createElement('div');
                    c.className = 'w-full h-full bg-green-800 cursor-pointer flex items-center justify-center';
                    
                    c.onmousedown = () => {
                        if(c.classList.contains('creeper')) {
                            c.classList.remove('creeper');
                            score++;
                            ui.updateScore(score, target);
                            if(score >= target) gameSystem.winLevel();
                        }
                    };
                    grid.appendChild(c);
                    cells.push(c);
                }
                dom.appendChild(grid);

                // Timer
                gameSystem.timerId = setInterval(() => {
                    time--;
                    ui.updateTimer(time);
                    if(time <= 0 && score < target) gameSystem.loseLevel("BOOM!");
                }, 1000);

                // Spawner loop
                const spawn = () => {
                    if (score >= target || time <= 0) return;
                    
                    cells.forEach(c => c.classList.remove('creeper'));
                    const numSpawn = Math.floor(Math.random() * 2) + 1;
                    
                    for(let i=0; i<numSpawn; i++) {
                        const idx = Math.floor(Math.random() * 16);
                        cells[idx].classList.add('creeper');
                    }
                    setTimeout(spawn, 800);
                };
                spawn();
            },

            // 8. Lava Jump
            lavaJump() {
                const {cvs, ctx} = this.getCanvas();
                let player = { x: 50, y: cvs.height - 40, w: 30, h: 30, vy: 0, grounded: true };
                let gravity = 0.8;
                let jumpForce = -15;
                let obstacles = [];
                let frames = 0;
                let score = 0;
                const target = 5;

                ui.updateScore(score, target);

                document.onkeydown = (e) => {
                    if(e.code === 'Space' && player.grounded) {
                        player.vy = jumpForce;
                        player.grounded = false;
                    }
                };

                const loop = () => {
                    ctx.clearRect(0,0,cvs.width,cvs.height);
                    
                    // Player physics
                    player.vy += gravity;
                    player.y += player.vy;
                    if(player.y >= cvs.height - 40) {
                        player.y = cvs.height - 40;
                        player.grounded = true;
                        player.vy = 0;
                    }

                    // Floor
                    ctx.fillStyle = '#333';
                    ctx.fillRect(0, cvs.height-10, cvs.width, 10);

                    // Draw Player
                    ctx.fillStyle = '#00FFFF';
                    ctx.fillRect(player.x, player.y, player.w, player.h);

                    // Obstacles
                    if(frames % 100 === 0) {
                        obstacles.push({ x: cvs.width, y: cvs.height - 40, w: 30, h: 30, passed: false });
                    }
                    
                    for(let i=obstacles.length-1; i>=0; i--) {
                        let obs = obstacles[i];
                        obs.x -= 6;
                        
                        ctx.fillStyle = '#CF1020'; // Lava
                        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

                        // Collision
                        if(player.x < obs.x + obs.w && player.x + player.w > obs.x &&
                           player.y < obs.y + obs.h && player.y + player.h > obs.y) {
                            gameSystem.loseLevel("FELL IN LAVA!");
                            return;
                        }

                        // Score
                        if(obs.x + obs.w < player.x && !obs.passed) {
                            obs.passed = true;
                            score++;
                            ui.updateScore(score, target);
                            if(score >= target) {
                                gameSystem.winLevel();
                                return;
                            }
                        }

                        if(obs.x + obs.w < 0) obstacles.splice(i, 1);
                    }

                    frames++;
                    gameSystem.loopId = requestAnimationFrame(loop);
                };
                loop();
            },

            // 9. Minecart Runner
            minecartRunner() {
                const {cvs, ctx} = this.getCanvas();
                const lanes = [100, 250, 400]; // Y centers
                let currentLane = 1;
                let player = { w: 60, h: 40 };
                let obstacles = [];
                let time = 15;
                let frames = 0;

                ui.updateTimer(time);
                gameSystem.timerId = setInterval(() => {
                    time--;
                    ui.updateTimer(time);
                    if(time <= 0) gameSystem.winLevel();
                }, 1000);

                document.onkeydown = (e) => {
                    if (e.key === 'ArrowUp' && currentLane > 0) currentLane--;
                    if (e.key === 'ArrowDown' && currentLane < 2) currentLane++;
                };

                const loop = () => {
                    ctx.clearRect(0,0,cvs.width,cvs.height);
                    
                    // Draw Lanes
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 2;
                    lanes.forEach(y => {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cvs.width, y); ctx.stroke();
                    });

                    // Draw Player (Minecart)
                    ctx.fillStyle = '#888';
                    const py = lanes[currentLane] - player.h/2;
                    ctx.fillRect(50, py, player.w, player.h);

                    // Obstacles
                    if(frames % 40 === 0) { // Spawn rate
                        const laneIdx = Math.floor(Math.random()*3);
                        obstacles.push({ x: cvs.width, lane: laneIdx, w: 40, h: 40 });
                    }

                    for(let i=obstacles.length-1; i>=0; i--) {
                        let obs = obstacles[i];
                        obs.x -= 8; // speed
                        
                        const oy = lanes[obs.lane] - obs.h/2;
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(obs.x, oy, obs.w, obs.h);

                        // Collision
                        if(obs.lane === currentLane) {
                            if(50 < obs.x + obs.w && 50 + player.w > obs.x) {
                                gameSystem.loseLevel("CRASHED!");
                                return;
                            }
                        }

                        if(obs.x + obs.w < 0) obstacles.splice(i, 1);
                    }

                    frames++;
                    if(time > 0) gameSystem.loopId = requestAnimationFrame(loop);
                };
                loop();
            },

            // 10. Diamond Hunt
            diamondHunt() {
                const dom = this.getDOM();
                const total = 48; // 6x8 grid
                const targetIdx = Math.floor(Math.random() * total);
                
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-8 gap-2 bg-gray-800 p-4 border-4 border-gray-600';
                
                for(let i=0; i<total; i++) {
                    const block = document.createElement('div');
                    block.className = 'w-10 h-10 bg-gray-500 hover:bg-gray-400 cursor-pointer border-2 border-gray-400 pixel-btn';
                    
                    if(i === targetIdx) {
                        // Secretly slightly different or triggers win on click
                        block.onmousedown = () => {
                            block.style.backgroundColor = '#00FFFF'; // reveal diamond
                            setTimeout(() => gameSystem.winLevel(), 500);
                        };
                    } else {
                        block.onmousedown = () => {
                            block.style.backgroundColor = '#333';
                        };
                    }
                    grid.appendChild(block);
                }
                dom.appendChild(grid);
            },

            // 11. Block Match
            blockMatch() {
                const dom = this.getDOM();
                const icons = ['★', '♦', '♥', '♣'];
                let deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
                
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-4 gap-4';
                
                let flipped = [];
                let matched = 0;
                let locked = false;

                deck.forEach((icon, i) => {
                    const card = document.createElement('div');
                    card.className = 'w-20 h-24 memory-card';
                    card.dataset.val = icon;
                    
                    card.onclick = () => {
                        if(locked || card.classList.contains('flipped')) return;
                        
                        card.classList.add('flipped');
                        card.innerText = icon;
                        flipped.push(card);

                        if(flipped.length === 2) {
                            locked = true;
                            if(flipped[0].dataset.val === flipped[1].dataset.val) {
                                matched++;
                                flipped = [];
                                locked = false;
                                if(matched === 4) setTimeout(() => gameSystem.winLevel(), 500);
                            } else {
                                setTimeout(() => {
                                    flipped[0].classList.remove('flipped');
                                    flipped[0].innerText = '';
                                    flipped[1].classList.remove('flipped');
                                    flipped[1].innerText = '';
                                    flipped = [];
                                    locked = false;
                                }, 800);
                            }
                        }
                    };
                    grid.appendChild(card);
                });
                
                dom.appendChild(grid);
            },

            // 12. Final Boss
            finalBoss() {
                const dom = this.getDOM();
                let hp = 50;
                let time = 12;
                
                ui.updateTimer(time);
                gameSystem.timerId = setInterval(() => {
                    time--;
                    ui.updateTimer(time);
                    if(time <= 0 && hp > 0) gameSystem.loseLevel("BOSS DEFEATED YOU!");
                }, 1000);

                const container = document.createElement('div');
                container.className = 'flex flex-col items-center relative';

                // HP Bar container
                const hpBarBg = document.createElement('div');
                hpBarBg.className = 'w-64 h-8 bg-gray-800 border-2 border-white mb-8 relative';
                
                const hpBarFill = document.createElement('div');
                hpBarFill.className = 'h-full bg-red-600 transition-all';
                hpBarFill.style.width = '100%';
                
                hpBarBg.appendChild(hpBarFill);
                
                // Boss Block (Big)
                const boss = document.createElement('div');
                boss.className = 'w-48 h-48 bg-purple-900 border-8 border-purple-950 flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 transition-transform shadow-2xl';
                boss.innerHTML = `
                    <div class="flex gap-4 mb-4">
                        <div class="w-8 h-8 bg-red-500"></div>
                        <div class="w-8 h-8 bg-red-500"></div>
                    </div>
                    <div class="w-24 h-4 bg-black"></div>
                `; // face

                boss.onmousedown = () => {
                    if (time <= 0 || hp <= 0) return;
                    hp--;
                    const pct = (hp / 50) * 100;
                    hpBarFill.style.width = `${pct}%`;
                    
                    // shake effect
                    boss.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px) scale(0.95)`;
                    setTimeout(() => boss.style.transform = 'translate(0,0) scale(1)', 50);

                    if (hp <= 0) {
                        clearInterval(gameSystem.timerId);
                        boss.style.backgroundColor = 'white';
                        setTimeout(() => gameSystem.winLevel(), 1000);
                    }
                };

                container.appendChild(hpBarBg);
                container.appendChild(boss);
                dom.appendChild(container);
            }
        };

        // Initialize on load
        window.onload = () => {
            gameSystem.init();
        };
