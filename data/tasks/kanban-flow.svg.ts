/* the "how the two work together" diagram on the Kanban page, drawn in the same dark plate as the writing diagrams */
export const kanbanFlowSvg = `<svg viewBox="0 0 1150 500" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
<defs>
<marker id="kb-cy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#67e8f9"/></marker>
<marker id="kb-vi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a78bfa"/></marker>
<marker id="kb-gr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#86efac"/></marker>
<marker id="kb-bl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#60a5fa"/></marker>
<marker id="kb-am" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fcd34d"/></marker>
</defs>
<rect width="1150" height="500" fill="#070707"/>
<text x="30" y="34" fill="#e5e5e5" font-size="15" font-weight="700">ONE CHANGE, EVERY SCREEN</text>
<text x="30" y="54" fill="rgba(255,255,255,0.4)" font-size="12">Add a task or drag a card, and every open browser shows it</text>
<rect x="30" y="90" width="270" height="120" rx="6" fill="#0e0e0e" stroke="#67e8f9" stroke-opacity="0.65" stroke-width="1.4"/>
<text x="48" y="124" fill="#67e8f9" font-size="16" font-weight="700">Angular app</text>
<text x="48" y="152" fill="rgba(255,255,255,0.6)" font-size="13">board, columns, drag and drop</text>
<text x="48" y="174" fill="rgba(255,255,255,0.6)" font-size="13">add / edit dialog</text>
<rect x="400" y="90" width="270" height="120" rx="6" fill="#0e0e0e" stroke="#a78bfa" stroke-opacity="0.65" stroke-width="1.4"/>
<text x="418" y="124" fill="#a78bfa" font-size="16" font-weight="700">Spring Boot API</text>
<text x="418" y="152" fill="rgba(255,255,255,0.6)" font-size="13">/api/tasks</text>
<text x="418" y="174" fill="rgba(255,255,255,0.6)" font-size="13">controller → service → repo</text>
<rect x="820" y="90" width="300" height="120" rx="6" fill="#0e0e0e" stroke="#fcd34d" stroke-opacity="0.65" stroke-width="1.4"/>
<text x="838" y="124" fill="#fcd34d" font-size="16" font-weight="700">MySQL</text>
<text x="838" y="152" fill="rgba(255,255,255,0.6)" font-size="13">tasks · users</text>
<text x="838" y="174" fill="rgba(255,255,255,0.6)" font-size="13">user_task (who is assigned)</text>
<rect x="400" y="300" width="270" height="120" rx="6" fill="#0e0e0e" stroke="#86efac" stroke-opacity="0.65" stroke-width="1.4"/>
<text x="418" y="334" fill="#86efac" font-size="16" font-weight="700">WebSocket channel</text>
<text x="418" y="362" fill="rgba(255,255,255,0.6)" font-size="13">STOMP over SockJS</text>
<text x="418" y="384" fill="rgba(255,255,255,0.6)" font-size="13">/topic/tasks</text>
<rect x="820" y="300" width="300" height="120" rx="6" fill="#0e0e0e" stroke="#60a5fa" stroke-opacity="0.65" stroke-width="1.4"/>
<text x="838" y="334" fill="#60a5fa" font-size="16" font-weight="700">Every open browser</text>
<text x="838" y="362" fill="rgba(255,255,255,0.6)" font-size="13">subscribed to /topic/tasks</text>
<text x="838" y="384" fill="rgba(255,255,255,0.6)" font-size="13">reloads the task list</text>
<path d="M300,150 L398,150" fill="none" stroke="#67e8f9" stroke-width="1.8" marker-end="url(#kb-cy)"/>
<text x="349" y="138" fill="#67e8f9" font-size="13" text-anchor="middle">1 · send</text>
<path d="M670,150 L818,150" fill="none" stroke="#a78bfa" stroke-width="1.8" marker-end="url(#kb-vi)"/>
<text x="744" y="138" fill="#a78bfa" font-size="13" text-anchor="middle">2 · save</text>
<path d="M535,210 L535,298" fill="none" stroke="#a78bfa" stroke-width="1.8" marker-end="url(#kb-vi)"/>
<text x="548" y="262" fill="#a78bfa" font-size="13" text-anchor="start">3 · announce</text>
<path d="M670,360 L818,360" fill="none" stroke="#86efac" stroke-width="1.8" marker-end="url(#kb-gr)"/>
<text x="744" y="348" fill="#86efac" font-size="13" text-anchor="middle">4 · signal</text>
<path d="M900,298 C 860,260 760,230 672,190" fill="none" stroke="#60a5fa" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#kb-bl)"/>
<text x="915" y="284" fill="#60a5fa" font-size="13" text-anchor="start">5 · GET /api/tasks</text>
<text x="30" y="470" fill="rgba(255,255,255,0.5)" font-size="13">The message in step 4 is only a signal. Browsers ignore what is in it and ask the API for the current list.</text>
</svg>`;
