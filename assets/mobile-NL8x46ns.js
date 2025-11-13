import{S,a as c,W as x,D as _,r as C,P as k,V as P,C as K,G as U}from"./GameController-DDguyC2P.js";class G{constructor(){this.deferredPrompt=null,this.installBanner=null,this.init()}init(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),this.deferredPrompt=e,console.log("PWA install prompt captured"),this.checkShouldShowPrompt()}),window.addEventListener("appinstalled",()=>{console.log("PWA installed successfully"),this.markAsInstalled(),this.hidePrompt()}),this.createBannerUI()}checkShouldShowPrompt(){if(this.isAlreadyInstalled()){console.log("App already installed, skipping prompt");return}if(this.wasRecentlyDismissed()){console.log("User dismissed prompt recently, skipping");return}const e=this.getGamesPlayed();console.log(`Games played: ${e}`),e>=2&&setTimeout(()=>{this.showPrompt()},2e3)}getGamesPlayed(){return parseInt(localStorage.getItem("gamesPlayed")||"0",10)}static incrementGamesPlayed(){const e=parseInt(localStorage.getItem("gamesPlayed")||"0",10);localStorage.setItem("gamesPlayed",(e+1).toString()),console.log(`Games played: ${e+1}`)}isAlreadyInstalled(){return window.matchMedia("(display-mode: standalone)").matches?!0:localStorage.getItem("appInstalled")==="true"}wasRecentlyDismissed(){const e=localStorage.getItem("installPromptDismissedAt");if(!e)return!1;const t=parseInt(e,10),s=7*24*60*60*1e3;return Date.now()-t<s}markAsInstalled(){localStorage.setItem("appInstalled","true")}createBannerUI(){this.installBanner=document.createElement("div"),this.installBanner.id="install-banner",this.installBanner.className="install-banner",this.installBanner.style.display="none",this.installBanner.innerHTML=`
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
        `,document.head.appendChild(e)}showPrompt(){if(!this.deferredPrompt){console.log("No deferred prompt available");return}this.installBanner.style.display="block",console.log("Install banner shown")}hidePrompt(){this.installBanner&&(this.installBanner.style.display="none")}async handleInstall(){if(!this.deferredPrompt){console.error("No deferred prompt available");return}this.deferredPrompt.prompt();const{outcome:e}=await this.deferredPrompt.userChoice;console.log(`Install prompt outcome: ${e}`),e==="accepted"?(console.log("User accepted install"),this.markAsInstalled()):(console.log("User dismissed install"),this.handleDismiss()),this.deferredPrompt=null,this.hidePrompt()}handleDismiss(){localStorage.setItem("installPromptDismissedAt",Date.now().toString()),console.log("Install prompt dismissed by user"),this.hidePrompt()}}class ${constructor(){this.sheet=null,this.settingsButton=null,this.isOpen=!1,this.createUI(),this.loadSettings(),this.attachEventListeners()}createUI(){const e=document.createElement("div");e.id="settings-overlay-mobile",e.className="settings-overlay-mobile";const t=document.createElement("div");t.id="settings-sheet",t.className="settings-sheet",t.innerHTML=`
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
        `,e.appendChild(t),document.body.appendChild(e),this.sheet=t,this.overlay=e}loadSettings(){const e=S.load();document.getElementById("mobile-year").value=e.cardYear,document.getElementById("mobile-difficulty").value=e.difficulty,document.getElementById("mobile-blank-tiles").checked=e.useBlankTiles,document.getElementById("mobile-bgm-volume").value=e.bgmVolume,document.getElementById("mobile-bgm-value").textContent=e.bgmVolume,document.getElementById("mobile-bgm-mute").checked=e.bgmMuted,document.getElementById("mobile-sfx-volume").value=e.sfxVolume,document.getElementById("mobile-sfx-value").textContent=e.sfxVolume,document.getElementById("mobile-sfx-mute").checked=e.sfxMuted,document.getElementById("mobile-training-mode").checked=e.trainingMode,document.getElementById("mobile-training-tiles").value=e.trainingTileCount,document.getElementById("mobile-skip-charleston").checked=e.skipCharleston,this.updateTrainingVisibility(e.trainingMode)}attachEventListeners(){const e=document.getElementById("mobile-settings-btn");e&&e.addEventListener("click",()=>this.open()),this.sheet.querySelector(".settings-sheet__close").addEventListener("click",()=>this.close()),this.overlay.addEventListener("click",t=>{t.target===this.overlay&&this.close()}),document.getElementById("mobile-bgm-volume").addEventListener("input",t=>{document.getElementById("mobile-bgm-value").textContent=t.target.value}),document.getElementById("mobile-sfx-volume").addEventListener("input",t=>{document.getElementById("mobile-sfx-value").textContent=t.target.value}),document.getElementById("mobile-training-mode").addEventListener("change",t=>{this.updateTrainingVisibility(t.target.checked)}),document.getElementById("mobile-settings-save").addEventListener("click",()=>{this.saveSettings(),this.close()}),document.getElementById("mobile-settings-reset").addEventListener("click",()=>{window.confirm("Reset all settings to defaults?")&&(S.reset(),this.loadSettings())})}saveSettings(){const e={cardYear:parseInt(document.getElementById("mobile-year").value),difficulty:document.getElementById("mobile-difficulty").value,useBlankTiles:document.getElementById("mobile-blank-tiles").checked,bgmVolume:parseInt(document.getElementById("mobile-bgm-volume").value),bgmMuted:document.getElementById("mobile-bgm-mute").checked,sfxVolume:parseInt(document.getElementById("mobile-sfx-volume").value),sfxMuted:document.getElementById("mobile-sfx-mute").checked,trainingMode:document.getElementById("mobile-training-mode").checked,trainingTileCount:parseInt(document.getElementById("mobile-training-tiles").value),skipCharleston:document.getElementById("mobile-skip-charleston").checked,trainingHand:""};S.save(e),console.log("Settings saved:",e),window.dispatchEvent(new window.CustomEvent("settingsChanged",{detail:e}))}updateTrainingVisibility(e){const t=document.getElementById("mobile-training-controls"),s=document.getElementById("mobile-training-skip");t&&(t.style.display=e?"block":"none"),s&&(s.style.display=e?"flex":"none")}open(){this.isOpen=!0,this.overlay.classList.add("open"),this.sheet.classList.add("open"),document.body.style.overflow="hidden"}close(){this.isOpen=!1,this.overlay.classList.remove("open"),this.sheet.classList.remove("open"),document.body.style.overflow=""}}const V={[c.CRACK]:"CRACK",[c.BAM]:"BAM",[c.DOT]:"DOT",[c.WIND]:"WIND",[c.DRAGON]:"DRAGON",[c.FLOWER]:"FLOWER",[c.JOKER]:"JOKER",[c.BLANK]:"BLANK"},Y={[x.NORTH]:"N",[x.SOUTH]:"S",[x.WEST]:"W",[x.EAST]:"E"},X={[_.RED]:"R",[_.GREEN]:"G",[_.WHITE]:"0"};class j{constructor(e,t){if(!e)throw new Error("HandRenderer requires a container element");this.container=e,this.gameController=t,this.tiles=[],this.selectedIndices=new Set,this.selectionKeyByIndex=new Map,this.unsubscribeFns=[],this.interactive=!0,this.handContainer=null,this.exposedSection=null,this.currentHandData=null,this.setupDOM(),this.setupEventListeners()}setupDOM(){this.container.innerHTML="",this.container.classList.add("hand-section"),this.exposedSection=document.createElement("div"),this.exposedSection.className="exposed-section",this.container.appendChild(this.exposedSection),this.handContainer=document.createElement("div"),this.handContainer.className="hand-container hand-grid",this.container.appendChild(this.handContainer)}setupEventListeners(){if(!this.gameController||typeof this.gameController.on!="function")return;const e=(s={})=>{s.player===0&&this.render(s.hand)};this.unsubscribeFns.push(this.gameController.on("HAND_UPDATED",e));const t=(s={})=>{if(typeof s.index=="number"){this.selectTile(s.index,{toggle:s.toggle!==!1,clearOthers:!!s.exclusive,state:s.state});return}Array.isArray(s.indices)&&(s.clearExisting&&this.clearSelection(),s.indices.forEach(n=>{typeof n=="number"&&this.selectTile(n,{state:s.state??"on",toggle:!1})}))};this.unsubscribeFns.push(this.gameController.on("TILE_SELECTED",t))}render(e){if(!e){this.renderExposures([]),this.clearTiles(),this.currentHandData=null;return}this.currentHandData=e,this.renderExposures(Array.isArray(e.exposures)?e.exposures:[]),this.clearTiles();const t=new Set;this.selectionKeyByIndex.clear(),(Array.isArray(e.tiles)?e.tiles:[]).forEach((n,i)=>{const o=this.getTileSelectionKey(n,i);this.selectionKeyByIndex.set(i,o);const a=this.createTileButton(n,i,o);this.selectedIndices.has(o)&&(a.classList.add("selected"),t.add(o)),this.tiles.push(a),this.handContainer.appendChild(a)}),this.selectedIndices=t,this.setInteractive(this.interactive)}renderExposures(e){this.exposedSection&&(this.exposedSection.innerHTML="",!(!Array.isArray(e)||e.length===0)&&e.forEach(t=>{if(!t||!Array.isArray(t.tiles))return;const s=document.createElement("div");s.className="exposure-set",t.type&&(s.dataset.type=t.type),t.tiles.forEach(n=>{const i=document.createElement("button");i.type="button",i.className="exposed-tile",i.dataset.suit=this.getSuitName(n==null?void 0:n.suit),i.dataset.number=this.getDataNumber(n),i.textContent=this.formatTileText(n),s.appendChild(i)}),this.exposedSection.appendChild(s)}))}clearTiles(){this.tiles.forEach(e=>{const t=e.__handRendererHandler;t&&(e.removeEventListener("click",t),delete e.__handRendererHandler)}),this.tiles=[],this.selectionKeyByIndex.clear(),this.handContainer&&(this.handContainer.innerHTML="")}createTileButton(e,t,s){const n=document.createElement("button");n.type="button",n.className="tile-btn",n.dataset.suit=this.getSuitName(e==null?void 0:e.suit),n.dataset.number=this.getDataNumber(e),n.dataset.selectionKey=s,n.textContent=this.formatTileText(e),n.disabled=!this.interactive;const i=o=>{o.preventDefault(),o.stopPropagation(),this.interactive&&this.selectTile(t)};return n.__handRendererHandler=i,n.addEventListener("click",i),n}selectTile(e,t={}){const s=this.tiles[e];if(!s)return;const n=this.selectionKeyByIndex.get(e);if(!n)return;const{state:i,toggle:o=!0,clearOthers:a=!1}=t;a&&this.clearSelection();let l;i==="on"?l=!0:i==="off"?l=!1:o?l=!this.selectedIndices.has(n):l=!0,l?(this.selectedIndices.add(n),s.classList.add("selected")):(this.selectedIndices.delete(n),s.classList.remove("selected"))}clearSelection(){this.selectedIndices.clear(),this.tiles.forEach(e=>e.classList.remove("selected"))}sortHand(e="suit"){var s;if(!this.currentHandData)return;if(typeof((s=this.gameController)==null?void 0:s.sortHand)=="function"){this.gameController.sortHand(0,e);return}const t=this.cloneHandData(this.currentHandData);t&&(e==="rank"?typeof t.sortByRank=="function"?t.sortByRank():Array.isArray(t.tiles)&&t.tiles.sort((n,i)=>n.number!==i.number?n.number-i.number:n.suit-i.suit):typeof t.sortBySuit=="function"?t.sortBySuit():Array.isArray(t.tiles)&&t.tiles.sort((n,i)=>n.suit!==i.suit?n.suit-i.suit:n.number-i.number),this.render(t))}setInteractive(e){this.interactive=!!e,this.tiles.forEach(t=>{t.disabled=!this.interactive})}destroy(){this.unsubscribeFns.forEach(e=>{typeof e=="function"&&e()}),this.unsubscribeFns=[],this.clearTiles(),this.clearSelection(),this.exposedSection&&(this.exposedSection.innerHTML=""),this.container=null,this.gameController=null,this.handContainer=null,this.exposedSection=null,this.currentHandData=null}getSuitName(e){return V[e]||"UNKNOWN"}getDataNumber(e){return!e||typeof e.number>"u"?"":String(e.number)}formatTileText(e){if(!e)return"";const{suit:t,number:s}=e;return t===c.CRACK?`${s}C`:t===c.BAM?`${s}B`:t===c.DOT?`${s}D`:t===c.WIND?Y[s]||"":t===c.DRAGON?X[s]||"D":t===c.FLOWER?`F${typeof s=="number"?s+1:1}`:t===c.JOKER?"J":t===c.BLANK?"BL":`${s??""}`}getTileSelectionKey(e,t){return e?typeof e.index=="number"&&e.index>=0?`idx-${e.index}`:`${e.suit}:${e.number}:${t}`:`missing-${t}`}cloneHandData(e){return e?typeof e.clone=="function"?e.clone():{tiles:Array.isArray(e.tiles)?e.tiles.map(t=>({...t})):[],exposures:Array.isArray(e.exposures)?e.exposures.map(t=>({type:t==null?void 0:t.type,tiles:Array.isArray(t==null?void 0:t.tiles)?t.tiles.map(s=>({...s})):[]})):[]}:null}}class W{constructor(e,t){this.container=e,this.playerData=t,this.element=null,this.render()}render(){this.element=document.createElement("div"),this.element.className="opponent-bar",this.element.dataset.player=this.playerData.position,this.element.innerHTML=`
            <div class="opponent-info">
                <span class="opponent-name"></span>
                <span class="tile-count"></span>
            </div>
            <div class="exposures"></div>
        `,this.container.appendChild(this.element),this.update(this.playerData)}update(e){if(!this.element)return;this.playerData=e;const t=this.element.querySelector(".opponent-name");t.textContent=`${e.name} (${this.getPositionName(e.position)})`;const s=this.element.querySelector(".tile-count"),n=e.tileCount;s.textContent=`${n} tile${n!==1?"s":""}`,this.updateExposures(e.exposures),this.setCurrentTurn(e.isCurrentTurn)}getPositionName(e){return["Bottom","East","North","West"][e]||"Unknown"}updateExposures(e){const t=this.element.querySelector(".exposures");t.innerHTML="",!(!e||e.length===0)&&e.forEach(s=>{const n=document.createElement("span");n.className=`exposure-icon ${s.type.toLowerCase()}`,n.textContent=this.getExposureLabel(s.type),n.title=this.getExposureTooltip(s),t.appendChild(n)})}getExposureLabel(e){return{PUNG:"P",KONG:"K",QUINT:"Q"}[e]||"?"}getExposureTooltip(e){const t=e.tiles.map(s=>s.getText()).join(", ");return`${e.type}: ${t}`}setCurrentTurn(e){this.element&&(e?this.element.classList.add("current-turn"):this.element.classList.remove("current-turn"))}destroy(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}class F{constructor(e,t){this.container=e,this.gameController=t,this.discards=[],this.element=null,this.eventUnsubscribers=[],this.render(),this.setupEventListeners()}render(){this.element=document.createElement("div"),this.element.className="discard-pile",this.container.appendChild(this.element)}setupEventListeners(){this.eventUnsubscribers.push(this.gameController.on("TILE_DISCARDED",e=>{const t=C.fromJSON(e.tile);this.addDiscard(t,e.player)})),this.eventUnsubscribers.push(this.gameController.on("DISCARD_CLAIMED",()=>{this.removeLatestDiscard()})),this.eventUnsubscribers.push(this.gameController.on("GAME_STARTED",()=>{this.clear()}))}addDiscard(e,t){this.discards.push({tile:e,player:t});const s=this.createDiscardTile(e,t);this.element.appendChild(s),this.highlightLatest(s),this.scrollToBottom()}createDiscardTile(e,t){const s=document.createElement("div");return s.className="discard-tile",s.dataset.player=t,s.title=`Discarded by ${this.getPlayerName(t)}`,s.innerHTML=`
            <div class="discard-tile-face">
                <span class="tile-text">${this.getTileText(e)}</span>
            </div>
        `,s.addEventListener("click",()=>{this.showDiscardInfo(e,t)}),s}getTileText(e){return e.getText()}getPlayerName(e){return["You","Opponent 1","Opponent 2","Opponent 3"][e]||"Unknown"}highlightLatest(e){this.element.querySelectorAll(".discard-tile").forEach(t=>{t.classList.remove("latest")}),e.classList.add("latest")}removeLatestDiscard(){if(this.discards.length>0){this.discards.pop();const e=this.element.querySelector(".discard-tile:last-child");e&&e.remove()}}showDiscardInfo(e,t){alert(`${e.getText()}
Discarded by: ${this.getPlayerName(t)}`)}scrollToBottom(){this.element.scrollTop=this.element.scrollHeight}clear(){this.discards=[],this.element.innerHTML=""}destroy(){this.eventUnsubscribers.forEach(e=>e()),this.eventUnsubscribers=[],this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}const I=["tile-drawing","tile-discarding","tile-claiming-pulse","tile-claiming-move","tile-exposing"],O=["turn-starting","turn-ending"],D="hand-sorting",L="invalid-action",q=[{x:0,y:0},{x:90,y:-60},{x:0,y:-140},{x:-90,y:-60}],J=500,z=400,Q=600,Z=300,ee=500,H=50,te=16,g=(m,e=0)=>`${typeof m=="number"&&!Number.isNaN(m)?m:e}px`,se=m=>m?Array.isArray(m)?m.filter(Boolean):Array.from(m).filter(Boolean):[];class ne{constructor(e={}){this.duration=typeof e.duration=="number"?e.duration:300,this.easing=e.easing||"ease-out",this.prefersReducedMotion=typeof window<"u"&&typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this._elementTimers=new WeakMap}animateTileDraw(e,t={},s={}){return new Promise(n=>{if(!e){n();return}this._resetElementAnimation(e,I);const i={"--start-x":g(t.x,0),"--start-y":g(t.y,-200),"--end-x":g(s.x,0),"--end-y":g(s.y,0),"--tile-draw-duration":`${this.duration}ms`,"--tile-draw-easing":this.easing};this._setCssVariables(e,i),this._applyAnimationClass(e,"tile-drawing"),this._scheduleTimer(e,this.duration,()=>{e.classList.remove("tile-drawing"),this._clearCssVariables(e,Object.keys(i)),n()})})}animateTileDiscard(e,t={}){return new Promise(s=>{if(!e){s();return}this._resetElementAnimation(e,I);const n=this.duration+100,i={"--start-x":g(0),"--start-y":g(0),"--target-x":g(t.x,0),"--target-y":g(t.y,100),"--tile-discard-duration":`${n}ms`,"--tile-discard-easing":"ease-in"};this._setCssVariables(e,i),this._applyAnimationClass(e,"tile-discarding"),this._scheduleTimer(e,n,()=>{e.classList.remove("tile-discarding"),this._clearCssVariables(e,Object.keys(i)),s()})})}animateTileClaim(e,t=0,s={}){return new Promise(n=>{if(!e){n();return}this._resetElementAnimation(e,I);const i=q[t]||{x:0,y:-200},o={"--claim-offset-x":g(i.x,0),"--claim-offset-y":g(i.y,-200),"--target-x":g(s.x,0),"--target-y":g(s.y,0),"--tile-claim-duration":`${this.duration}ms`};this._setCssVariables(e,o),this._applyAnimationClass(e,"tile-claiming-pulse"),this._scheduleTimer(e,J,()=>{e.classList.remove("tile-claiming-pulse"),this._applyAnimationClass(e,"tile-claiming-move"),this._scheduleTimer(e,this.duration,()=>{e.classList.remove("tile-claiming-move"),this._clearCssVariables(e,Object.keys(o)),n()})})})}animateTurnStart(e){return this._runSimpleAnimation(e,"turn-starting",Q)}animateTurnEnd(e){return this._runSimpleAnimation(e,"turn-ending",Z)}animateHandSort(e){return this._runSimpleAnimation(e,D,z)}animateExposure(e,t={}){const s=se(e);return new Promise(n=>{if(!s.length){n();return}s.forEach((a,l)=>{this._resetElementAnimation(a,I);const d={"--target-x":g(t.x,0),"--target-y":g(t.y,0)};this._setCssVariables(a,d),a.style.animationDelay=this.prefersReducedMotion?"0ms":`${l*H}ms`,this._applyAnimationClass(a,"tile-exposing")});const i=this.duration+s.length*H,o=s[0];this._scheduleTimer(o,i,()=>{s.forEach(a=>{a.classList.remove("tile-exposing"),a.style.animationDelay="",this._clearCssVariables(a,["--target-x","--target-y"])}),n()})})}animateInvalidAction(e){return this._runSimpleAnimation(e,L,ee)}_runSimpleAnimation(e,t,s){return new Promise(n=>{if(!e){n();return}const i=[];O.includes(t)?i.push(...O):t===D?i.push(D):t===L&&i.push(L),this._resetElementAnimation(e,i),this._applyAnimationClass(e,t),this._scheduleTimer(e,s,()=>{e.classList.remove(t),n()})})}_resetElementAnimation(e,t=[]){e&&(this._cancelTimers(e),t.forEach(s=>e.classList.remove(s)))}_setCssVariables(e,t={}){!e||!e.style||Object.entries(t).forEach(([s,n])=>{n==null?e.style.removeProperty(s):e.style.setProperty(s,n)})}_clearCssVariables(e,t=[]){!e||!e.style||t.forEach(s=>e.style.removeProperty(s))}_applyAnimationClass(e,t){e&&(e.classList.remove(t),e.offsetWidth,e.classList.add(t))}_scheduleTimer(e,t,s){const n=this.prefersReducedMotion?Math.min(t,te):t,i=setTimeout(()=>{this._deregisterTimer(e,i),s()},n);return this._registerTimer(e,i),i}_registerTimer(e,t){if(!e)return;let s=this._elementTimers.get(e);s||(s=new Set,this._elementTimers.set(e,s)),s.add(t)}_deregisterTimer(e,t){if(!e)return;const s=this._elementTimers.get(e);s&&(s.delete(t),s.size===0&&this._elementTimers.delete(e))}_cancelTimers(e){if(!e)return;const t=this._elementTimers.get(e);t&&(t.forEach(s=>clearTimeout(s)),this._elementTimers.delete(e))}}const T={IDLE:"idle",TOUCHING:"touching",MOVED:"moved"};class ie{constructor(e,t={}){this.rootElement=e,this.options={tapMaxDuration:300,tapMaxMovement:10,doubleTapWindow:500,doubleTapDistance:20,longPressDuration:500,swipeMinDistance:50,enableDoubleTap:!1,enableLongPress:!1,enableSwipe:!1,...t},this.listeners={tap:[],doubletap:[],longpress:[],swipeup:[]},this.state=this.createInitialState(),this.handleTouchStart=this.handleTouchStart.bind(this),this.handleTouchMove=this.handleTouchMove.bind(this),this.handleTouchEnd=this.handleTouchEnd.bind(this),this.handleTouchCancel=this.handleTouchCancel.bind(this)}createInitialState(){return{current:T.IDLE,startTime:null,startX:null,startY:null,currentX:null,currentY:null,element:null,lastTapTime:null,lastTapX:null,lastTapY:null,longPressTimer:null}}init(){this.rootElement.addEventListener("touchstart",this.handleTouchStart,{passive:!1}),this.rootElement.addEventListener("touchmove",this.handleTouchMove,{passive:!1}),this.rootElement.addEventListener("touchend",this.handleTouchEnd,{passive:!1}),this.rootElement.addEventListener("touchcancel",this.handleTouchCancel,{passive:!1})}on(e,t){if(!this.listeners[e])throw new Error(`Unknown gesture type: ${e}`);this.listeners[e].push(t)}off(e,t){this.listeners[e]&&(this.listeners[e]=this.listeners[e].filter(s=>s!==t))}emit(e,t){t.element&&!document.body.contains(t.element)||this.listeners[e]&&this.listeners[e].forEach(s=>s(t))}destroy(){this.rootElement.removeEventListener("touchstart",this.handleTouchStart),this.rootElement.removeEventListener("touchmove",this.handleTouchMove),this.rootElement.removeEventListener("touchend",this.handleTouchEnd),this.rootElement.removeEventListener("touchcancel",this.handleTouchCancel),clearTimeout(this.state.longPressTimer)}getElementAtPoint(e,t){return document.elementFromPoint(e,t)}resetState(){clearTimeout(this.state.longPressTimer),this.state=this.createInitialState()}handleTouchStart(e){if(e.touches.length>1){this.resetState();return}const t=e.touches[0];this.state.current=T.TOUCHING,this.state.startTime=Date.now(),this.state.startX=t.clientX,this.state.startY=t.clientY,this.state.currentX=t.clientX,this.state.currentY=t.clientY,this.state.element=this.getElementAtPoint(t.clientX,t.clientY),this.options.enableLongPress&&(this.state.longPressTimer=setTimeout(()=>{this.state.current===T.TOUCHING&&Math.sqrt(Math.pow(this.state.currentX-this.state.startX,2)+Math.pow(this.state.currentY-this.state.startY,2))<this.options.tapMaxMovement&&(this.emit("longpress",{type:"longpress",element:this.state.element,coordinates:{x:this.state.startX,y:this.state.startY},timestamp:Date.now()}),this.resetState())},this.options.longPressDuration))}handleTouchMove(e){if(this.state.current===T.IDLE)return;const t=e.touches[0];this.state.currentX=t.clientX,this.state.currentY=t.clientY;const s=this.state.currentX-this.state.startX,n=this.state.currentY-this.state.startY;Math.sqrt(s*s+n*n)>this.options.tapMaxMovement&&(this.state.current=T.MOVED,clearTimeout(this.state.longPressTimer))}handleTouchEnd(e){if(this.state.current===T.IDLE)return;const t=e.changedTouches[0],s=Date.now()-this.state.startTime,n=Math.abs(t.clientX-this.state.startX),i=Math.abs(t.clientY-this.state.startY),o=Math.sqrt(n*n+i*i);clearTimeout(this.state.longPressTimer),this.state.current===T.TOUCHING&&s<this.options.tapMaxDuration&&o<this.options.tapMaxMovement?(this.emit("tap",{type:"tap",element:this.state.element,coordinates:{x:t.clientX,y:t.clientY},timestamp:Date.now(),target:e.target}),this.options.enableDoubleTap?this.checkDoubleTap(t.clientX,t.clientY):this.resetState()):this.state.current===T.MOVED?this.resetState():this.resetState()}handleTouchCancel(e){this.resetState()}checkDoubleTap(e,t){const s=Date.now(),n=this.state.lastTapTime,i=this.state.lastTapX,o=this.state.lastTapY,a=this.state.element;if(this.resetState(),n!==null){const l=s-n,d=Math.abs(e-i),r=Math.abs(t-o),h=Math.sqrt(d*d+r*r);if(l<this.options.doubleTapWindow&&h<this.options.doubleTapDistance){this.emit("doubletap",{type:"doubletap",element:a,coordinates:{x:e,y:t},timestamp:s});return}}this.state.lastTapTime=s,this.state.lastTapX=e,this.state.lastTapY=t}}const b={KEEP:"KEEP",PASS:"PASS",DISCARD:"DISCARD"};class oe{constructor(e,t,s="medium"){this.card=e,this.tableData=t,this.difficulty=s,this.config=this.getDifficultyConfig(s)}getDifficultyConfig(e){const t={easy:{maxPatterns:2,minDiscardable:5,exposureThreshold:70,courtesyThresholds:[55,65,75],blankExchangeRank:999,blankExchangeGain:999,jokerTopHands:1,jokerRankThreshold:60,jokerScaling:.8,discardRandomness:.3},medium:{maxPatterns:5,minDiscardable:4,exposureThreshold:55,courtesyThresholds:[50,60,68],blankExchangeRank:85,blankExchangeGain:25,jokerTopHands:2,jokerRankThreshold:55,jokerScaling:.9,discardRandomness:.1},hard:{maxPatterns:999,minDiscardable:3,exposureThreshold:45,courtesyThresholds:[45,55,65],blankExchangeRank:80,blankExchangeGain:20,jokerTopHands:3,jokerRankThreshold:50,jokerScaling:1,discardRandomness:0}};return t[e]||t.medium}calculateTileNeeds(e,t){const s=new Map;for(const n of t){const i=new Map;for(const o of n.componentInfoArray)for(const a of o.tileArray){const l=`${a.suit}-${a.number}`;i.set(l,(i.get(l)||0)+1)}for(const[o,a]of i.entries()){s.has(o)||s.set(o,{needed:0,have:0});const l=s.get(o);l.needed=Math.max(l.needed,a)}}for(const n of e){if(n.suit===c.JOKER||n.suit===c.BLANK)continue;const i=`${n.suit}-${n.number}`;s.has(i)||s.set(i,{needed:0,have:0}),s.get(i).have++}for(const n of s.values())n.needed=Math.min(n.needed,n.have);return s}countDiscardableTiles(e,t){const s=this.calculateTileNeeds(e,t);let n=0;for(const i of e){if(i.suit===c.JOKER||i.suit===c.BLANK)continue;const o=`${i.suit}-${i.number}`,a=s.get(o);(!a||a.needed===0)&&n++}return n}getTileRecommendations(e){const t=[],n=[...this.card.rankHandArray14(e)].sort((d,r)=>r.rank-d.rank),i=e.tiles;let o=n.length;for(this.config.maxPatterns<999&&(o=Math.min(o,this.config.maxPatterns));o>1;){const d=n.slice(0,o);if(this.countDiscardableTiles(i,d)>=this.config.minDiscardable)break;o--}o===0&&(o=1);const a=n.slice(0,o),l=this.calculateTileNeeds(i,a);for(const d of i){let r=b.DISCARD;if(d.suit===c.JOKER||d.suit===c.BLANK)r=b.KEEP;else{const h=`${d.suit}-${d.number}`,u=l.get(h);u&&u.needed>0&&(r=b.KEEP,u.needed--)}t.push({tile:d,recommendation:r})}return t.sort((d,r)=>{const h={[b.KEEP]:0,[b.PASS]:1,[b.DISCARD]:2},u=h[d.recommendation]-h[r.recommendation];if(u===0){const f=d.tile.suit===c.JOKER||d.tile.suit===c.BLANK?1:0;return(r.tile.suit===c.JOKER||r.tile.suit===c.BLANK?1:0)-f}return u}),{recommendations:t,consideredPatternCount:o}}chooseDiscard(e){const s=this.getTileRecommendations(e).recommendations;let n=null;const i=s.filter(o=>o.recommendation==="DISCARD"&&o.tile.suit!==c.BLANK);if(this.config.discardRandomness>0&&Math.random()<this.config.discardRandomness){const o=Math.floor(Math.random()*Math.min(3,i.length));n=i[o].tile}else for(let o=s.length-1;o>=0;o--){const a=s[o].tile;if(a.suit!==c.BLANK){n=a;break}}return!n&&s.length>0&&(n=s[s.length-1].tile),n}claimDiscard(e,t,s,n=!1){const i=s.clone();if(i.addTile(e.clone()),this.card.validateHand14(i).valid)return{playerOption:k.MAHJONG,tileArray:null};const a=this.card.rankHandArray14(i);this.card.sortHandRankArray(a);const l=a[0],d=s.exposures.length>0,r=n||l.rank>this.config.exposureThreshold;if(d||!l.hand.concealed&&r){let h=null;e:for(const u of l.componentInfoArray)for(const f of u.tileArray)if(f.equals(e)){h=u;break e}if(h&&this.validateComponentForExposure(h))return{playerOption:k.EXPOSE_TILES,tileArray:h.tileArray}}return{playerOption:k.DISCARD_TILE,tileArray:[e]}}validateComponentForExposure(e){return!(e.component.count<3||e.tileArray.length!==e.component.count)}charlestonPass(e){const t=[],s=e.clone(),n=new C(c.INVALID,P.INVALID);s.addTile(n);const a=this.getTileRecommendations(s).recommendations.filter(l=>!l.tile.equals(n)&&l.tile.suit!==c.JOKER&&l.tile.suit!==c.BLANK);a.sort((l,d)=>{const r={[b.DISCARD]:0,[b.PASS]:1,[b.KEEP]:2};return r[l.recommendation]-r[d.recommendation]});for(let l=0;l<3;l++)if(a.length>l){const d=a[l].tile;t.push(d)}return t}courtesyVote(e){const t=e.clone(),s=new C(c.INVALID,P.INVALID);t.addTile(s);const n=this.card.rankHandArray14(t);this.card.sortHandRankArray(n);const o=n[0].rank;this.card.printHandRankArray(n,1);const a=this.config.courtesyThresholds;return o<a[0]?3:o<a[1]?2:o<a[2]?1:0}courtesyPass(e,t){const n=this.getTileRecommendations(e).recommendations,i=[];for(let o=n.length-1;o>=0&&i.length<t;o--){const a=n[o].tile;a.suit===c.JOKER||a.suit===c.BLANK||i.push(a)}return i}exchangeTilesForJokers(e,t){if(!t||t.length===0)return{shouldExchange:!1,tile:null};const s=this.card.rankHandArray14(e),n=[...s].sort((l,d)=>d.rank-l.rank);let i=-1e5,o=null;const a=e.tiles;for(let l=0;l<a.length;l++){const d=a[l];let r=!1;for(const E of t)if(d.suit===E.suit&&d.number===E.number){r=!0;break}if(!r)continue;const h=e.clone();h.tiles[l]=new C(c.JOKER,0);const u=this.card.rankHandArray14(h);let f=0;const v=Math.min(this.config.jokerTopHands,n.length);for(let E=0;E<v;E++){const A=n[E],B=s.indexOf(A);let R=1;A.rank>this.config.jokerRankThreshold&&(R=Math.min(A.rank*this.config.jokerScaling,100)),f+=(u[B].rank-s[B].rank)*R}f>i&&(i=f,o=d)}return o&&i>0?{shouldExchange:!0,tile:o}:{shouldExchange:!1,tile:null}}}let p,N,w=[],y,M;function ae(){G.incrementGamesPlayed()}document.addEventListener("DOMContentLoaded",()=>{console.log("Mobile Mahjong app initializing...");const m=document.getElementById("loading");if(m&&(m.style.display="none"),!document.getElementById("mobile-settings-btn")){const e=document.querySelector(".bottom-menu")||createBottomMenu(),t=document.createElement("button");t.id="mobile-settings-btn",t.className="menu-btn",t.innerHTML="⚙️ SETTINGS",e.appendChild(t)}re()});async function re(){console.log("Initializing mobile game...");const m=document.getElementById("hand-container"),e=document.getElementById("discard-container"),t=document.getElementById("game-status"),s=document.getElementById("opponent-left"),n=document.getElementById("opponent-top"),i=document.getElementById("opponent-right"),o=new K(2025);await o.init(),N=new oe(o,null,"medium"),p=new U,await p.init({aiEngine:N,cardValidator:o,settings:{year:2025,difficulty:"medium",skipCharleston:!0}}),new ne,new j(m,p),new F(e,p);const a=[{container:i,playerIndex:1,position:"RIGHT"},{container:n,playerIndex:2,position:"TOP"},{container:s,playerIndex:3,position:"LEFT"}];for(const{container:r,playerIndex:h,position:u}of a){const f=p.players[h],v=new W(r,f);w.push({bar:v,playerIndex:h})}new ie(m),y=t,p.on("GAME_ENDED",()=>{ae(),y.textContent="Game Ended!"}),p.on("STATE_CHANGED",r=>{console.log("State changed:",r),y.textContent=`State: ${r.newState}`}),p.on("MESSAGE",r=>{console.log("Game message:",r.text),y.textContent=r.text}),p.on("HAND_UPDATED",r=>{const h=p.players[r.player];y.textContent=`Player ${r.player} (${h.name}):
${r.hand.tiles.length} hidden tiles
${r.hand.exposures.length} exposures`;const u=w.find(f=>f.playerIndex===r.player);u&&u.bar.update(h)}),p.on("TURN_CHANGED",r=>{w.forEach(({bar:h})=>{h.update(h.playerData)})}),p.on("UI_PROMPT",async r=>{if(console.log("UI_PROMPT received:",r.promptType,r.options),r.promptType==="CHOOSE_DISCARD"){const h=p.players[0];y.textContent="Choosing discard...";const u=await N.chooseDiscard(h.hand);console.log("Auto-discarding tile:",u),r.callback(u)}else r.promptType==="CLAIM_DISCARD"&&(y.textContent="Passing claim...",r.callback("Pass"))});const l=document.getElementById("new-game-btn");l&&(l.onclick=async()=>{console.log("NEW GAME button clicked!");try{console.log("Starting game...",p),await p.startGame(),console.log("Game started successfully")}catch(r){console.error("Error starting game:",r),y.textContent=`Error: ${r.message}`}});const d=document.getElementById("mobile-settings-btn");d&&!M&&(M=new $,d.onclick=()=>{M.show()}),y.textContent="Ready to play! Click NEW GAME to start.",console.log("Mobile game initialized successfully")}
