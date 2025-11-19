import{S as d,b as c,k as b,l as S,D as T,P as C,C as A,A as N,G as H}from"./card-C2833Rz7.js";class M{constructor(){this.deferredPrompt=null,this.installBanner=null,this.init()}init(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),this.deferredPrompt=e,console.log("PWA install prompt captured"),this.checkShouldShowPrompt()}),window.addEventListener("appinstalled",()=>{console.log("PWA installed successfully"),this.markAsInstalled(),this.hidePrompt()}),this.createBannerUI()}checkShouldShowPrompt(){if(this.isAlreadyInstalled()){console.log("App already installed, skipping prompt");return}if(this.wasRecentlyDismissed()){console.log("User dismissed prompt recently, skipping");return}const e=this.getGamesPlayed();console.log(`Games played: ${e}`),e>=2&&setTimeout(()=>{this.showPrompt()},2e3)}getGamesPlayed(){return parseInt(localStorage.getItem("gamesPlayed")||"0",10)}static incrementGamesPlayed(){const e=parseInt(localStorage.getItem("gamesPlayed")||"0",10);localStorage.setItem("gamesPlayed",(e+1).toString()),console.log(`Games played: ${e+1}`)}isAlreadyInstalled(){return window.matchMedia("(display-mode: standalone)").matches?!0:localStorage.getItem("appInstalled")==="true"}wasRecentlyDismissed(){const e=localStorage.getItem("installPromptDismissedAt");if(!e)return!1;const t=parseInt(e,10),s=7*24*60*60*1e3;return Date.now()-t<s}markAsInstalled(){localStorage.setItem("appInstalled","true")}createBannerUI(){this.installBanner=document.createElement("div"),this.installBanner.id="install-banner",this.installBanner.className="install-banner",this.installBanner.style.display="none",this.installBanner.innerHTML=`
            <div class="install-banner__content">
                <div class="install-banner__icon">
                    <svg width="48" height="48" viewBox="0 0 64 64">
                        <rect x="4" y="4" width="56" height="56" rx="12" fill="#0c6d3a"/>
                        <rect x="15" y="15" width="34" height="34" rx="6" fill="rgba(4, 24, 14, 0.65)" stroke="#f5fbf7" stroke-width="2"/>
                        <rect x="19" y="19" width="26" height="26" rx="4" fill="#ffd166"/>
                    </svg>
                </div>
                <div class="install-banner__text">
                    <h3 class="install-banner__title">Install Mahjong</h3>
                    <p class="install-banner__message">Add to home screen for quick access</p>
                </div>
                <div class="install-banner__actions">
                    <button class="install-banner__btn install-banner__btn--install" id="install-btn">
                        Install
                    </button>
                    <button class="install-banner__btn install-banner__btn--dismiss" id="dismiss-btn">
                        Not Now
                    </button>
                </div>
            </div>
        `,document.body.appendChild(this.installBanner);const e=this.installBanner.querySelector("#install-btn"),t=this.installBanner.querySelector("#dismiss-btn");e.addEventListener("click",()=>this.handleInstall()),t.addEventListener("click",()=>this.handleDismiss()),this.injectStyles()}injectStyles(){const e=document.createElement("style");e.textContent=`
            .install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(4, 36, 21, 0.98), rgba(4, 36, 21, 0.95));
                backdrop-filter: blur(10px);
                border-top: 2px solid #ffd166;
                padding: 16px;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                animation: slideUp 0.3s ease-out;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            .install-banner__content {
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 600px;
                margin: 0 auto;
            }

            .install-banner__icon {
                flex-shrink: 0;
            }

            .install-banner__text {
                flex: 1;
                min-width: 0;
            }

            .install-banner__title {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #f5fbf7;
                font-family: 'Courier New', monospace;
            }

            .install-banner__message {
                margin: 4px 0 0;
                font-size: 13px;
                color: rgba(245, 251, 247, 0.8);
                font-family: 'Courier New', monospace;
            }

            .install-banner__actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex-shrink: 0;
            }

            .install-banner__btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                font-family: 'Courier New', monospace;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 100px;
            }

            .install-banner__btn--install {
                background: #ffd166;
                color: #1f1400;
            }

            .install-banner__btn--install:hover {
                background: #ffda7a;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(255, 209, 102, 0.4);
            }

            .install-banner__btn--dismiss {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(245, 251, 247, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .install-banner__btn--dismiss:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            /* Mobile responsive */
            @media (max-width: 480px) {
                .install-banner__content {
                    flex-wrap: wrap;
                }

                .install-banner__actions {
                    flex-direction: row;
                    width: 100%;
                    margin-top: 8px;
                }

                .install-banner__btn {
                    flex: 1;
                }
            }
        `,document.head.appendChild(e)}showPrompt(){if(!this.deferredPrompt){console.log("No deferred prompt available");return}this.installBanner.style.display="block",console.log("Install banner shown")}hidePrompt(){this.installBanner&&(this.installBanner.style.display="none")}async handleInstall(){if(!this.deferredPrompt){console.error("No deferred prompt available");return}this.deferredPrompt.prompt();const{outcome:e}=await this.deferredPrompt.userChoice;console.log(`Install prompt outcome: ${e}`),e==="accepted"?(console.log("User accepted install"),this.markAsInstalled()):(console.log("User dismissed install"),this.handleDismiss()),this.deferredPrompt=null,this.hidePrompt()}handleDismiss(){localStorage.setItem("installPromptDismissedAt",Date.now().toString()),console.log("Install prompt dismissed by user"),this.hidePrompt()}}class R{constructor(){this.sheet=null,this.settingsButton=null,this.isOpen=!1,this.createUI(),this.loadSettings(),this.attachEventListeners()}createUI(){const e=d.getDefaults(),t=document.createElement("div");t.id="settings-overlay-mobile",t.className="settings-overlay-mobile";const s=document.createElement("div");s.id="settings-sheet",s.className="settings-sheet",s.innerHTML=`
            <div class="settings-sheet__header">
                <h2 class="settings-sheet__title">Settings</h2>
                <button class="settings-sheet__close" aria-label="Close settings">×</button>
            </div>

            <div class="settings-sheet__content">
                <!-- Game Settings Section -->
                <section class="settings-section">
                    <h3 class="settings-section__title">Game</h3>

                    <div class="settings-item">
                        <label for="mobile-year">Card Year</label>
                        <select id="mobile-year" class="settings-select">
                            <option value="2025">2025</option>
                            <option value="2020">2020</option>
                            <option value="2019">2019</option>
                            <option value="2018">2018</option>
                            <option value="2017">2017</option>
                        </select>
                    </div>

                    <div class="settings-item">
                        <label for="mobile-difficulty">AI Difficulty</label>
                        <select id="mobile-difficulty" class="settings-select">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    <div class="settings-item settings-item--toggle">
                        <label for="mobile-blank-tiles">Use Blank Tiles</label>
                        <input type="checkbox" id="mobile-blank-tiles" class="settings-checkbox">
                    </div>
                </section>

                <!-- Audio Settings Section -->
                <section class="settings-section">
                    <h3 class="settings-section__title">Audio</h3>

                    <div class="settings-item">
                        <label for="mobile-bgm-volume">
                            Music Volume
                            <span class="volume-value" id="mobile-bgm-value">${e.bgmVolume}</span>
                        </label>
                        <div class="volume-control">
                            <input type="range" id="mobile-bgm-volume" class="settings-slider"
                                   min="0" max="100" step="1" value="${e.bgmVolume}">
                            <label class="mute-toggle">
                                <input type="checkbox" id="mobile-bgm-mute">
                                <span>Mute</span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-item">
                        <label for="mobile-sfx-volume">
                            Sound Effects
                            <span class="volume-value" id="mobile-sfx-value">${e.sfxVolume}</span>
                        </label>
                        <div class="volume-control">
                            <input type="range" id="mobile-sfx-volume" class="settings-slider"
                                   min="0" max="100" step="1" value="${e.sfxVolume}">
                            <label class="mute-toggle">
                                <input type="checkbox" id="mobile-sfx-mute">
                                <span>Mute</span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Training Mode Section (Optional) -->
                <section class="settings-section">
                    <h3 class="settings-section__title">Training Mode</h3>

                    <div class="settings-item settings-item--toggle">
                        <label for="mobile-training-mode">Enable Training Mode</label>
                        <input type="checkbox" id="mobile-training-mode" class="settings-checkbox">
                    </div>

                    <div class="settings-item" id="mobile-training-controls" style="display: none;">
                        <label for="mobile-training-tiles">Starting Tiles</label>
                        <select id="mobile-training-tiles" class="settings-select">
                            <option value="9">9 tiles</option>
                            <option value="10">10 tiles</option>
                            <option value="11">11 tiles</option>
                            <option value="12">12 tiles</option>
                            <option value="13">13 tiles</option>
                            <option value="14">14 tiles</option>
                        </select>
                    </div>

                    <div class="settings-item settings-item--toggle" id="mobile-training-skip" style="display: none;">
                        <label for="mobile-skip-charleston">Skip Charleston</label>
                        <input type="checkbox" id="mobile-skip-charleston" class="settings-checkbox">
                    </div>
                </section>
            </div>

            <div class="settings-sheet__footer">
                <button class="settings-btn settings-btn--secondary" id="mobile-settings-reset">
                    Reset to Defaults
                </button>
                <button class="settings-btn settings-btn--primary" id="mobile-settings-save">
                    Save & Close
                </button>
            </div>
        `,t.appendChild(s),document.body.appendChild(t),this.sheet=s,this.overlay=t}loadSettings(){const e=d.load();document.getElementById("mobile-year").value=e.cardYear,document.getElementById("mobile-difficulty").value=e.difficulty,document.getElementById("mobile-blank-tiles").checked=e.useBlankTiles,document.getElementById("mobile-bgm-volume").value=e.bgmVolume,document.getElementById("mobile-bgm-value").textContent=e.bgmVolume,document.getElementById("mobile-bgm-mute").checked=e.bgmMuted,document.getElementById("mobile-sfx-volume").value=e.sfxVolume,document.getElementById("mobile-sfx-value").textContent=e.sfxVolume,document.getElementById("mobile-sfx-mute").checked=e.sfxMuted,document.getElementById("mobile-training-mode").checked=e.trainingMode,document.getElementById("mobile-training-tiles").value=e.trainingTileCount,document.getElementById("mobile-skip-charleston").checked=e.skipCharleston,this.updateTrainingVisibility(e.trainingMode)}attachEventListeners(){const e=document.getElementById("mobile-settings-btn");e&&e.addEventListener("click",()=>this.open()),this.sheet.querySelector(".settings-sheet__close").addEventListener("click",()=>this.close()),this.overlay.addEventListener("click",t=>{t.target===this.overlay&&this.close()}),document.getElementById("mobile-bgm-volume").addEventListener("input",t=>{document.getElementById("mobile-bgm-value").textContent=t.target.value}),document.getElementById("mobile-sfx-volume").addEventListener("input",t=>{document.getElementById("mobile-sfx-value").textContent=t.target.value}),document.getElementById("mobile-training-mode").addEventListener("change",t=>{this.updateTrainingVisibility(t.target.checked)}),document.getElementById("mobile-settings-save").addEventListener("click",()=>{this.saveSettings(),this.close()}),document.getElementById("mobile-settings-reset").addEventListener("click",()=>{window.confirm("Reset all settings to defaults?")&&(d.reset(),this.loadSettings())})}saveSettings(){var t,s,i,n,l,r,m,h,u,f;const e={cardYear:parseInt(((t=document.getElementById("mobile-year"))==null?void 0:t.value)??d.getDefault("cardYear").toString()),difficulty:((s=document.getElementById("mobile-difficulty"))==null?void 0:s.value)??d.getDefault("difficulty"),useBlankTiles:((i=document.getElementById("mobile-blank-tiles"))==null?void 0:i.checked)??d.getDefault("useBlankTiles"),bgmVolume:parseInt(((n=document.getElementById("mobile-bgm-volume"))==null?void 0:n.value)??d.getDefault("bgmVolume").toString()),bgmMuted:((l=document.getElementById("mobile-bgm-mute"))==null?void 0:l.checked)??d.getDefault("bgmMuted"),sfxVolume:parseInt(((r=document.getElementById("mobile-sfx-volume"))==null?void 0:r.value)??d.getDefault("sfxVolume").toString()),sfxMuted:((m=document.getElementById("mobile-sfx-mute"))==null?void 0:m.checked)??d.getDefault("sfxMuted"),trainingMode:((h=document.getElementById("mobile-training-mode"))==null?void 0:h.checked)??d.getDefault("trainingMode"),trainingTileCount:parseInt(((u=document.getElementById("mobile-training-tiles"))==null?void 0:u.value)??d.getDefault("trainingTileCount").toString()),skipCharleston:((f=document.getElementById("mobile-skip-charleston"))==null?void 0:f.checked)??d.getDefault("skipCharleston"),trainingHand:d.getDefault("trainingHand")};d.save(e),console.log("Settings saved:",e),window.dispatchEvent(new window.CustomEvent("settingsChanged",{detail:e}))}updateTrainingVisibility(e){const t=document.getElementById("mobile-training-controls"),s=document.getElementById("mobile-training-skip");t&&(t.style.display=e?"block":"none"),s&&(s.style.display=e?"flex":"none")}open(){this.isOpen=!0,this.overlay.classList.add("open"),this.sheet.classList.add("open"),document.body.style.overflow="hidden"}close(){this.isOpen=!1,this.overlay.classList.remove("open"),this.sheet.classList.remove("open"),document.body.style.overflow=""}}class O{constructor(e,t){if(!e)throw new Error("WallCounter requires a container element");if(!t)throw new Error("WallCounter requires a gameController instance");this.container=e,this.gameController=t,this.unsubscribeFns=[],this.render(),this.setupListeners()}render(){const e=this.container.querySelector(".wall-tiles");e&&(e.textContent=this.getWallCount())}setupListeners(){const e=()=>this.update();this.unsubscribeFns.push(this.gameController.on("TILE_DRAWN",e));const t=()=>this.update();this.unsubscribeFns.push(this.gameController.on("GAME_STARTED",t));const s=()=>this.update();this.unsubscribeFns.push(this.gameController.on("TILES_DEALT",s))}getWallCount(){return this.gameController.wallTiles?this.gameController.wallTiles.length:0}update(){const e=this.container.querySelector(".wall-tiles");if(e){const t=this.getWallCount();e.textContent=t,t<=8?e.classList.add("low-count"):e.classList.remove("low-count")}}destroy(){this.unsubscribeFns.forEach(e=>{typeof e=="function"&&e()}),this.unsubscribeFns=[],this.container=null,this.gameController=null}}class ${constructor(e,t,s){if(!e)throw new Error("HintsPanel requires a container element");if(!t)throw new Error("HintsPanel requires a gameController instance");if(!s)throw new Error("HintsPanel requires an aiEngine instance");this.container=e,this.gameController=t,this.aiEngine=s,this.isExpanded=!1,this.unsubscribeFns=[],this._disabled=!1,this._onToggle=this.toggle.bind(this),this.render(),this.setupListeners()}render(){if(this.toggleBtn=this.container.querySelector("#hints-toggle"),this.contentEl=this.container.querySelector("#hints-content"),!this.toggleBtn||!this.contentEl){console.error("HintsPanel: Missing required DOM elements"),this._disabled=!0,this.destroy();return}this.toggleBtn.addEventListener("click",this._onToggle),this.contentEl.style.display="none"}setupListeners(){const e=s=>{s.player===0&&this.updateHints(s.hand)};this.unsubscribeFns.push(this.gameController.on("HAND_UPDATED",e));const t=()=>{this.clearHints()};this.unsubscribeFns.push(this.gameController.on("GAME_ENDED",t))}updateHints(e){if(!(this._disabled||!this.contentEl)){if(!e||!e.tiles||e.tiles.length===0){this.clearHints();return}try{const t=this.aiEngine.getTileRecommendations(e);if(!t||t.length===0){this.contentEl.innerHTML=`
                    <div class="hint-item">
                        <span class="hint-label">No recommendations available</span>
                    </div>
                `;return}const s=t.slice(0,3);this.contentEl.innerHTML=`
                <div class="hint-item">
                    <span class="hint-label">Best Discards:</span>
                    <div class="hint-patterns">
                        ${s.map(i=>{var n;return`
                            <div class="hint-pattern">
                                ${this.formatTile(i.tile)} - Keep Value: ${((n=i.keepValue)==null?void 0:n.toFixed(2))||"N/A"}
                            </div>
                        `}).join("")}
                    </div>
                </div>
            `}catch(t){console.error("HintsPanel: Error getting tile recommendations:",t),this.contentEl.innerHTML=`
                <div class="hint-item">
                    <span class="hint-label">Unable to generate hints</span>
                </div>
            `}}}formatTile(e){if(!e)return"Unknown";if(typeof e.getText=="function")return e.getText();const{suit:t,number:s}=e;return t===0||t==="CRACK"?`${s}C`:t===1||t==="BAM"?`${s}B`:t===2||t==="DOT"?`${s}D`:t===3||t==="WIND"?["N","S","W","E"][s]||`W${s}`:t===4||t==="DRAGON"?["Red","Green","White"][s]||`D${s}`:t===5||t==="FLOWER"?`F${s+1}`:t===6||t==="JOKER"?"J":`${t}-${s}`}clearHints(){this._disabled||!this.contentEl||(this.contentEl.innerHTML=`
            <div class="hint-item">
                <span class="hint-label">Play to see recommendations</span>
            </div>
        `)}toggle(){this._disabled||!this.contentEl||!this.toggleBtn||(this.isExpanded=!this.isExpanded,this.contentEl.style.display=this.isExpanded?"block":"none",this.toggleBtn.setAttribute("aria-expanded",String(this.isExpanded)))}destroy(){this.unsubscribeFns.forEach(e=>{typeof e=="function"&&e()}),this.unsubscribeFns=[],this.toggleBtn&&this._onToggle&&this.toggleBtn.removeEventListener("click",this._onToggle),this._disabled=!0,this.container=null,this.gameController=null,this.aiEngine=null,this.toggleBtn=null,this.contentEl=null,this._onToggle=null}}class U{constructor(){this.tileIndices=new Map,this.initMapping()}initMapping(){let e=0;for(let t=1;t<=9;t++)this.tileIndices.set(`BAM-${t}`,e++),this.tileIndices.set(`CRACK-${t}`,e++),this.tileIndices.set(`DOT-${t}`,e++);this.tileIndices.set("DRAGON-1",e++),this.tileIndices.set("DRAGON-0",e++),this.tileIndices.set("DRAGON-2",e++),this.tileIndices.set("WIND-3",30);for(let t=0;t<8;t++){const s=t%4;this.tileIndices.set(`FLOWER-${t}`,31+s),this.tileIndices.set(`FLOWER-${t+1}`,31+s)}for(let t=0;t<8;t++)this.tileIndices.set(`JOKER-${t}`,35);this.tileIndices.set("WIND-0",36),this.tileIndices.set("WIND-1",37),this.tileIndices.set("WIND-2",38)}getSpritePosition(e){const t=this.getTileKey(e),s=this.tileIndices.get(t);return s===void 0?(console.warn("No sprite index found for tile:",e,t),{xPct:0,yPct:0}):{xPct:s/38*100,yPct:0}}getTileKey(e){if(!e)return"unknown";let t=e.suit;const s=e.number;return(t===0||t==="CRACK")&&(t="CRACK"),(t===1||t==="BAM")&&(t="BAM"),(t===2||t==="DOT")&&(t="DOT"),(t===3||t==="WIND")&&(t="WIND"),(t===4||t==="DRAGON")&&(t="DRAGON"),(t===5||t==="FLOWER")&&(t="FLOWER"),(t===6||t==="JOKER")&&(t="JOKER"),`${t}-${s}`}createTileElement(e,t="normal"){const s=document.createElement("div");s.className=`tile tile--${t}`;const i=this.getSpritePosition(e);return s.style.backgroundPosition=`${i.xPct}% ${i.yPct}%`,s.dataset.tileId=this.getTileKey(e),s}}const x=new U,G={[c.CRACK]:"CRACK",[c.BAM]:"BAM",[c.DOT]:"DOT",[c.WIND]:"WIND",[c.DRAGON]:"DRAGON",[c.FLOWER]:"FLOWER",[c.JOKER]:"JOKER",[c.BLANK]:"BLANK"},W={[S.NORTH]:"N",[S.SOUTH]:"S",[S.WEST]:"W",[S.EAST]:"E"},K={[T.RED]:"R",[T.GREEN]:"G",[T.WHITE]:"0"};class F{constructor(e,t){if(!e)throw new Error("HandRenderer requires a container element");this.container=e,this.gameController=t,this.tiles=[],this.selectedIndices=new Set,this.selectionKeyByIndex=new Map,this.selectionBehavior={mode:"multiple",maxSelectable:1/0,allowToggle:!0},this.selectionListener=null,this.unsubscribeFns=[],this.interactive=!0,this.handContainer=null,this.exposedSection=null,this.currentHandData=null,this.currentSortMode=null,this.setupDOM(),this.setupEventListeners()}setupDOM(){this.container.innerHTML="",this.container.classList.add("hand-section"),this.exposedSection=document.createElement("div"),this.exposedSection.className="exposed-section",this.container.appendChild(this.exposedSection),this.handContainer=document.createElement("div"),this.handContainer.className="hand-container hand-grid",this.container.appendChild(this.handContainer)}setupEventListeners(){if(!this.gameController||typeof this.gameController.on!="function")return;const e=(s={})=>{s.player===0&&(this.currentSortMode=null,this.render(s.hand))};this.unsubscribeFns.push(this.gameController.on("HAND_UPDATED",e));const t=(s={})=>{if(typeof s.index=="number"){this.selectTile(s.index,{toggle:s.toggle!==!1,clearOthers:!!s.exclusive,state:s.state});return}Array.isArray(s.indices)&&(s.clearExisting&&this.clearSelection(),s.indices.forEach(i=>{typeof i=="number"&&this.selectTile(i,{state:s.state??"on",toggle:!1})}))};this.unsubscribeFns.push(this.gameController.on("TILE_SELECTED",t))}render(e){if(!e){this.renderExposures([]),this.clearTiles(),this.currentHandData=null;return}this.currentSortMode===null&&e.sortBySuit&&e.sortBySuit(),this.currentHandData=e,this.renderExposures(Array.isArray(e.exposures)?e.exposures:[]),this.clearTiles();const t=new Set;this.selectionKeyByIndex.clear(),(Array.isArray(e.tiles)?e.tiles:[]).forEach((i,n)=>{const l=this.getTileSelectionKey(i,n);this.selectionKeyByIndex.set(n,l);const r=this.createTileButton(i,n,l);this.selectedIndices.has(l)&&(r.classList.add("selected"),t.add(l)),this.tiles.push(r),this.handContainer.appendChild(r)}),this.selectedIndices=t,this.setInteractive(this.interactive)}renderExposures(e){this.exposedSection&&(this.exposedSection.innerHTML="",!(!Array.isArray(e)||e.length===0)&&e.forEach(t=>{if(!t||!Array.isArray(t.tiles))return;const s=document.createElement("div");s.className="exposure-set",t.type&&(s.dataset.type=t.type),t.tiles.forEach(i=>{const n=document.createElement("div");if(n.className="tile tile--small",n.setAttribute("role","img"),i){const r=x.getSpritePosition(i);n.style.backgroundPosition=`${r.xPct}% ${r.yPct}%`}n.dataset.suit=this.getSuitName(i==null?void 0:i.suit),n.dataset.number=this.getDataNumber(i);const l=this.formatTileText(i);l&&n.setAttribute("aria-label",l),s.appendChild(n)}),this.exposedSection.appendChild(s)}))}clearTiles(){this.tiles.forEach(e=>{const t=e.__handRendererHandler;t&&(e.removeEventListener("click",t),delete e.__handRendererHandler)}),this.tiles=[],this.selectionKeyByIndex.clear(),this.handContainer&&(this.handContainer.innerHTML="")}createTileButton(e,t,s){const i=document.createElement("button");if(i.type="button",i.className="tile tile--normal",e){const r=x.getSpritePosition(e);i.style.backgroundPosition=`${r.xPct}% ${r.yPct}%`}i.dataset.suit=this.getSuitName(e==null?void 0:e.suit),i.dataset.number=this.getDataNumber(e),i.dataset.index=String(t),i.dataset.selectionKey=s;const n=this.formatTileText(e);n&&i.setAttribute("aria-label",n),i.disabled=!this.interactive;const l=r=>{r.preventDefault(),r.stopPropagation(),this.interactive&&this.handleTileClick(t)};return i.__handRendererHandler=l,i.addEventListener("click",l),i}setSelectionBehavior(e={}){this.selectionBehavior={...this.selectionBehavior,...e}}setSelectionListener(e){this.selectionListener=typeof e=="function"?e:null}handleTileClick(e){const t=this.selectionKeyByIndex.get(e);if(!t)return;const s=this.selectedIndices.has(t),{mode:i,maxSelectable:n,allowToggle:l}=this.selectionBehavior;if(i==="single"){s&&l!==!1?this.selectTile(e,{state:"off",toggle:!1}):(this.clearSelection(!0),this.selectTile(e,{state:"on",toggle:!1}));return}if(s)l!==!1&&this.selectTile(e,{state:"off",toggle:!1});else{if(this.selectedIndices.size>=n)return;this.selectTile(e,{state:"on",toggle:!1})}}selectTile(e,t={}){const s=this.tiles[e];if(!s)return!1;const i=this.selectionKeyByIndex.get(e);if(!i)return!1;const{state:n,toggle:l=!0,clearOthers:r=!1,silent:m=!1}=t;r&&this.clearSelection(!0);let h;n==="on"?h=!0:n==="off"?h=!1:l?h=!this.selectedIndices.has(i):h=!0;let u=!1;return h?this.selectedIndices.has(i)||(this.selectedIndices.add(i),s.classList.add("selected"),u=!0):this.selectedIndices.delete(i)&&(s.classList.remove("selected"),u=!0),u&&!m&&this.notifySelectionChange(),u}clearSelection(e=!1){return this.selectedIndices.size===0?!1:(this.selectedIndices.clear(),this.tiles.forEach(t=>t.classList.remove("selected")),e||this.notifySelectionChange(),!0)}getSelectedTileIndices(){const e=[];for(const[t,s]of this.selectionKeyByIndex.entries())this.selectedIndices.has(s)&&e.push(t);return e}getSelectedTiles(){if(!this.currentHandData||!Array.isArray(this.currentHandData.tiles))return[];const e=[];for(const[t,s]of this.selectionKeyByIndex.entries()){if(!this.selectedIndices.has(s))continue;const i=this.currentHandData.tiles[t];if(!i)continue;const n=this.toTileData(i);n&&e.push(n)}return e}getSelectionState(){const e=this.getSelectedTileIndices();return{count:e.length,indices:e,tiles:this.getSelectedTiles()}}notifySelectionChange(){typeof this.selectionListener=="function"&&this.selectionListener(this.getSelectionState())}sortHand(e="suit"){var s;if(!this.currentHandData)return;if(typeof((s=this.gameController)==null?void 0:s.sortHand)=="function"){this.gameController.sortHand(0,e);return}this.currentSortMode=e;const t=this.cloneHandData(this.currentHandData);t&&(e==="rank"?typeof t.sortByRank=="function"?t.sortByRank():Array.isArray(t.tiles)&&t.tiles.sort((i,n)=>i.number!==n.number?i.number-n.number:i.suit-n.suit):typeof t.sortBySuit=="function"?t.sortBySuit():Array.isArray(t.tiles)&&t.tiles.sort((i,n)=>i.suit!==n.suit?i.suit-n.suit:i.number-n.number),this.render(t))}setInteractive(e){this.interactive=!!e,this.tiles.forEach(t=>{t.disabled=!this.interactive})}destroy(){this.unsubscribeFns.forEach(e=>{typeof e=="function"&&e()}),this.unsubscribeFns=[],this.clearTiles(),this.clearSelection(!0),this.exposedSection&&(this.exposedSection.innerHTML=""),this.container=null,this.gameController=null,this.handContainer=null,this.exposedSection=null,this.currentHandData=null,this.selectionListener=null}getSuitName(e){return G[e]||"UNKNOWN"}getDataNumber(e){return!e||typeof e.number>"u"?"":String(e.number)}formatTileText(e){if(!e)return"";const{suit:t,number:s}=e;return t===c.CRACK?`${s}C`:t===c.BAM?`${s}B`:t===c.DOT?`${s}D`:t===c.WIND?W[s]||"":t===c.DRAGON?K[s]||"D":t===c.FLOWER?`F${typeof s=="number"?s+1:1}`:t===c.JOKER?"J":t===c.BLANK?"BL":`${s??""}`}getTileSelectionKey(e,t){return e?typeof e.index=="number"&&e.index>=0?`idx-${e.index}`:`${e.suit}:${e.number}:${t}`:`missing-${t}`}cloneHandData(e){return e?typeof e.clone=="function"?e.clone():{tiles:Array.isArray(e.tiles)?e.tiles.map(t=>({...t})):[],exposures:Array.isArray(e.exposures)?e.exposures.map(t=>({type:t==null?void 0:t.type,tiles:Array.isArray(t==null?void 0:t.tiles)?t.tiles.map(s=>({...s})):[]})):[]}:null}toTileData(e){return e?e instanceof b?e.clone():b.fromJSON(e):null}}class y{constructor(e,t={}){this.tileData=e,this.options={width:45,height:60,state:"normal",size:"normal",...t},this.element=null,this.currentState=this.options.state}createElement(){const e=x.createTileElement(this.tileData,this.options.size);e.classList.add("mobile-tile"),e.dataset.suit=this.tileData.suit,e.dataset.number=this.tileData.number,this.tileData.index!==void 0&&(e.dataset.index=this.tileData.index);const t=this._getSizeDefaults(this.options.size);if(this.options.width!==t.width||this.options.height!==t.height){e.style.width=`${this.options.width}px`,e.style.height=`${this.options.height}px`;const s=this.options.width/33.33,i=Math.round(1300*s);e.style.backgroundSize=`${i}px auto`}return this.element=e,this.setState(this.options.state),e}_getSizeDefaults(e){const t={normal:{width:45,height:60},small:{width:32,height:42},discard:{width:30,height:40}};return t[e]||t.normal}setState(e){if(this.currentState=e,!!this.element)switch(this.element.classList.remove("selected","disabled","highlighted"),e){case"selected":this.element.classList.add("selected");break;case"disabled":this.element.classList.add("disabled");break;case"highlighted":this.element.classList.add("highlighted");break}}getData(){return this.tileData}destroy(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}static createHandTile(e,t="normal"){return new y(e,{size:"normal",state:t})}static createExposedTile(e,t="normal"){return new y(e,{size:"small",state:t})}static createDiscardTile(e,t="normal"){return new y(e,{size:"discard",state:t})}}class q{constructor(e,t=null){this.container=e,this.gameController=t,this.discards=[],this.element=null,this.eventUnsubscribers=[],this.render(),this.gameController&&this.setupEventListeners()}render(){this.element=document.createElement("div"),this.element.className="discard-pile",this.container.appendChild(this.element)}setupEventListeners(){!this.gameController||typeof this.gameController.on!="function"||(this.eventUnsubscribers.push(this.gameController.on("TILE_DISCARDED",e=>{const t=b.fromJSON(e.tile);this.addDiscard(t,e.player)})),this.eventUnsubscribers.push(this.gameController.on("DISCARD_CLAIMED",()=>{this.removeLatestDiscard()})),this.eventUnsubscribers.push(this.gameController.on("GAME_STARTED",()=>{this.clear()})))}addDiscard(e,t){this.discards.push({tile:e,player:t});const s=this.createDiscardTile(e,t);this.element.appendChild(s),this.highlightLatest(s),this.scrollToBottom()}createDiscardTile(e,t){const s=y.createDiscardTile(e).createElement();return s.classList.add("discard-tile"),s.dataset.player=t,s.title=`Discarded by ${this.getPlayerName(t)}`,s.addEventListener("click",()=>{this.showDiscardInfo(e,t)}),s}getTileText(e){return e.getText()}getPlayerName(e){return["You","Opponent 1","Opponent 2","Opponent 3"][e]||"Unknown"}highlightLatest(e){this.element.querySelectorAll(".discard-tile").forEach(t=>{t.classList.remove("latest")}),e.classList.add("latest")}removeLatestDiscard(){if(this.discards.length>0){this.discards.pop();const e=this.element.querySelector(".discard-tile:last-child");e&&e.remove()}}showDiscardInfo(e,t){alert(`${e.getText()}
Discarded by: ${this.getPlayerName(t)}`)}scrollToBottom(){this.element.scrollTop=this.element.scrollHeight}clear(){this.discards=[],this.element.innerHTML=""}destroy(){this.eventUnsubscribers.forEach(e=>e()),this.eventUnsubscribers=[],this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}class z{constructor(e,t){this.container=e,this.playerData=t,this.element=null,this.render()}render(){this.element=document.createElement("div"),this.element.className="opponent-bar",this.element.dataset.player=this.playerData.position,this.element.innerHTML=`
            <div class="opponent-info">
                <span class="opponent-name"></span>
                <span class="tile-count"></span>
            </div>
            <div class="exposures"></div>
        `,this.container.appendChild(this.element),this.update(this.playerData)}update(e){if(!this.element)return;this.playerData=e;const t=this.element.querySelector(".opponent-name");t.textContent=`${e.name} (${this.getPositionName(e.position)})`;const s=this.element.querySelector(".tile-count"),i=e.tileCount;s.textContent=`${i} tile${i!==1?"s":""}`,this.updateExposures(e.exposures),this.setCurrentTurn(e.isCurrentTurn)}getPositionName(e){return["Bottom","East","North","West"][e]||"Unknown"}updateExposures(e){const t=this.element.querySelector(".exposures");t.innerHTML="",!(!e||e.length===0)&&e.forEach(s=>{s.tiles.forEach(i=>{const n=y.createExposedTile(i).createElement();n.classList.add("exposure-icon"),n.title=this.getExposureTooltip(s),t.appendChild(n)})})}getExposureLabel(e){return{PUNG:"P",KONG:"K",QUINT:"Q"}[e]||"?"}getExposureTooltip(e){const t=e.tiles.map(s=>s.getText()).join(", ");return`${e.type}: ${t}`}setCurrentTurn(e){this.element&&(e?this.element.classList.add("current-turn"):this.element.classList.remove("current-turn"))}destroy(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}const _=C.BOTTOM;class V{constructor(e={}){if(!e.gameController)throw new Error("MobileRenderer requires a GameController instance");this.gameController=e.gameController,this.statusElement=e.statusElement||null,this.subscriptions=[],this.handRenderer=new F(e.handContainer,null),this.discardPile=new q(e.discardContainer),this.handRenderer.setSelectionBehavior({mode:"multiple",maxSelectable:1/0,allowToggle:!0}),this.handRenderer.setSelectionListener(t=>this.onHandSelectionChange(t)),this.opponentBars=this.createOpponentBars(e.opponentContainers||{}),this.promptUI=this.createPromptUI(e.promptRoot||document.body),this.pendingPrompt=null,this.latestHandSnapshot=null,this.registerEventListeners()}destroy(){var e,t,s,i;this.subscriptions.forEach(n=>{typeof n=="function"&&n()}),this.subscriptions=[],(e=this.handRenderer)==null||e.destroy(),(t=this.discardPile)==null||t.destroy(),(i=(s=this.promptUI)==null?void 0:s.container)==null||i.remove(),this.pendingPrompt=null}registerEventListeners(){const e=this.gameController;this.subscriptions.push(e.on("GAME_STARTED",t=>this.onGameStarted(t))),this.subscriptions.push(e.on("GAME_ENDED",t=>this.onGameEnded(t))),this.subscriptions.push(e.on("STATE_CHANGED",t=>this.onStateChanged(t))),this.subscriptions.push(e.on("HAND_UPDATED",t=>this.onHandUpdated(t))),this.subscriptions.push(e.on("TURN_CHANGED",t=>this.onTurnChanged(t))),this.subscriptions.push(e.on("TILE_DISCARDED",t=>this.onTileDiscarded(t))),this.subscriptions.push(e.on("DISCARD_CLAIMED",()=>this.discardPile.removeLatestDiscard())),this.subscriptions.push(e.on("TILES_EXPOSED",()=>this.refreshOpponentBars())),this.subscriptions.push(e.on("MESSAGE",t=>this.onMessage(t))),this.subscriptions.push(e.on("CHARLESTON_PHASE",t=>{this.updateStatus(`Charleston ${t.phase}: Pass ${t.round}`)})),this.subscriptions.push(e.on("COURTESY_VOTE",t=>{this.updateStatus(`Player ${t.player} voted ${t.vote} for courtesy pass`)})),this.subscriptions.push(e.on("COURTESY_PASS",()=>{this.refreshOpponentBars()})),this.subscriptions.push(e.on("UI_PROMPT",t=>this.handleUIPrompt(t)))}createOpponentBars(e){const t=[];return[{key:"right",playerIndex:C.RIGHT},{key:"top",playerIndex:C.TOP},{key:"left",playerIndex:C.LEFT}].forEach(({key:i,playerIndex:n})=>{const l=e[i];if(!l)return;const r=this.gameController.players[n],m=new z(l,r);t.push({playerIndex:n,bar:m})}),t}createPromptUI(e){const t=document.createElement("div");t.className="mobile-prompt hidden";const s=document.createElement("div");s.className="mobile-prompt__message",t.appendChild(s);const i=document.createElement("div");i.className="mobile-prompt__hint",t.appendChild(i);const n=document.createElement("div");return n.className="mobile-prompt__actions",t.appendChild(n),e.appendChild(t),{container:t,message:s,hint:i,actions:n,primaryButton:null}}onGameStarted(){this.discardPile.clear(),this.resetHandSelection(),this.updateStatus("Game started – dealing tiles..."),this.refreshOpponentBars()}onGameEnded(e){var s;const t=(e==null?void 0:e.reason)??"end";if(t==="mahjong"){const i=(s=this.gameController.players)==null?void 0:s[e.winner];this.updateStatus(i?`${i.name} wins!`:"Mahjong!")}else t==="wall_game"?this.updateStatus("Wall game – no winner"):this.updateStatus("Game ended");this.hidePrompt(),this.resetHandSelection()}onStateChanged(e){e&&this.updateStatus(`State: ${e.newState}`)}onHandUpdated(e){if(!e)return;const t=this.gameController.players[e.player];if(t)if(e.player===_)this.latestHandSnapshot=e.hand,this.handRenderer.render(e.hand);else{const s=this.opponentBars.find(i=>i.playerIndex===e.player);s&&s.bar.update(t)}}onTurnChanged(e){const t=(e==null?void 0:e.currentPlayer)??this.gameController.currentPlayer;this.gameController.players.forEach((s,i)=>{s.isCurrentTurn=i===t}),this.refreshOpponentBars(),t===_&&this.updateStatus("Your turn")}onTileDiscarded(e){if(!(e!=null&&e.tile))return;const t=b.fromJSON(e.tile);this.discardPile.addDiscard(t,e.player)}onMessage(e){e!=null&&e.text&&this.updateStatus(e.text)}refreshOpponentBars(){this.opponentBars.forEach(({playerIndex:e,bar:t})=>{const s=this.gameController.players[e];s&&t.update(s)})}updateStatus(e){this.statusElement&&(this.statusElement.textContent=e)}handleUIPrompt(e){var t,s,i,n,l,r,m,h,u,f,w,P,k,B,D;if(e)switch(this.pendingPrompt&&(console.warn("MobileRenderer: New prompt received while previous prompt pending. Auto-canceling previous prompt."),this.pendingPrompt.type==="tile-selection"?this.cancelTileSelectionPrompt():this.pendingPrompt.callback&&this.pendingPrompt.callback(null)),this.hidePrompt(),this.pendingPrompt=null,e.promptType){case"CHOOSE_DISCARD":this.startTileSelectionPrompt({title:"Choose a tile to discard",hint:"Tap one tile and press Discard",min:1,max:1,confirmLabel:"Discard",cancelLabel:"Auto Discard",fallback:()=>this.getFallbackTiles(1),callback:o=>e.callback(o[0])});break;case"CHARLESTON_PASS":this.startTileSelectionPrompt({title:`Charleston Pass (${((t=e.options)==null?void 0:t.direction)??"?"})`,hint:`Select ${((s=e.options)==null?void 0:s.requiredCount)??3} tiles to pass`,min:((i=e.options)==null?void 0:i.requiredCount)??3,max:((n=e.options)==null?void 0:n.requiredCount)??3,confirmLabel:"Pass Tiles",cancelLabel:"Auto Select",fallback:()=>{var o;return this.getFallbackTiles(((o=e.options)==null?void 0:o.requiredCount)??3)},callback:o=>e.callback(o)});break;case"SELECT_TILES":this.startTileSelectionPrompt({title:((l=e.options)==null?void 0:l.question)??"Select tiles",hint:`Select ${((r=e.options)==null?void 0:r.minTiles)??1}–${((m=e.options)==null?void 0:m.maxTiles)??3} tiles`,min:((h=e.options)==null?void 0:h.minTiles)??1,max:((u=e.options)==null?void 0:u.maxTiles)??3,confirmLabel:"Confirm",cancelLabel:"Cancel",fallback:()=>{var o;return this.getFallbackTiles(Math.max(1,((o=e.options)==null?void 0:o.minTiles)??1))},callback:o=>e.callback(o)});break;case"CLAIM_DISCARD":{const o=(f=e.options)==null?void 0:f.tile,L=o instanceof b?o:o?b.fromJSON(o):null;this.showChoicePrompt({title:L?`Claim ${L.getText()}?`:"Claim discard?",hint:"Choose how to react",options:(((w=e.options)==null?void 0:w.options)||[]).map(E=>({label:E,value:E})),onSelect:E=>e.callback(E)});break}case"EXPOSE_TILES":this.showChoicePrompt({title:"Expose selected tiles?",hint:"Exposed tiles become visible to everyone",options:[{label:"Expose",value:!0,primary:!0},{label:"Keep Hidden",value:!1}],onSelect:o=>e.callback(o)});break;case"YES_NO":this.showChoicePrompt({title:((P=e.options)==null?void 0:P.message)??"Continue?",hint:"",options:[{label:"Yes",value:!0,primary:!0},{label:"No",value:!1}],onSelect:o=>e.callback(o)});break;case"CHARLESTON_CONTINUE":this.showChoicePrompt({title:((k=e.options)==null?void 0:k.question)??"Continue to Charleston phase 2?",hint:"",options:[{label:"Yes",value:"Yes",primary:!0},{label:"No",value:"No"}],onSelect:o=>e.callback(o)});break;case"COURTESY_VOTE":this.showChoicePrompt({title:((B=e.options)==null?void 0:B.question)??"Courtesy pass vote",hint:"How many tiles to exchange?",options:(((D=e.options)==null?void 0:D.options)||["0","1","2","3"]).map(o=>({label:o,value:o})),onSelect:o=>e.callback(o)});break;default:console.warn(`Unhandled UI prompt: ${e.promptType}`),e.callback(null)}}startTileSelectionPrompt(e){this.updateStatus(e.title),this.pendingPrompt={type:"tile-selection",min:e.min,max:e.max,callback:e.callback,fallback:e.fallback},this.handRenderer.setSelectionBehavior({mode:e.max===1?"single":"multiple",maxSelectable:e.max,allowToggle:!0}),this.handRenderer.clearSelection(!0),this.showPrompt(e.title,e.hint,[{label:e.confirmLabel??"Confirm",primary:!0,disabled:!0,onClick:()=>this.resolveTileSelectionPrompt()},{label:e.cancelLabel??"Use Suggestion",onClick:()=>this.cancelTileSelectionPrompt()}]),this.updateTileSelectionHint()}onHandSelectionChange(e){!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection"||this.updateTileSelectionHint(e)}updateTileSelectionHint(e=this.handRenderer.getSelectionState()){if(!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection")return;const{min:t,max:s}=this.pendingPrompt,i=e.count,n=i>=t&&i<=s;this.setPromptHint(`Selected ${i}/${s}${t===s?"":` (need at least ${t})`}`),this.setPrimaryEnabled(n)}resolveTileSelectionPrompt(){if(!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection")return;const e=this.handRenderer.getSelectionState(),{min:t,max:s}=this.pendingPrompt;if(e.count<t||e.count>s)return;const i=this.pendingPrompt.callback;this.resetHandSelection(),this.hidePrompt(),this.pendingPrompt=null,i(e.tiles)}cancelTileSelectionPrompt(){if(!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection")return;const e=this.pendingPrompt.fallback,t=this.pendingPrompt.max,s=typeof e=="function"?e():[],i=this.pendingPrompt.callback;this.resetHandSelection(),this.hidePrompt(),this.pendingPrompt=null,i(t===1?s[0]??null:s)}resetHandSelection(){this.handRenderer.clearSelection(!0),this.handRenderer.setSelectionBehavior({mode:"multiple",maxSelectable:1/0,allowToggle:!0})}showChoicePrompt({title:e,hint:t,options:s,onSelect:i}){this.updateStatus(e);const n=(s||[]).map(l=>({label:l.label,primary:l.primary,onClick:()=>{this.hidePrompt(),i(l.value)}}));this.showPrompt(e,t,n)}showPrompt(e,t,s){this.promptUI.message.textContent=e,this.setPromptHint(t),this.promptUI.actions.innerHTML="",this.promptUI.primaryButton=null,s.forEach(i=>{const n=document.createElement("button");n.textContent=i.label,i.primary&&(n.classList.add("primary"),this.promptUI.primaryButton=n),i.disabled&&(n.disabled=!0),n.addEventListener("click",i.onClick),this.promptUI.actions.appendChild(n)}),this.promptUI.container.classList.remove("hidden")}hidePrompt(){this.promptUI.container.classList.add("hidden"),this.promptUI.primaryButton=null}setPromptHint(e){this.promptUI.hint&&(this.promptUI.hint.textContent=e??"")}setPrimaryEnabled(e){this.promptUI.primaryButton&&(this.promptUI.primaryButton.disabled=!e)}getFallbackTiles(e=1){return!this.latestHandSnapshot||!Array.isArray(this.latestHandSnapshot.tiles)?[]:this.latestHandSnapshot.tiles.slice(0,e).map(t=>t instanceof b?t.clone():b.fromJSON(t)).filter(Boolean)}}let g,v,p,I;function Y(){M.incrementGamesPlayed()}function J(){const a=document.createElement("div");return a.className="bottom-menu",document.body.appendChild(a),a}document.addEventListener("DOMContentLoaded",()=>{console.log("Mobile Mahjong app initializing...");const a=document.getElementById("loading");if(a&&(a.style.display="none"),!document.getElementById("mobile-settings-btn")){const e=document.querySelector(".bottom-menu")||J(),t=document.createElement("button");t.id="mobile-settings-btn",t.className="menu-btn",t.innerHTML="⚙️ SETTINGS",e.appendChild(t)}j()});async function j(){console.log("Initializing mobile game...");const a=document.getElementById("hand-container"),e=document.getElementById("discard-container"),t=document.getElementById("game-status"),s=document.getElementById("opponent-left"),i=document.getElementById("opponent-top"),n=document.getElementById("opponent-right"),l=new A(2025);await l.init(),v=new N(l,null,"medium"),g=new H,await g.init({aiEngine:v,cardValidator:l,settings:{year:2025,difficulty:"medium",skipCharleston:!1}}),p=new V({gameController:g,handContainer:a,discardContainer:e,statusElement:t,opponentContainers:{left:s,top:i,right:n},promptRoot:document.body});const r=document.getElementById("wall-counter");r&&(new O(r,g),console.log("WallCounter initialized"));const m=document.getElementById("hints-panel");m&&(new $(m,g,v),console.log("HintsPanel initialized")),g.on("GAME_ENDED",()=>Y());const h=document.getElementById("new-game-btn");h&&(h.onclick=async()=>{console.log("NEW GAME button clicked!");try{console.log("Starting game...",g),p==null||p.updateStatus("Starting game..."),await g.startGame(),console.log("Game started successfully")}catch(f){console.error("Error starting game:",f),p==null||p.updateStatus(`Error: ${f.message}`)}});const u=document.getElementById("mobile-settings-btn");u&&!I&&(I=new R,u.onclick=()=>{I.open()}),p==null||p.updateStatus("Ready to play! Click NEW GAME to start."),window.location.search.includes("playwright=true")&&(window.gameController=g,window.aiEngine=v,window.mobileRenderer=p),console.log("Mobile game initialized successfully")}
