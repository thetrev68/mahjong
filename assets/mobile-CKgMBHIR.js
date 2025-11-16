import{S as h,e as d,m as f,n as E,D as C,P as T,C as O,A as H,G as U}from"./card-B8vZ1bZK.js";class ${constructor(){this.deferredPrompt=null,this.installBanner=null,this.init()}init(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),this.deferredPrompt=e,console.log("PWA install prompt captured"),this.checkShouldShowPrompt()}),window.addEventListener("appinstalled",()=>{console.log("PWA installed successfully"),this.markAsInstalled(),this.hidePrompt()}),this.createBannerUI()}checkShouldShowPrompt(){if(this.isAlreadyInstalled()){console.log("App already installed, skipping prompt");return}if(this.wasRecentlyDismissed()){console.log("User dismissed prompt recently, skipping");return}const e=this.getGamesPlayed();console.log(`Games played: ${e}`),e>=2&&setTimeout(()=>{this.showPrompt()},2e3)}getGamesPlayed(){return parseInt(localStorage.getItem("gamesPlayed")||"0",10)}static incrementGamesPlayed(){const e=parseInt(localStorage.getItem("gamesPlayed")||"0",10);localStorage.setItem("gamesPlayed",(e+1).toString()),console.log(`Games played: ${e+1}`)}isAlreadyInstalled(){return window.matchMedia("(display-mode: standalone)").matches?!0:localStorage.getItem("appInstalled")==="true"}wasRecentlyDismissed(){const e=localStorage.getItem("installPromptDismissedAt");if(!e)return!1;const t=parseInt(e,10),s=7*24*60*60*1e3;return Date.now()-t<s}markAsInstalled(){localStorage.setItem("appInstalled","true")}createBannerUI(){this.installBanner=document.createElement("div"),this.installBanner.id="install-banner",this.installBanner.className="install-banner",this.installBanner.style.display="none",this.installBanner.innerHTML=`
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
        `,document.head.appendChild(e)}showPrompt(){if(!this.deferredPrompt){console.log("No deferred prompt available");return}this.installBanner.style.display="block",console.log("Install banner shown")}hidePrompt(){this.installBanner&&(this.installBanner.style.display="none")}async handleInstall(){if(!this.deferredPrompt){console.error("No deferred prompt available");return}this.deferredPrompt.prompt();const{outcome:e}=await this.deferredPrompt.userChoice;console.log(`Install prompt outcome: ${e}`),e==="accepted"?(console.log("User accepted install"),this.markAsInstalled()):(console.log("User dismissed install"),this.handleDismiss()),this.deferredPrompt=null,this.hidePrompt()}handleDismiss(){localStorage.setItem("installPromptDismissedAt",Date.now().toString()),console.log("Install prompt dismissed by user"),this.hidePrompt()}}class G{constructor(){this.sheet=null,this.settingsButton=null,this.isOpen=!1,this.createUI(),this.loadSettings(),this.attachEventListeners()}createUI(){const e=h.getDefaults(),t=document.createElement("div");t.id="settings-overlay-mobile",t.className="settings-overlay-mobile";const s=document.createElement("div");s.id="settings-sheet",s.className="settings-sheet",s.innerHTML=`
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
        `,t.appendChild(s),document.body.appendChild(t),this.sheet=s,this.overlay=t}loadSettings(){const e=h.load();document.getElementById("mobile-year").value=e.cardYear,document.getElementById("mobile-difficulty").value=e.difficulty,document.getElementById("mobile-blank-tiles").checked=e.useBlankTiles,document.getElementById("mobile-bgm-volume").value=e.bgmVolume,document.getElementById("mobile-bgm-value").textContent=e.bgmVolume,document.getElementById("mobile-bgm-mute").checked=e.bgmMuted,document.getElementById("mobile-sfx-volume").value=e.sfxVolume,document.getElementById("mobile-sfx-value").textContent=e.sfxVolume,document.getElementById("mobile-sfx-mute").checked=e.sfxMuted,document.getElementById("mobile-training-mode").checked=e.trainingMode,document.getElementById("mobile-training-tiles").value=e.trainingTileCount,document.getElementById("mobile-skip-charleston").checked=e.skipCharleston,this.updateTrainingVisibility(e.trainingMode)}attachEventListeners(){const e=document.getElementById("mobile-settings-btn");e&&e.addEventListener("click",()=>this.open()),this.sheet.querySelector(".settings-sheet__close").addEventListener("click",()=>this.close()),this.overlay.addEventListener("click",t=>{t.target===this.overlay&&this.close()}),document.getElementById("mobile-bgm-volume").addEventListener("input",t=>{document.getElementById("mobile-bgm-value").textContent=t.target.value}),document.getElementById("mobile-sfx-volume").addEventListener("input",t=>{document.getElementById("mobile-sfx-value").textContent=t.target.value}),document.getElementById("mobile-training-mode").addEventListener("change",t=>{this.updateTrainingVisibility(t.target.checked)}),document.getElementById("mobile-settings-save").addEventListener("click",()=>{this.saveSettings(),this.close()}),document.getElementById("mobile-settings-reset").addEventListener("click",()=>{window.confirm("Reset all settings to defaults?")&&(h.reset(),this.loadSettings())})}saveSettings(){var t,s,i,n,o,r,m,c,p,y;const e={cardYear:parseInt(((t=document.getElementById("mobile-year"))==null?void 0:t.value)??h.getDefault("cardYear").toString()),difficulty:((s=document.getElementById("mobile-difficulty"))==null?void 0:s.value)??h.getDefault("difficulty"),useBlankTiles:((i=document.getElementById("mobile-blank-tiles"))==null?void 0:i.checked)??h.getDefault("useBlankTiles"),bgmVolume:parseInt(((n=document.getElementById("mobile-bgm-volume"))==null?void 0:n.value)??h.getDefault("bgmVolume").toString()),bgmMuted:((o=document.getElementById("mobile-bgm-mute"))==null?void 0:o.checked)??h.getDefault("bgmMuted"),sfxVolume:parseInt(((r=document.getElementById("mobile-sfx-volume"))==null?void 0:r.value)??h.getDefault("sfxVolume").toString()),sfxMuted:((m=document.getElementById("mobile-sfx-mute"))==null?void 0:m.checked)??h.getDefault("sfxMuted"),trainingMode:((c=document.getElementById("mobile-training-mode"))==null?void 0:c.checked)??h.getDefault("trainingMode"),trainingTileCount:parseInt(((p=document.getElementById("mobile-training-tiles"))==null?void 0:p.value)??h.getDefault("trainingTileCount").toString()),skipCharleston:((y=document.getElementById("mobile-skip-charleston"))==null?void 0:y.checked)??h.getDefault("skipCharleston"),trainingHand:h.getDefault("trainingHand")};h.save(e),console.log("Settings saved:",e),window.dispatchEvent(new window.CustomEvent("settingsChanged",{detail:e}))}updateTrainingVisibility(e){const t=document.getElementById("mobile-training-controls"),s=document.getElementById("mobile-training-skip");t&&(t.style.display=e?"block":"none"),s&&(s.style.display=e?"flex":"none")}open(){this.isOpen=!0,this.overlay.classList.add("open"),this.sheet.classList.add("open"),document.body.style.overflow="hidden"}close(){this.isOpen=!1,this.overlay.classList.remove("open"),this.sheet.classList.remove("open"),document.body.style.overflow=""}}const V={[d.CRACK]:"CRACK",[d.BAM]:"BAM",[d.DOT]:"DOT",[d.WIND]:"WIND",[d.DRAGON]:"DRAGON",[d.FLOWER]:"FLOWER",[d.JOKER]:"JOKER",[d.BLANK]:"BLANK"},K={[E.NORTH]:"N",[E.SOUTH]:"S",[E.WEST]:"W",[E.EAST]:"E"},W={[C.RED]:"R",[C.GREEN]:"G",[C.WHITE]:"0"};class q{constructor(e,t){if(!e)throw new Error("HandRenderer requires a container element");this.container=e,this.gameController=t,this.tiles=[],this.selectedIndices=new Set,this.selectionKeyByIndex=new Map,this.selectionBehavior={mode:"multiple",maxSelectable:1/0,allowToggle:!0},this.selectionListener=null,this.unsubscribeFns=[],this.interactive=!0,this.handContainer=null,this.exposedSection=null,this.currentHandData=null,this.setupDOM(),this.setupEventListeners()}setupDOM(){this.container.innerHTML="",this.container.classList.add("hand-section"),this.exposedSection=document.createElement("div"),this.exposedSection.className="exposed-section",this.container.appendChild(this.exposedSection),this.handContainer=document.createElement("div"),this.handContainer.className="hand-container hand-grid",this.container.appendChild(this.handContainer)}setupEventListeners(){if(!this.gameController||typeof this.gameController.on!="function")return;const e=(s={})=>{s.player===0&&this.render(s.hand)};this.unsubscribeFns.push(this.gameController.on("HAND_UPDATED",e));const t=(s={})=>{if(typeof s.index=="number"){this.selectTile(s.index,{toggle:s.toggle!==!1,clearOthers:!!s.exclusive,state:s.state});return}Array.isArray(s.indices)&&(s.clearExisting&&this.clearSelection(),s.indices.forEach(i=>{typeof i=="number"&&this.selectTile(i,{state:s.state??"on",toggle:!1})}))};this.unsubscribeFns.push(this.gameController.on("TILE_SELECTED",t))}render(e){if(!e){this.renderExposures([]),this.clearTiles(),this.currentHandData=null;return}this.currentHandData=e,this.renderExposures(Array.isArray(e.exposures)?e.exposures:[]),this.clearTiles();const t=new Set;this.selectionKeyByIndex.clear(),(Array.isArray(e.tiles)?e.tiles:[]).forEach((i,n)=>{const o=this.getTileSelectionKey(i,n);this.selectionKeyByIndex.set(n,o);const r=this.createTileButton(i,n,o);this.selectedIndices.has(o)&&(r.classList.add("selected"),t.add(o)),this.tiles.push(r),this.handContainer.appendChild(r)}),this.selectedIndices=t,this.setInteractive(this.interactive)}renderExposures(e){this.exposedSection&&(this.exposedSection.innerHTML="",!(!Array.isArray(e)||e.length===0)&&e.forEach(t=>{if(!t||!Array.isArray(t.tiles))return;const s=document.createElement("div");s.className="exposure-set",t.type&&(s.dataset.type=t.type),t.tiles.forEach(i=>{const n=document.createElement("button");n.type="button",n.className="exposed-tile",n.dataset.suit=this.getSuitName(i==null?void 0:i.suit),n.dataset.number=this.getDataNumber(i),n.textContent=this.formatTileText(i),s.appendChild(n)}),this.exposedSection.appendChild(s)}))}clearTiles(){this.tiles.forEach(e=>{const t=e.__handRendererHandler;t&&(e.removeEventListener("click",t),delete e.__handRendererHandler)}),this.tiles=[],this.selectionKeyByIndex.clear(),this.handContainer&&(this.handContainer.innerHTML="")}createTileButton(e,t,s){const i=document.createElement("button");i.type="button",i.className="tile-btn",i.dataset.suit=this.getSuitName(e==null?void 0:e.suit),i.dataset.number=this.getDataNumber(e),i.dataset.index=String(t),i.dataset.selectionKey=s,i.textContent=this.formatTileText(e),i.disabled=!this.interactive;const n=o=>{o.preventDefault(),o.stopPropagation(),this.interactive&&this.handleTileClick(t)};return i.__handRendererHandler=n,i.addEventListener("click",n),i}setSelectionBehavior(e={}){this.selectionBehavior={...this.selectionBehavior,...e}}setSelectionListener(e){this.selectionListener=typeof e=="function"?e:null}handleTileClick(e){const t=this.selectionKeyByIndex.get(e);if(!t)return;const s=this.selectedIndices.has(t),{mode:i,maxSelectable:n,allowToggle:o}=this.selectionBehavior;if(i==="single"){s&&o!==!1?this.selectTile(e,{state:"off",toggle:!1}):(this.clearSelection(!0),this.selectTile(e,{state:"on",toggle:!1}));return}if(s)o!==!1&&this.selectTile(e,{state:"off",toggle:!1});else{if(this.selectedIndices.size>=n)return;this.selectTile(e,{state:"on",toggle:!1})}}selectTile(e,t={}){const s=this.tiles[e];if(!s)return!1;const i=this.selectionKeyByIndex.get(e);if(!i)return!1;const{state:n,toggle:o=!0,clearOthers:r=!1,silent:m=!1}=t;r&&this.clearSelection(!0);let c;n==="on"?c=!0:n==="off"?c=!1:o?c=!this.selectedIndices.has(i):c=!0;let p=!1;return c?this.selectedIndices.has(i)||(this.selectedIndices.add(i),s.classList.add("selected"),p=!0):this.selectedIndices.delete(i)&&(s.classList.remove("selected"),p=!0),p&&!m&&this.notifySelectionChange(),p}clearSelection(e=!1){return this.selectedIndices.size===0?!1:(this.selectedIndices.clear(),this.tiles.forEach(t=>t.classList.remove("selected")),e||this.notifySelectionChange(),!0)}getSelectedTileIndices(){const e=[];for(const[t,s]of this.selectionKeyByIndex.entries())this.selectedIndices.has(s)&&e.push(t);return e}getSelectedTiles(){if(!this.currentHandData||!Array.isArray(this.currentHandData.tiles))return[];const e=[];for(const[t,s]of this.selectionKeyByIndex.entries()){if(!this.selectedIndices.has(s))continue;const i=this.currentHandData.tiles[t];if(!i)continue;const n=this.toTileData(i);n&&e.push(n)}return e}getSelectionState(){const e=this.getSelectedTileIndices();return{count:e.length,indices:e,tiles:this.getSelectedTiles()}}notifySelectionChange(){typeof this.selectionListener=="function"&&this.selectionListener(this.getSelectionState())}sortHand(e="suit"){var s;if(!this.currentHandData)return;if(typeof((s=this.gameController)==null?void 0:s.sortHand)=="function"){this.gameController.sortHand(0,e);return}const t=this.cloneHandData(this.currentHandData);t&&(e==="rank"?typeof t.sortByRank=="function"?t.sortByRank():Array.isArray(t.tiles)&&t.tiles.sort((i,n)=>i.number!==n.number?i.number-n.number:i.suit-n.suit):typeof t.sortBySuit=="function"?t.sortBySuit():Array.isArray(t.tiles)&&t.tiles.sort((i,n)=>i.suit!==n.suit?i.suit-n.suit:i.number-n.number),this.render(t))}setInteractive(e){this.interactive=!!e,this.tiles.forEach(t=>{t.disabled=!this.interactive})}destroy(){this.unsubscribeFns.forEach(e=>{typeof e=="function"&&e()}),this.unsubscribeFns=[],this.clearTiles(),this.clearSelection(),this.exposedSection&&(this.exposedSection.innerHTML=""),this.container=null,this.gameController=null,this.handContainer=null,this.exposedSection=null,this.currentHandData=null,this.selectionListener=null}getSuitName(e){return V[e]||"UNKNOWN"}getDataNumber(e){return!e||typeof e.number>"u"?"":String(e.number)}formatTileText(e){if(!e)return"";const{suit:t,number:s}=e;return t===d.CRACK?`${s}C`:t===d.BAM?`${s}B`:t===d.DOT?`${s}D`:t===d.WIND?K[s]||"":t===d.DRAGON?W[s]||"D":t===d.FLOWER?`F${typeof s=="number"?s+1:1}`:t===d.JOKER?"J":t===d.BLANK?"BL":`${s??""}`}getTileSelectionKey(e,t){return e?typeof e.index=="number"&&e.index>=0?`idx-${e.index}`:`${e.suit}:${e.number}:${t}`:`missing-${t}`}cloneHandData(e){return e?typeof e.clone=="function"?e.clone():{tiles:Array.isArray(e.tiles)?e.tiles.map(t=>({...t})):[],exposures:Array.isArray(e.exposures)?e.exposures.map(t=>({type:t==null?void 0:t.type,tiles:Array.isArray(t==null?void 0:t.tiles)?t.tiles.map(s=>({...s})):[]})):[]}:null}toTileData(e){return e?e instanceof f?e.clone():f.fromJSON(e):null}}class F{constructor(e,t=null){this.container=e,this.gameController=t,this.discards=[],this.element=null,this.eventUnsubscribers=[],this.render(),this.gameController&&this.setupEventListeners()}render(){this.element=document.createElement("div"),this.element.className="discard-pile",this.container.appendChild(this.element)}setupEventListeners(){!this.gameController||typeof this.gameController.on!="function"||(this.eventUnsubscribers.push(this.gameController.on("TILE_DISCARDED",e=>{const t=f.fromJSON(e.tile);this.addDiscard(t,e.player)})),this.eventUnsubscribers.push(this.gameController.on("DISCARD_CLAIMED",()=>{this.removeLatestDiscard()})),this.eventUnsubscribers.push(this.gameController.on("GAME_STARTED",()=>{this.clear()})))}addDiscard(e,t){this.discards.push({tile:e,player:t});const s=this.createDiscardTile(e,t);this.element.appendChild(s),this.highlightLatest(s),this.scrollToBottom()}createDiscardTile(e,t){const s=document.createElement("div");return s.className="discard-tile",s.dataset.player=t,s.title=`Discarded by ${this.getPlayerName(t)}`,s.innerHTML=`
            <div class="discard-tile-face">
                <span class="tile-text">${this.getTileText(e)}</span>
            </div>
        `,s.addEventListener("click",()=>{this.showDiscardInfo(e,t)}),s}getTileText(e){return e.getText()}getPlayerName(e){return["You","Opponent 1","Opponent 2","Opponent 3"][e]||"Unknown"}highlightLatest(e){this.element.querySelectorAll(".discard-tile").forEach(t=>{t.classList.remove("latest")}),e.classList.add("latest")}removeLatestDiscard(){if(this.discards.length>0){this.discards.pop();const e=this.element.querySelector(".discard-tile:last-child");e&&e.remove()}}showDiscardInfo(e,t){alert(`${e.getText()}
Discarded by: ${this.getPlayerName(t)}`)}scrollToBottom(){this.element.scrollTop=this.element.scrollHeight}clear(){this.discards=[],this.element.innerHTML=""}destroy(){this.eventUnsubscribers.forEach(e=>e()),this.eventUnsubscribers=[],this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}class Y{constructor(e,t){this.container=e,this.playerData=t,this.element=null,this.render()}render(){this.element=document.createElement("div"),this.element.className="opponent-bar",this.element.dataset.player=this.playerData.position,this.element.innerHTML=`
            <div class="opponent-info">
                <span class="opponent-name"></span>
                <span class="tile-count"></span>
            </div>
            <div class="exposures"></div>
        `,this.container.appendChild(this.element),this.update(this.playerData)}update(e){if(!this.element)return;this.playerData=e;const t=this.element.querySelector(".opponent-name");t.textContent=`${e.name} (${this.getPositionName(e.position)})`;const s=this.element.querySelector(".tile-count"),i=e.tileCount;s.textContent=`${i} tile${i!==1?"s":""}`,this.updateExposures(e.exposures),this.setCurrentTurn(e.isCurrentTurn)}getPositionName(e){return["Bottom","East","North","West"][e]||"Unknown"}updateExposures(e){const t=this.element.querySelector(".exposures");t.innerHTML="",!(!e||e.length===0)&&e.forEach(s=>{const i=document.createElement("span");i.className=`exposure-icon ${s.type.toLowerCase()}`,i.textContent=this.getExposureLabel(s.type),i.title=this.getExposureTooltip(s),t.appendChild(i)})}getExposureLabel(e){return{PUNG:"P",KONG:"K",QUINT:"Q"}[e]||"?"}getExposureTooltip(e){const t=e.tiles.map(s=>s.getText()).join(", ");return`${e.type}: ${t}`}setCurrentTurn(e){this.element&&(e?this.element.classList.add("current-turn"):this.element.classList.remove("current-turn"))}destroy(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null}}const v=["tile-drawing","tile-discarding","tile-claiming-pulse","tile-claiming-move","tile-exposing"],D=["turn-starting","turn-ending"],_="hand-sorting",I="invalid-action",j=[{x:0,y:0},{x:90,y:-60},{x:0,y:-140},{x:-90,y:-60}],z=500,J=400,X=600,Q=300,Z=500,N=50,ee=16,u=(a,e=0)=>`${typeof a=="number"&&!Number.isNaN(a)?a:e}px`,te=a=>a?Array.isArray(a)?a.filter(Boolean):Array.from(a).filter(Boolean):[];class se{constructor(e={}){this.duration=typeof e.duration=="number"?e.duration:300,this.easing=e.easing||"ease-out",this.prefersReducedMotion=typeof window<"u"&&typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,this._elementTimers=new WeakMap}animateTileDraw(e,t={},s={}){return new Promise(i=>{if(!e){i();return}this._resetElementAnimation(e,v);const n={"--start-x":u(t.x,0),"--start-y":u(t.y,-200),"--end-x":u(s.x,0),"--end-y":u(s.y,0),"--tile-draw-duration":`${this.duration}ms`,"--tile-draw-easing":this.easing};this._setCssVariables(e,n),this._applyAnimationClass(e,"tile-drawing"),this._scheduleTimer(e,this.duration,()=>{e.classList.remove("tile-drawing"),this._clearCssVariables(e,Object.keys(n)),i()})})}animateTileDiscard(e,t={}){return new Promise(s=>{if(!e){s();return}this._resetElementAnimation(e,v);const i=this.duration+100,n={"--start-x":u(0),"--start-y":u(0),"--target-x":u(t.x,0),"--target-y":u(t.y,100),"--tile-discard-duration":`${i}ms`,"--tile-discard-easing":"ease-in"};this._setCssVariables(e,n),this._applyAnimationClass(e,"tile-discarding"),this._scheduleTimer(e,i,()=>{e.classList.remove("tile-discarding"),this._clearCssVariables(e,Object.keys(n)),s()})})}animateTileClaim(e,t=0,s={}){return new Promise(i=>{if(!e){i();return}this._resetElementAnimation(e,v);const n=j[t]||{x:0,y:-200},o={"--claim-offset-x":u(n.x,0),"--claim-offset-y":u(n.y,-200),"--target-x":u(s.x,0),"--target-y":u(s.y,0),"--tile-claim-duration":`${this.duration}ms`};this._setCssVariables(e,o),this._applyAnimationClass(e,"tile-claiming-pulse"),this._scheduleTimer(e,z,()=>{e.classList.remove("tile-claiming-pulse"),this._applyAnimationClass(e,"tile-claiming-move"),this._scheduleTimer(e,this.duration,()=>{e.classList.remove("tile-claiming-move"),this._clearCssVariables(e,Object.keys(o)),i()})})})}animateTurnStart(e){return this._runSimpleAnimation(e,"turn-starting",X)}animateTurnEnd(e){return this._runSimpleAnimation(e,"turn-ending",Q)}animateHandSort(e){return this._runSimpleAnimation(e,_,J)}animateExposure(e,t={}){const s=te(e);return new Promise(i=>{if(!s.length){i();return}s.forEach((r,m)=>{this._resetElementAnimation(r,v);const c={"--target-x":u(t.x,0),"--target-y":u(t.y,0)};this._setCssVariables(r,c),r.style.animationDelay=this.prefersReducedMotion?"0ms":`${m*N}ms`,this._applyAnimationClass(r,"tile-exposing")});const n=this.duration+s.length*N,o=s[0];this._scheduleTimer(o,n,()=>{s.forEach(r=>{r.classList.remove("tile-exposing"),r.style.animationDelay="",this._clearCssVariables(r,["--target-x","--target-y"])}),i()})})}animateInvalidAction(e){return this._runSimpleAnimation(e,I,Z)}_runSimpleAnimation(e,t,s){return new Promise(i=>{if(!e){i();return}const n=[];D.includes(t)?n.push(...D):t===_?n.push(_):t===I&&n.push(I),this._resetElementAnimation(e,n),this._applyAnimationClass(e,t),this._scheduleTimer(e,s,()=>{e.classList.remove(t),i()})})}_resetElementAnimation(e,t=[]){e&&(this._cancelTimers(e),t.forEach(s=>e.classList.remove(s)))}_setCssVariables(e,t={}){!e||!e.style||Object.entries(t).forEach(([s,i])=>{i==null?e.style.removeProperty(s):e.style.setProperty(s,i)})}_clearCssVariables(e,t=[]){!e||!e.style||t.forEach(s=>e.style.removeProperty(s))}_applyAnimationClass(e,t){e&&(e.classList.remove(t),e.offsetWidth,e.classList.add(t))}_scheduleTimer(e,t,s){const i=this.prefersReducedMotion?Math.min(t,ee):t,n=setTimeout(()=>{this._deregisterTimer(e,n),s()},i);return this._registerTimer(e,n),n}_registerTimer(e,t){if(!e)return;let s=this._elementTimers.get(e);s||(s=new Set,this._elementTimers.set(e,s)),s.add(t)}_deregisterTimer(e,t){if(!e)return;const s=this._elementTimers.get(e);s&&(s.delete(t),s.size===0&&this._elementTimers.delete(e))}_cancelTimers(e){if(!e)return;const t=this._elementTimers.get(e);t&&(t.forEach(s=>clearTimeout(s)),this._elementTimers.delete(e))}}const R=T.BOTTOM;class ie{constructor(e={}){if(!e.gameController)throw new Error("MobileRenderer requires a GameController instance");this.gameController=e.gameController,this.statusElement=e.statusElement||null,this.subscriptions=[],this.handRenderer=new q(e.handContainer),this.discardPile=new F(e.discardContainer),this.animationController=new se,this.handRenderer.setSelectionBehavior({mode:"multiple",maxSelectable:1/0,allowToggle:!0}),this.handRenderer.setSelectionListener(t=>this.onHandSelectionChange(t)),this.opponentBars=this.createOpponentBars(e.opponentContainers||{}),this.promptUI=this.createPromptUI(e.promptRoot||document.body),this.pendingPrompt=null,this.latestHandSnapshot=null,this.registerEventListeners()}destroy(){var e,t,s,i;this.subscriptions.forEach(n=>{typeof n=="function"&&n()}),this.subscriptions=[],(e=this.handRenderer)==null||e.destroy(),(t=this.discardPile)==null||t.destroy(),(i=(s=this.promptUI)==null?void 0:s.container)==null||i.remove(),this.pendingPrompt=null}registerEventListeners(){const e=this.gameController;this.subscriptions.push(e.on("GAME_STARTED",t=>this.onGameStarted(t))),this.subscriptions.push(e.on("GAME_ENDED",t=>this.onGameEnded(t))),this.subscriptions.push(e.on("STATE_CHANGED",t=>this.onStateChanged(t))),this.subscriptions.push(e.on("HAND_UPDATED",t=>this.onHandUpdated(t))),this.subscriptions.push(e.on("TURN_CHANGED",t=>this.onTurnChanged(t))),this.subscriptions.push(e.on("TILE_DISCARDED",t=>this.onTileDiscarded(t))),this.subscriptions.push(e.on("DISCARD_CLAIMED",()=>this.discardPile.removeLatestDiscard())),this.subscriptions.push(e.on("TILES_EXPOSED",()=>this.refreshOpponentBars())),this.subscriptions.push(e.on("MESSAGE",t=>this.onMessage(t))),this.subscriptions.push(e.on("CHARLESTON_PHASE",t=>{this.updateStatus(`Charleston ${t.phase}: Pass ${t.round}`)})),this.subscriptions.push(e.on("COURTESY_VOTE",t=>{this.updateStatus(`Player ${t.player} voted ${t.vote} for courtesy pass`)})),this.subscriptions.push(e.on("COURTESY_PASS",()=>{this.refreshOpponentBars()})),this.subscriptions.push(e.on("UI_PROMPT",t=>this.handleUIPrompt(t)))}createOpponentBars(e){const t=[];return[{key:"right",playerIndex:T.RIGHT},{key:"top",playerIndex:T.TOP},{key:"left",playerIndex:T.LEFT}].forEach(({key:i,playerIndex:n})=>{const o=e[i];if(!o)return;const r=this.gameController.players[n],m=new Y(o,r);t.push({playerIndex:n,bar:m})}),t}createPromptUI(e){const t=document.createElement("div");t.className="mobile-prompt hidden";const s=document.createElement("div");s.className="mobile-prompt__message",t.appendChild(s);const i=document.createElement("div");i.className="mobile-prompt__hint",t.appendChild(i);const n=document.createElement("div");return n.className="mobile-prompt__actions",t.appendChild(n),e.appendChild(t),{container:t,message:s,hint:i,actions:n,primaryButton:null}}onGameStarted(){this.discardPile.clear(),this.resetHandSelection(),this.updateStatus("Game started – dealing tiles..."),this.refreshOpponentBars()}onGameEnded(e){var s;const t=(e==null?void 0:e.reason)??"end";if(t==="mahjong"){const i=(s=this.gameController.players)==null?void 0:s[e.winner];this.updateStatus(i?`${i.name} wins!`:"Mahjong!")}else t==="wall_game"?this.updateStatus("Wall game – no winner"):this.updateStatus("Game ended");this.hidePrompt(),this.resetHandSelection()}onStateChanged(e){e&&this.updateStatus(`State: ${e.newState}`)}onHandUpdated(e){if(!e)return;const t=this.gameController.players[e.player];if(t)if(e.player===R)this.latestHandSnapshot=e.hand,this.handRenderer.render(e.hand);else{const s=this.opponentBars.find(i=>i.playerIndex===e.player);s&&s.bar.update(t)}}onTurnChanged(e){const t=(e==null?void 0:e.currentPlayer)??this.gameController.currentPlayer;this.gameController.players.forEach((s,i)=>{s.isCurrentTurn=i===t}),this.refreshOpponentBars(),t===R&&this.updateStatus("Your turn")}onTileDiscarded(e){if(!(e!=null&&e.tile))return;const t=f.fromJSON(e.tile);this.discardPile.addDiscard(t,e.player)}onMessage(e){e!=null&&e.text&&this.updateStatus(e.text)}refreshOpponentBars(){this.opponentBars.forEach(({playerIndex:e,bar:t})=>{const s=this.gameController.players[e];s&&t.update(s)})}updateStatus(e){this.statusElement&&(this.statusElement.textContent=e)}handleUIPrompt(e){var t,s,i,n,o,r,m,c,p,y,A,k,B,L,P;if(e)switch(this.hidePrompt(),this.pendingPrompt=null,e.promptType){case"CHOOSE_DISCARD":this.startTileSelectionPrompt({title:"Choose a tile to discard",hint:"Tap one tile and press Discard",min:1,max:1,confirmLabel:"Discard",cancelLabel:"Auto Discard",fallback:()=>this.getFallbackTiles(1),callback:l=>e.callback(l[0])});break;case"CHARLESTON_PASS":this.startTileSelectionPrompt({title:`Charleston Pass (${((t=e.options)==null?void 0:t.direction)??"?"})`,hint:`Select ${((s=e.options)==null?void 0:s.requiredCount)??3} tiles to pass`,min:((i=e.options)==null?void 0:i.requiredCount)??3,max:((n=e.options)==null?void 0:n.requiredCount)??3,confirmLabel:"Pass Tiles",cancelLabel:"Auto Select",fallback:()=>{var l;return this.getFallbackTiles(((l=e.options)==null?void 0:l.requiredCount)??3)},callback:l=>e.callback(l)});break;case"SELECT_TILES":this.startTileSelectionPrompt({title:((o=e.options)==null?void 0:o.question)??"Select tiles",hint:`Select ${((r=e.options)==null?void 0:r.minTiles)??1}–${((m=e.options)==null?void 0:m.maxTiles)??3} tiles`,min:((c=e.options)==null?void 0:c.minTiles)??1,max:((p=e.options)==null?void 0:p.maxTiles)??3,confirmLabel:"Confirm",cancelLabel:"Cancel",fallback:()=>{var l;return this.getFallbackTiles(Math.max(1,((l=e.options)==null?void 0:l.minTiles)??1))},callback:l=>e.callback(l)});break;case"CLAIM_DISCARD":{const l=(y=e.options)==null?void 0:y.tile,w=l instanceof f?l:l?f.fromJSON(l):null;this.showChoicePrompt({title:w?`Claim ${w.getText()}?`:"Claim discard?",hint:"Choose how to react",options:(((A=e.options)==null?void 0:A.options)||[]).map(S=>({label:S,value:S})),onSelect:S=>e.callback(S)});break}case"EXPOSE_TILES":this.showChoicePrompt({title:"Expose selected tiles?",hint:"Exposed tiles become visible to everyone",options:[{label:"Expose",value:!0,primary:!0},{label:"Keep Hidden",value:!1}],onSelect:l=>e.callback(l)});break;case"YES_NO":this.showChoicePrompt({title:((k=e.options)==null?void 0:k.message)??"Continue?",hint:"",options:[{label:"Yes",value:!0,primary:!0},{label:"No",value:!1}],onSelect:l=>e.callback(l)});break;case"CHARLESTON_CONTINUE":this.showChoicePrompt({title:((B=e.options)==null?void 0:B.question)??"Continue to Charleston phase 2?",hint:"",options:[{label:"Yes",value:"Yes",primary:!0},{label:"No",value:"No"}],onSelect:l=>e.callback(l)});break;case"COURTESY_VOTE":this.showChoicePrompt({title:((L=e.options)==null?void 0:L.question)??"Courtesy pass vote",hint:"How many tiles to exchange?",options:(((P=e.options)==null?void 0:P.options)||["0","1","2","3"]).map(l=>({label:l,value:l})),onSelect:l=>e.callback(l)});break;default:console.warn(`Unhandled UI prompt: ${e.promptType}`),e.callback(null)}}startTileSelectionPrompt(e){this.updateStatus(e.title),this.pendingPrompt={type:"tile-selection",min:e.min,max:e.max,callback:e.callback,fallback:e.fallback},this.handRenderer.setSelectionBehavior({mode:e.max===1?"single":"multiple",maxSelectable:e.max,allowToggle:!0}),this.handRenderer.clearSelection(!0),this.showPrompt(e.title,e.hint,[{label:e.confirmLabel??"Confirm",primary:!0,disabled:!0,onClick:()=>this.resolveTileSelectionPrompt()},{label:e.cancelLabel??"Use Suggestion",onClick:()=>this.cancelTileSelectionPrompt()}]),this.updateTileSelectionHint()}onHandSelectionChange(e){!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection"||this.updateTileSelectionHint(e)}updateTileSelectionHint(e=this.handRenderer.getSelectionState()){if(!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection")return;const{min:t,max:s}=this.pendingPrompt,i=e.count,n=i>=t&&i<=s;this.setPromptHint(`Selected ${i}/${s}${t===s?"":` (need at least ${t})`}`),this.setPrimaryEnabled(n)}resolveTileSelectionPrompt(){if(!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection")return;const e=this.handRenderer.getSelectionState(),{min:t,max:s}=this.pendingPrompt;if(e.count<t||e.count>s)return;const i=this.pendingPrompt.callback;this.resetHandSelection(),this.hidePrompt(),this.pendingPrompt=null,i(e.tiles)}cancelTileSelectionPrompt(){if(!this.pendingPrompt||this.pendingPrompt.type!=="tile-selection")return;const e=this.pendingPrompt.fallback,t=this.pendingPrompt.max,s=typeof e=="function"?e():[],i=this.pendingPrompt.callback;this.resetHandSelection(),this.hidePrompt(),this.pendingPrompt=null,i(t===1?s[0]??null:s)}resetHandSelection(){this.handRenderer.clearSelection(!0),this.handRenderer.setSelectionBehavior({mode:"multiple",maxSelectable:1/0,allowToggle:!0})}showChoicePrompt({title:e,hint:t,options:s,onSelect:i}){this.updateStatus(e);const n=(s||[]).map(o=>({label:o.label,primary:o.primary,onClick:()=>{this.hidePrompt(),i(o.value)}}));this.showPrompt(e,t,n)}showPrompt(e,t,s){this.promptUI.message.textContent=e,this.setPromptHint(t),this.promptUI.actions.innerHTML="",this.promptUI.primaryButton=null,s.forEach(i=>{const n=document.createElement("button");n.textContent=i.label,i.primary&&(n.classList.add("primary"),this.promptUI.primaryButton=n),i.disabled&&(n.disabled=!0),n.addEventListener("click",i.onClick),this.promptUI.actions.appendChild(n)}),this.promptUI.container.classList.remove("hidden")}hidePrompt(){this.promptUI.container.classList.add("hidden"),this.promptUI.primaryButton=null}setPromptHint(e){this.promptUI.hint&&(this.promptUI.hint.textContent=e??"")}setPrimaryEnabled(e){this.promptUI.primaryButton&&(this.promptUI.primaryButton.disabled=!e)}getFallbackTiles(e=1){return!this.latestHandSnapshot||!Array.isArray(this.latestHandSnapshot.tiles)?[]:this.latestHandSnapshot.tiles.slice(0,e).map(t=>t instanceof f?t.clone():f.fromJSON(t)).filter(Boolean)}}let b,M,g,x;function ne(){$.incrementGamesPlayed()}function oe(){const a=document.createElement("div");return a.className="bottom-menu",document.body.appendChild(a),a}document.addEventListener("DOMContentLoaded",()=>{console.log("Mobile Mahjong app initializing...");const a=document.getElementById("loading");if(a&&(a.style.display="none"),!document.getElementById("mobile-settings-btn")){const e=document.querySelector(".bottom-menu")||oe(),t=document.createElement("button");t.id="mobile-settings-btn",t.className="menu-btn",t.innerHTML="⚙️ SETTINGS",e.appendChild(t)}le()});async function le(){console.log("Initializing mobile game...");const a=document.getElementById("hand-container"),e=document.getElementById("discard-container"),t=document.getElementById("game-status"),s=document.getElementById("opponent-left"),i=document.getElementById("opponent-top"),n=document.getElementById("opponent-right"),o=new O(2025);await o.init(),M=new H(o,null,"medium"),b=new U,await b.init({aiEngine:M,cardValidator:o,settings:{year:2025,difficulty:"medium",skipCharleston:!1}}),g=new ie({gameController:b,handContainer:a,discardContainer:e,statusElement:t,opponentContainers:{left:s,top:i,right:n},promptRoot:document.body}),b.on("GAME_ENDED",()=>ne());const r=document.getElementById("new-game-btn");r&&(r.onclick=async()=>{console.log("NEW GAME button clicked!");try{console.log("Starting game...",b),g==null||g.updateStatus("Starting game..."),await b.startGame(),console.log("Game started successfully")}catch(c){console.error("Error starting game:",c),g==null||g.updateStatus(`Error: ${c.message}`)}});const m=document.getElementById("mobile-settings-btn");m&&!x&&(x=new G,m.onclick=()=>{x.open()}),g.updateStatus("Ready to play! Click NEW GAME to start."),console.log("Mobile game initialized successfully")}
