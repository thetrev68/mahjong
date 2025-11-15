import{S as D,e as f,n as A,D as k,m as H,C as U,A as G,G as Y}from"./card-Kmwn0JuI.js";class V{constructor(){this.deferredPrompt=null,this.installBanner=null,this.init()}init(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),this.deferredPrompt=e,console.log("PWA install prompt captured"),this.checkShouldShowPrompt()}),window.addEventListener("appinstalled",()=>{console.log("PWA installed successfully"),this.markAsInstalled(),this.hidePrompt()}),this.createBannerUI()}checkShouldShowPrompt(){if(this.isAlreadyInstalled()){console.log("App already installed, skipping prompt");return}if(this.wasRecentlyDismissed()){console.log("User dismissed prompt recently, skipping");return}const e=this.getGamesPlayed();console.log(`Games played: ${e}`),e>=2&&setTimeout(()=>{this.showPrompt()},2e3)}getGamesPlayed(){return parseInt(localStorage.getItem("gamesPlayed")||"0",10)}static incrementGamesPlayed(){const e=parseInt(localStorage.getItem("gamesPlayed")||"0",10);localStorage.setItem("gamesPlayed",(e+1).toString()),console.log(`Games played: ${e+1}`)}isAlreadyInstalled(){return window.matchMedia("(display-mode: standalone)").matches?!0:localStorage.getItem("appInstalled")==="true"}wasRecentlyDismissed(){const e=localStorage.getItem("installPromptDismissedAt");if(!e)return!1;const t=parseInt(e,10),s=7*24*60*60*1e3;return Date.now()-t<s}markAsInstalled(){localStorage.setItem("appInstalled","true")}createBannerUI(){this.installBanner=document.createElement("div"),this.installBanner.id="install-banner",this.installBanner.className="install-banner",this.installBanner.style.display="none",this.installBanner.innerHTML=`
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
        `,document.head.appendChild(e)}showPrompt(){if(!this.deferredPrompt){console.log("No deferred prompt available");return}this.installBanner.style.display="block",console.log("Install banner shown")}hidePrompt(){this.installBanner&&(this.installBanner.style.display="none")}async handleInstall(){if(!this.deferredPrompt){console.error("No deferred prompt available");return}this.deferredPrompt.prompt();const{outcome:e}=await this.deferredPrompt.userChoice;console.log(`Install prompt outcome: ${e}`),e==="accepted"?(console.log("User accepted install"),this.markAsInstalled()):(console.log("User dismissed install"),this.handleDismiss()),this.deferredPrompt=null,this.hidePrompt()}handleDismiss(){localStorage.setItem("installPromptDismissedAt",Date.now().toString()),console.log("Install prompt dismissed by user"),this.hidePrompt()}}class X{constructor(){this.sheet=null,this.settingsButton=null,this.isOpen=!1,this.createUI(),this.loadSettings(),this.attachEventListeners()}createUI(){const e=document.createElement("div");e.id="settings-overlay-mobile",e.className="settings-overlay-mobile";const t=document.createElement("div");t.id="settings-sheet",t.className="settings-sheet",t.innerHTML=`
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
                            <span class="volume-value" id="mobile-bgm-value">70</span>
                        </label>
                        <div class="volume-control">
                            <input type="range" id="mobile-bgm-volume" class="settings-slider"
                                   min="0" max="100" step="1" value="70">
                            <label class="mute-toggle">
                                <input type="checkbox" id="mobile-bgm-mute">
                                <span>Mute</span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-item">
                        <label for="mobile-sfx-volume">
                            Sound Effects
                            <span class="volume-value" id="mobile-sfx-value">80</span>
                        </label>
                        <div class="volume-control">
                            <input type="range" id="mobile-sfx-volume" class="settings-slider"
                                   min="0" max="100" step="1" value="80">
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
        `,e.appendChild(t),document.body.appendChild(e),this.sheet=t,this.overlay=e}loadSettings(){const e=D.load();document.getElementById("mobile-year").value=e.cardYear,document.getElementById("mobile-difficulty").value=e.difficulty,document.getElementById("mobile-blank-tiles").checked=e.useBlankTiles,document.getElementById("mobile-bgm-volume").value=e.bgmVolume,document.getElementById("mobile-bgm-value").textContent=e.bgmVolume,document.getElementById("mobile-bgm-mute").checked=e.bgmMuted,document.getElementById("mobile-sfx-volume").value=e.sfxVolume,document.getElementById("mobile-sfx-value").textContent=e.sfxVolume,document.getElementById("mobile-sfx-mute").checked=e.sfxMuted,document.getElementById("mobile-training-mode").checked=e.trainingMode,document.getElementById("mobile-training-tiles").value=e.trainingTileCount,document.getElementById("mobile-skip-charleston").checked=e.skipCharleston,this.updateTrainingVisibility(e.trainingMode)}attachEventListeners(){const e=document.getElementById("mobile-settings-btn");e&&e.addEventListener("click",()=>this.open()),this.sheet.querySelector(".settings-sheet__close").addEventListener("click",()=>this.close()),this.overlay.addEventListener("click",t=>{t.target===this.overlay&&this.close()}),document.getElementById("mobile-bgm-volume").addEventListener("input",t=>{document.getElementById("mobile-bgm-value").textContent=t.target.value}),document.getElementById("mobile-sfx-volume").addEventListener("input",t=>{document.getElementById("mobile-sfx-value").textContent=t.target.value}),document.getElementById("mobile-training-mode").addEventListener("change",t=>{this.updateTrainingVisibility(t.target.checked)}),document.getElementById("mobile-settings-save").addEventListener("click",()=>{this.saveSettings(),this.close()}),document.getElementById("mobile-settings-reset").addEventListener("click",()=>{window.confirm("Reset all settings to defaults?")&&(D.reset(),this.loadSettings())})}saveSettings(){const e={cardYear:parseInt(document.getElementById("mobile-year").value),difficulty:document.getElementById("mobile-difficulty").value,useBlankTiles:document.getElementById("mobile-blank-tiles").checked,bgmVolume:parseInt(document.getElementById("mobile-bgm-volume").value),bgmMuted:document.getElementById("mobile-bgm-mute").checked,sfxVolume:parseInt(document.getElementById("mobile-sfx-volume").value),sfxMuted:document.getElementById("mobile-sfx-mute").checked,trainingMode:document.getElementById("mobile-training-mode").checked,trainingTileCount:parseInt(document.getElementById("mobile-training-tiles").value),skipCharleston:document.getElementById("mobile-skip-charleston").checked,trainingHand:""};D.save(e),console.log("Settings saved:",e),window.dispatchEvent(new window.CustomEvent("settingsChanged",{detail:e}))}updateTrainingVisibility(e){const t=document.getElementById("mobile-training-controls"),s=document.getElementById("mobile-training-skip");t&&(t.style.display=e?"block":"none"),s&&(s.style.display=e?"flex":"none")}open(){this.isOpen=!0,this.overlay.classList.add("open"),this.sheet.classList.add("open"),document.body.style.overflow="hidden"}close(){this.isOpen=!1,this.overlay.classList.remove("open"),this.sheet.classList.remove("open"),document.body.style.overflow=""}}const K={[f.CRACK]:"CRACK",[f.BAM]:"BAM",[f.DOT]:"DOT",[f.WIND]:"WIND",[f.DRAGON]:"DRAGON",[f.FLOWER]:"FLOWER",[f.JOKER]:"JOKER",[f.BLANK]:"BLANK"},W={[A.NORTH]:"N",[A.SOUTH]:"S",[A.WEST]:"W",[A.EAST]:"E"},q={[k.RED]:"R",[k.GREEN]:"G",[k.WHITE]:"0"};class F{constructor(e,t){if(!e)throw new Error("HandRenderer requires a container element");this.container=e,this.gameController=t,this.tiles=[],this.selectedIndices=new Set,this.selectionKeyByIndex=new Map,this.unsubscribeFns=[],this.interactive=!0,this.handContainer=null,this.exposedSection=null,this.currentHandData=null,this.setupDOM(),this.setupEventListeners()}setupDOM(){this.container.innerHTML="",this.container.classList.add("hand-section"),this.exposedSection=document.createElement("div"),this.exposedSection.className="exposed-section",this.container.appendChild(this.exposedSection),this.handContainer=document.createElement("div"),this.handContainer.className="hand-container hand-grid",this.container.appendChild(this.handContainer)}setupEventListeners(){if(!this.gameController||typeof this.gameController.on!="function")return;const e=(s={})=>{s.player===0&&this.render(s.hand)};this.unsubscribeFns.push(this.gameController.on("HAND_UPDATED",e));const t=(s={})=>{if(typeof s.index=="number"){this.selectTile(s.index,{toggle:s.toggle!==!1,clearOthers:!!s.exclusive,state:s.state});return}Array.isArray(s.indices)&&(s.clearExisting&&this.clearSelection(),s.indices.forEach(n=>{typeof n=="number"&&this.selectTile(n,{state:s.state??"on",toggle:!1})}))};this.unsubscribeFns.push(this.gameController.on("TILE_SELECTED",t))}render(e){if(!e){this.renderExposures([]),this.clearTiles(),this.currentHandData=null;return}this.currentHandData=e,this.renderExposures(Array.isArray(e.exposures)?e.exposures:[]),this.clearTiles();const t=new Set;this.selectionKeyByIndex.clear(),(Array.isArray(e.tiles)?e.tiles:[]).forEach((n,o)=>{const d=this.getTileSelectionKey(n,o);this.selectionKeyByIndex.set(o,d);const u=this.createTileButton(n,o,d);this.selectedIndices.has(d)&&(u.classList.add("selected"),t.add(d)),this.tiles.push(u),this.handContainer.appendChild(u)}),this.selectedIndices=t,this.setInteractive(this.interactive)}renderExposures(e){this.exposedSection&&(this.exposedSection.innerHTML="",!(!Array.isArray(e)||e.length===0)&&e.forEach(t=>{if(!t||!Array.isArray(t.tiles))return;const s=document.createElement("div");s.className="exposure-set",t.type&&(s.dataset.type=t.type),t.tiles.forEach(n=>{const o=document.createElement("button");o.type="button",o.className="exposed-tile",o.dataset.suit=this.getSuitName(n==null?void 0:n.suit),o.dataset.number=this.getDataNumber(n),o.textContent=this.formatTileText(n),s.appendChild(o)}),this.exposedSection.appendChild(s)}))}clearTiles(){this.tiles.forEach(e=>{const t=e.__handRendererHandler;t&&(e.removeEventListener("click",t),delete e.__handRendererHandler)}),this.tiles=[],this.selectionKeyByIndex.clear(),this.handContainer&&(this.handContainer.innerHTML="")}createTileButton(e,t,s){const n=document.createElement("button");n.type="button",n.className="tile-btn",n.dataset.suit=this.getSuitName(e==null?void 0:e.suit),n.dataset.number=this.getDataNumber(e),n.dataset.selectionKey=s,n.textContent=this.formatTileText(e),n.disabled=!this.interactive;const o=d=>{d.preventDefault(),d.stopPropagation(),this.interactive&&this.selectTile(t)};return n.__handRendererHandler=o,n.addEventListener("click",o),n}selectTile(e,t={}){const s=this.tiles[e];if(!s)return;const n=this.selectionKeyByIndex.get(e);if(!n)return;const{state:o,toggle:d=!0,clearOthers:u=!1}=t;u&&this.clearSelection();let v;o==="on"?v=!0:o==="off"?v=!1:d?v=!this.selectedIndices.has(n):v=!0,v?(this.selectedIndices.add(n),s.classList.add("selected")):(this.selectedIndices.delete(n),s.classList.remove("selected"))}clearSelection(){this.selectedIndices.clear(),this.tiles.forEach(e=>e.classList.remove("selected"))}sortHand(e="suit"){var s;if(!this.currentHandData)return;if(typeof((s=this.gameController)==null?void 0:s.sortHand)=="function"){this.gameController.sortHand(0,e);return}const t=this.cloneHandData(this.currentHandData);t&&(e==="rank"?typeof t.sortByRank=="function"?t.sortByRank():Array.isArray(t.tiles)&&t.tiles.sort((n,o)=>n.number!==o.number?n.number-o.number:n.suit-o.suit):typeof t.sortBySuit=="function"?t.sortBySuit():Array.isArray(t.tiles)&&t.tiles.sort((n,o)=>n.suit!==o.suit?n.suit-o.suit:n.number-o.number),this.render(t))}setInteractive(e){this.interactive=!!e,this.tiles.forEach(t=>{t.disabled=!this.interactive})}destroy(){this.unsubscribeFns.forEach(e=>{typeof e=="function"&&e()}),this.unsubscribeFns=[],this.clearTiles(),this.clearSelection(),this.exposedSection&&(this.exposedSection.innerHTML=""),this.container=null,this.gameController=null,this.handContainer=null,this.exposedSection=null,this.currentHandData=null}getSuitName(e){return K[e]||"UNKNOWN"}getDataNumber(e){return!e||typeof e.number>"u"?"":String(e.number)}formatTileText(e){if(!e)return"";const{suit:t,number:s}=e;return t===f.CRACK?`${s}C`:t===f.BAM?`${s}B`:t===f.DOT?`${s}D`:t===f.WIND?W[s]||"":t===f.DRAGON?q[s]||"D":t===f.FLOWER?`F${typeof s=="number"?s+1:1}`:t===f.JOKER?"J":t===f.BLANK?"BL":`${s??""}`}getTileSelectionKey(e,t){return e?typeof e.index=="number"&&e.index>=0?`idx-${e.index}`:`${e.suit}:${e.number}:${t}`:`missing-${t}`}cloneHandData(e){return e?typeof e.clone=="function"?e.clone():{tiles:Array.isArray(e.tiles)?e.tiles.map(t=>({...t})):[],exposures:Array.isArray(e.exposures)?e.exposures.map(t=>({type:t==null?void 0:t.type,tiles:Array.isArray(t==null?void 0:t.tiles)?t.tiles.map(s=>({...s})):[]})):[]}:null}}class j{constructor(e,t){this.container=e,this.playerData=t,this.element=null,this.render()}render(){this.element=document.createElement("div"),this.element.className="opponent-bar",this.element.dataset.player=this.playerData.position,this.element.innerHTML=`
            <div class="opponent-info">
                <span class="opponent-name"></span>
                <span class="tile-count"></span>
            </div>
            <div class="exposures"></div>
        `,this.container.appendChild(this.element),this.update(this.playerData)}update(e){if(!this.element)return;this.playerData=e;const t=this.element.querySelector(".opponent-name");t.textContent=`${e.name} (${this.getPositionName(e.position)})`;const s=this.element.querySelector(".tile-count"),n=e.tileCount;s.textContent=`${n} tile${n!==1?"s":""}`,this.updateExposures(e.exposures),this.setCurrentTurn(e.isCurrentTurn)}getPositionName(e){return["Bottom","East","North","West"][e]||"Unknown"}updateExposures(e){const t=this.element.querySelector(".exposures");t.innerHTML="",!(!e||e.length===0)&&e.forEach(s=>{const n=document.createElement("span");n.className=`exposure-icon ${s.type.toLowerCase()}`,n.textContent=this.getExposureLabel(s.type),n.title=this.getExposureTooltip(s),t.appendChild(n)})}getExposureLabel(e){return{PUNG:"P",KONG:"K",QUINT:"Q"}[e]||"?"}getExposureTooltip(e){const t=e.tiles.map(s=>s.getText()).join(", ");return`${e.type}: ${t}`}setCurrentTurn(e){this.element&&(e?this.element.classList.add("current-turn"):this.element.classList.remove("current-turn"))}destroy(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}class z{constructor(e,t){this.container=e,this.gameController=t,this.discards=[],this.element=null,this.eventUnsubscribers=[],this.render(),this.setupEventListeners()}render(){this.element=document.createElement("div"),this.element.className="discard-pile",this.container.appendChild(this.element)}setupEventListeners(){this.eventUnsubscribers.push(this.gameController.on("TILE_DISCARDED",e=>{const t=H.fromJSON(e.tile);this.addDiscard(t,e.player)})),this.eventUnsubscribers.push(this.gameController.on("DISCARD_CLAIMED",()=>{this.removeLatestDiscard()})),this.eventUnsubscribers.push(this.gameController.on("GAME_STARTED",()=>{this.clear()}))}addDiscard(e,t){this.discards.push({tile:e,player:t});const s=this.createDiscardTile(e,t);this.element.appendChild(s),this.highlightLatest(s),this.scrollToBottom()}createDiscardTile(e,t){const s=document.createElement("div");return s.className="discard-tile",s.dataset.player=t,s.title=`Discarded by ${this.getPlayerName(t)}`,s.innerHTML=`
            <div class="discard-tile-face">
                <span class="tile-text">${this.getTileText(e)}</span>
            </div>
        `,s.addEventListener("click",()=>{this.showDiscardInfo(e,t)}),s}getTileText(e){return e.getText()}getPlayerName(e){return["You","Opponent 1","Opponent 2","Opponent 3"][e]||"Unknown"}highlightLatest(e){this.element.querySelectorAll(".discard-tile").forEach(t=>{t.classList.remove("latest")}),e.classList.add("latest")}removeLatestDiscard(){if(this.discards.length>0){this.discards.pop();const e=this.element.querySelector(".discard-tile:last-child");e&&e.remove()}}showDiscardInfo(e,t){alert(`${e.getText()}
Discarded by: ${this.getPlayerName(t)}`)}scrollToBottom(){this.element.scrollTop=this.element.scrollHeight}clear(){this.discards=[],this.element.innerHTML=""}destroy(){this.eventUnsubscribers.forEach(e=>e()),this.eventUnsubscribers=[],this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}const L=["tile-drawing","tile-discarding","tile-claiming-pulse","tile-claiming-move","tile-exposing"],O=["turn-starting","turn-ending"],B="hand-sorting",M="invalid-action",J=[{x:0,y:0},{x:90,y:-60},{x:0,y:-140},{x:-90,y:-60}],Q=500,Z=400,ee=600,te=300,se=500,$=50,ne=16,b=(r,e=0)=>`${typeof r=="number"&&!Number.isNaN(r)?r:e}px`,ie=r=>r?Array.isArray(r)?r.filter(Boolean):Array.from(r).filter(Boolean):[];class oe{constructor(e={}){this.duration=typeof e.duration=="number"?e.duration:300,this.easing=e.easing||"ease-out",this.prefersReducedMotion=typeof window<"u"&&typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this._elementTimers=new WeakMap}animateTileDraw(e,t={},s={}){return new Promise(n=>{if(!e){n();return}this._resetElementAnimation(e,L);const o={"--start-x":b(t.x,0),"--start-y":b(t.y,-200),"--end-x":b(s.x,0),"--end-y":b(s.y,0),"--tile-draw-duration":`${this.duration}ms`,"--tile-draw-easing":this.easing};this._setCssVariables(e,o),this._applyAnimationClass(e,"tile-drawing"),this._scheduleTimer(e,this.duration,()=>{e.classList.remove("tile-drawing"),this._clearCssVariables(e,Object.keys(o)),n()})})}animateTileDiscard(e,t={}){return new Promise(s=>{if(!e){s();return}this._resetElementAnimation(e,L);const n=this.duration+100,o={"--start-x":b(0),"--start-y":b(0),"--target-x":b(t.x,0),"--target-y":b(t.y,100),"--tile-discard-duration":`${n}ms`,"--tile-discard-easing":"ease-in"};this._setCssVariables(e,o),this._applyAnimationClass(e,"tile-discarding"),this._scheduleTimer(e,n,()=>{e.classList.remove("tile-discarding"),this._clearCssVariables(e,Object.keys(o)),s()})})}animateTileClaim(e,t=0,s={}){return new Promise(n=>{if(!e){n();return}this._resetElementAnimation(e,L);const o=J[t]||{x:0,y:-200},d={"--claim-offset-x":b(o.x,0),"--claim-offset-y":b(o.y,-200),"--target-x":b(s.x,0),"--target-y":b(s.y,0),"--tile-claim-duration":`${this.duration}ms`};this._setCssVariables(e,d),this._applyAnimationClass(e,"tile-claiming-pulse"),this._scheduleTimer(e,Q,()=>{e.classList.remove("tile-claiming-pulse"),this._applyAnimationClass(e,"tile-claiming-move"),this._scheduleTimer(e,this.duration,()=>{e.classList.remove("tile-claiming-move"),this._clearCssVariables(e,Object.keys(d)),n()})})})}animateTurnStart(e){return this._runSimpleAnimation(e,"turn-starting",ee)}animateTurnEnd(e){return this._runSimpleAnimation(e,"turn-ending",te)}animateHandSort(e){return this._runSimpleAnimation(e,B,Z)}animateExposure(e,t={}){const s=ie(e);return new Promise(n=>{if(!s.length){n();return}s.forEach((u,v)=>{this._resetElementAnimation(u,L);const C={"--target-x":b(t.x,0),"--target-y":b(t.y,0)};this._setCssVariables(u,C),u.style.animationDelay=this.prefersReducedMotion?"0ms":`${v*$}ms`,this._applyAnimationClass(u,"tile-exposing")});const o=this.duration+s.length*$,d=s[0];this._scheduleTimer(d,o,()=>{s.forEach(u=>{u.classList.remove("tile-exposing"),u.style.animationDelay="",this._clearCssVariables(u,["--target-x","--target-y"])}),n()})})}animateInvalidAction(e){return this._runSimpleAnimation(e,M,se)}_runSimpleAnimation(e,t,s){return new Promise(n=>{if(!e){n();return}const o=[];O.includes(t)?o.push(...O):t===B?o.push(B):t===M&&o.push(M),this._resetElementAnimation(e,o),this._applyAnimationClass(e,t),this._scheduleTimer(e,s,()=>{e.classList.remove(t),n()})})}_resetElementAnimation(e,t=[]){e&&(this._cancelTimers(e),t.forEach(s=>e.classList.remove(s)))}_setCssVariables(e,t={}){!e||!e.style||Object.entries(t).forEach(([s,n])=>{n==null?e.style.removeProperty(s):e.style.setProperty(s,n)})}_clearCssVariables(e,t=[]){!e||!e.style||t.forEach(s=>e.style.removeProperty(s))}_applyAnimationClass(e,t){e&&(e.classList.remove(t),e.offsetWidth,e.classList.add(t))}_scheduleTimer(e,t,s){const n=this.prefersReducedMotion?Math.min(t,ne):t,o=setTimeout(()=>{this._deregisterTimer(e,o),s()},n);return this._registerTimer(e,o),o}_registerTimer(e,t){if(!e)return;let s=this._elementTimers.get(e);s||(s=new Set,this._elementTimers.set(e,s)),s.add(t)}_deregisterTimer(e,t){if(!e)return;const s=this._elementTimers.get(e);s&&(s.delete(t),s.size===0&&this._elementTimers.delete(e))}_cancelTimers(e){if(!e)return;const t=this._elementTimers.get(e);t&&(t.forEach(s=>clearTimeout(s)),this._elementTimers.delete(e))}}const x={IDLE:"idle",TOUCHING:"touching",MOVED:"moved"};class le{constructor(e,t={}){this.rootElement=e,this.options={tapMaxDuration:300,tapMaxMovement:10,doubleTapWindow:500,doubleTapDistance:20,longPressDuration:500,swipeMinDistance:50,enableDoubleTap:!1,enableLongPress:!1,enableSwipe:!1,...t},this.listeners={tap:[],doubletap:[],longpress:[],swipeup:[]},this.state=this.createInitialState(),this.handleTouchStart=this.handleTouchStart.bind(this),this.handleTouchMove=this.handleTouchMove.bind(this),this.handleTouchEnd=this.handleTouchEnd.bind(this),this.handleTouchCancel=this.handleTouchCancel.bind(this)}createInitialState(){return{current:x.IDLE,startTime:null,startX:null,startY:null,currentX:null,currentY:null,element:null,lastTapTime:null,lastTapX:null,lastTapY:null,longPressTimer:null}}init(){this.rootElement.addEventListener("touchstart",this.handleTouchStart,{passive:!1}),this.rootElement.addEventListener("touchmove",this.handleTouchMove,{passive:!1}),this.rootElement.addEventListener("touchend",this.handleTouchEnd,{passive:!1}),this.rootElement.addEventListener("touchcancel",this.handleTouchCancel,{passive:!1})}on(e,t){if(!this.listeners[e])throw new Error(`Unknown gesture type: ${e}`);this.listeners[e].push(t)}off(e,t){this.listeners[e]&&(this.listeners[e]=this.listeners[e].filter(s=>s!==t))}emit(e,t){t.element&&!document.body.contains(t.element)||this.listeners[e]&&this.listeners[e].forEach(s=>s(t))}destroy(){this.rootElement.removeEventListener("touchstart",this.handleTouchStart),this.rootElement.removeEventListener("touchmove",this.handleTouchMove),this.rootElement.removeEventListener("touchend",this.handleTouchEnd),this.rootElement.removeEventListener("touchcancel",this.handleTouchCancel),clearTimeout(this.state.longPressTimer)}getElementAtPoint(e,t){return document.elementFromPoint(e,t)}resetState(){clearTimeout(this.state.longPressTimer),this.state=this.createInitialState()}handleTouchStart(e){if(e.touches.length>1){this.resetState();return}const t=e.touches[0];this.state.current=x.TOUCHING,this.state.startTime=Date.now(),this.state.startX=t.clientX,this.state.startY=t.clientY,this.state.currentX=t.clientX,this.state.currentY=t.clientY,this.state.element=this.getElementAtPoint(t.clientX,t.clientY),this.options.enableLongPress&&(this.state.longPressTimer=setTimeout(()=>{this.state.current===x.TOUCHING&&Math.sqrt(Math.pow(this.state.currentX-this.state.startX,2)+Math.pow(this.state.currentY-this.state.startY,2))<this.options.tapMaxMovement&&(this.emit("longpress",{type:"longpress",element:this.state.element,coordinates:{x:this.state.startX,y:this.state.startY},timestamp:Date.now()}),this.resetState())},this.options.longPressDuration))}handleTouchMove(e){if(this.state.current===x.IDLE)return;const t=e.touches[0];this.state.currentX=t.clientX,this.state.currentY=t.clientY;const s=this.state.currentX-this.state.startX,n=this.state.currentY-this.state.startY;Math.sqrt(s*s+n*n)>this.options.tapMaxMovement&&(this.state.current=x.MOVED,clearTimeout(this.state.longPressTimer))}handleTouchEnd(e){if(this.state.current===x.IDLE)return;const t=e.changedTouches[0],s=Date.now()-this.state.startTime,n=Math.abs(t.clientX-this.state.startX),o=Math.abs(t.clientY-this.state.startY),d=Math.sqrt(n*n+o*o);clearTimeout(this.state.longPressTimer),this.state.current===x.TOUCHING&&s<this.options.tapMaxDuration&&d<this.options.tapMaxMovement?(this.emit("tap",{type:"tap",element:this.state.element,coordinates:{x:t.clientX,y:t.clientY},timestamp:Date.now(),target:e.target}),this.options.enableDoubleTap?this.checkDoubleTap(t.clientX,t.clientY):this.resetState()):this.state.current===x.MOVED?this.resetState():this.resetState()}handleTouchCancel(e){this.resetState()}checkDoubleTap(e,t){const s=Date.now(),n=this.state.lastTapTime,o=this.state.lastTapX,d=this.state.lastTapY,u=this.state.element;if(this.resetState(),n!==null){const v=s-n,C=Math.abs(e-o),I=Math.abs(t-d),i=Math.sqrt(C*C+I*I);if(v<this.options.doubleTapWindow&&i<this.options.doubleTapDistance){this.emit("doubletap",{type:"doubletap",element:u,coordinates:{x:e,y:t},timestamp:s});return}}this.state.lastTapTime=s,this.state.lastTapX=e,this.state.lastTapY=t}}let h,R;const N=[];let c,P;function ae(){V.incrementGamesPlayed()}function re(){const r=document.createElement("div");return r.className="bottom-menu",document.body.appendChild(r),r}document.addEventListener("DOMContentLoaded",()=>{console.log("Mobile Mahjong app initializing...");const r=document.getElementById("loading");if(r&&(r.style.display="none"),!document.getElementById("mobile-settings-btn")){const e=document.querySelector(".bottom-menu")||re(),t=document.createElement("button");t.id="mobile-settings-btn",t.className="menu-btn",t.innerHTML="⚙️ SETTINGS",e.appendChild(t)}ce()});async function ce(){console.log("Initializing mobile game...");const r=document.getElementById("hand-container"),e=document.getElementById("discard-container"),t=document.getElementById("game-status"),s=document.getElementById("opponent-left"),n=document.getElementById("opponent-top"),o=document.getElementById("opponent-right"),d=new U(2025);await d.init(),R=new G(d,null,"medium"),h=new Y,await h.init({aiEngine:R,cardValidator:d,settings:{year:2025,difficulty:"medium",skipCharleston:!1}}),new oe,new F(r,h),new z(e,h);const u=[{container:o,playerIndex:1,position:"RIGHT"},{container:n,playerIndex:2,position:"TOP"},{container:s,playerIndex:3,position:"LEFT"}];for(const{container:i,playerIndex:y}of u){const a=h.players[y],l=new j(i,a);N.push({bar:l,playerIndex:y})}new le(r,{enableSwipe:!0,enableLongPress:!0}).init(),c=t,h.on("GAME_ENDED",()=>{ae(),c.textContent="Game Ended!"}),h.on("STATE_CHANGED",i=>{console.log("State changed:",i),c.textContent=`State: ${i.newState}`}),h.on("MESSAGE",i=>{console.log("Game message:",i.text),c.textContent=i.text}),h.on("HAND_UPDATED",i=>{const y=h.players[i.player];c.textContent=`Player ${i.player} (${y.name}):
${i.hand.tiles.length} hidden tiles
${i.hand.exposures.length} exposures`;const a=N.find(l=>l.playerIndex===i.player);a&&a.bar.update(y)}),h.on("TURN_CHANGED",i=>{const y=i.currentPlayer??h.currentPlayer;N.forEach(({bar:a,playerIndex:l})=>{const E=h.players[l];E.isCurrentTurn=l===y,a.update(E)})}),h.on("TILES_EXPOSED",i=>{const y=N.find(a=>a.playerIndex===i.player);if(y){const a=h.players[i.player];y.bar.update(a)}}),h.on("UI_PROMPT",i=>{var y;if(console.log("UI_PROMPT received:",i.promptType,i.options),i.promptType==="CHOOSE_DISCARD"){const l=h.players[0].hand.tiles,E=l.map((S,_)=>`${_}: ${S.getText()}`).join(`
`),p=window.prompt(`Choose a tile to discard:
${E}
Enter tile index (0-${l.length-1}):`),m=parseInt(p,10);!isNaN(m)&&m>=0&&m<l.length?(c.textContent=`Discarding ${l[m].getText()}...`,i.callback(l[m])):(c.textContent="Invalid choice, discarding first tile...",i.callback(l[0]))}else if(i.promptType==="CLAIM_DISCARD"){const{tile:a,options:l}=i.options,E=H.fromJSON(a).getText(),p=l.join(", "),m=window.prompt(`Claim ${E}? Options: ${p}`);l.includes(m)?(c.textContent=`Claiming: ${m}`,i.callback(m)):(c.textContent="Passing claim...",i.callback("Pass"))}else if(i.promptType==="SELECT_TILES"){const{minTiles:a=1,maxTiles:l=3}=i.options||{},p=h.players[0].hand.tiles,m=p.map((w,T)=>`${T}: ${w.getText()}`).join(`
`),S=`Select ${a}-${l} tiles (comma-separated indices):
${m}
Example: 0,2,5`,_=window.prompt(S);if(_){const T=_.split(",").map(g=>parseInt(g.trim(),10)).filter(g=>!isNaN(g)).filter(g=>g>=0&&g<p.length).map(g=>p[g]);T.length>=a&&T.length<=l?(c.textContent=`Selected ${T.length} tiles...`,i.callback(T)):(c.textContent=`Invalid selection (need ${a}-${l} tiles)`,i.callback(p.slice(0,l)))}else c.textContent="Selection cancelled",i.callback(p.slice(0,a))}else if(i.promptType==="EXPOSE_TILES"){const a=window.prompt("Expose tiles? (yes/no)");a&&a.toLowerCase()==="yes"?(c.textContent="Exposing tiles...",i.callback(!0)):(c.textContent="Not exposing tiles...",i.callback(!1))}else if(i.promptType==="YES_NO"){const a=((y=i.options)==null?void 0:y.message)||"Continue?",l=window.prompt(`${a} (yes/no)`);l&&(l.toLowerCase()==="yes"||l.toLowerCase()==="y")?i.callback(!0):i.callback(!1)}else if(i.promptType==="CHARLESTON_PASS"){const{direction:a="?",requiredCount:l=3}=i.options||{},p=h.players[0].hand.tiles,m=p.map((w,T)=>`${T}: ${w.getText()}`).join(`
`),S=`Charleston Pass [${a}]:
Select ${l} tiles to pass (comma-separated indices):
${m}
Example: 0,2,5`,_=window.prompt(S);if(_){const T=_.split(",").map(g=>parseInt(g.trim(),10)).filter(g=>!isNaN(g)).filter(g=>g>=0&&g<p.length).map(g=>p[g]);T.length===l?(c.textContent=`Passing ${l} tiles ${a}...`,i.callback(T)):(c.textContent=`Invalid selection (need exactly ${l} tiles)`,i.callback(p.slice(0,l)))}else c.textContent="Charleston pass cancelled, using first tiles...",i.callback(p.slice(0,l))}else if(i.promptType==="CHARLESTON_CONTINUE"){const{question:a="Continue to Charleston phase 2?"}=i.options||{},l=window.prompt(`${a} (Yes/No)`);l&&(l.toLowerCase()==="yes"||l.toLowerCase()==="y")?(c.textContent="Voting YES to continue...",i.callback("Yes")):(c.textContent="Voting NO to end...",i.callback("No"))}else if(i.promptType==="COURTESY_VOTE"){const{question:a="Courtesy Pass: How many tiles to exchange?",options:l=["0","1","2","3"]}=i.options||{},E=l.join("/"),p=window.prompt(`${a}
Options: ${E}`),m=parseInt(p,10);!isNaN(m)&&m>=0&&m<=3?(c.textContent=`Voted for ${m} tiles...`,i.callback(String(m))):(c.textContent="Invalid vote, defaulting to 0...",i.callback("0"))}else console.log("Unhandled prompt type:",i.promptType),i.callback&&i.callback(null)});const C=document.getElementById("new-game-btn");C&&(C.onclick=async()=>{console.log("NEW GAME button clicked!");try{console.log("Starting game...",h),await h.startGame(),console.log("Game started successfully")}catch(i){console.error("Error starting game:",i),c.textContent=`Error: ${i.message}`}});const I=document.getElementById("mobile-settings-btn");I&&!P&&(P=new X,I.onclick=()=>{P.open()}),c.textContent="Ready to play! Click NEW GAME to start.",console.log("Mobile game initialized successfully")}
