/**
 * RECALLOPS — AI INCIDENT RESPONSE AGENT
 * Powered by Hindsight Memory
 *
 * Features:
 * - Incident list with detail view and AI recommendations
 * - Hindsight memory recall: similar incidents, confidence scores
 * - New Incident modal with analysis simulation
 * - Memory bank with search and filter
 * - Runbooks with detail view
 * - Post-mortem form that saves to memory
 * - Learning dashboard with metrics and before/after comparison
 * - Backend API fetch() integration ready
 */

// ============================================================================
// 1. CONFIGURATION & STATE MANAGEMENT
// ============================================================================

const API_CONFIG = {
  useBackend: false,
  endpoint: 'http://localhost:8000/api',
  threshold: 0.72,
  maxMemories: 4
};

// Mock Incidents
const INCIDENTS = [
  {
    id: 'INC-1042',
    service: 'Payment API',
    title: 'Database Connection Timeout',
    severity: 'critical',
    status: 'investigating',
    time: '4 min ago',
    errorRate: '37%',
    responseTime: '8s avg',
    symptom: 'Database connection pool exhausted',
    logs: '[10:42:01] ERROR: connection pool exhausted (pool_size=10, overflow=0)\n[10:42:03] ERROR: psycopg2.OperationalError: too many connections\n[10:42:05] WARN: 429 responses increasing — downstream services timing out\n[10:42:08] ERROR: payment-service: upstream dependency unreachable',
    recommendation: 'Check the database connection pool size and verify whether a recent deployment changed pool configuration or caused connection leak. Increasing max_pool_size and restarting the API service has resolved this pattern in 2 prior incidents.',
    confidence: 92,
    basedOnCount: 3,
    similarIncidents: [
      { id: 'INC-0871', match: 94, service: 'Payment API', title: 'Database Connection Pool Exhaustion', resolution: 'Increased connection pool size (10→50) → Restarted API service', outcome: 'Resolved in 11 minutes', matchReasons: ['Same service', 'Same error pattern (psycopg2.OperationalError)', 'Same database symptom', 'Successful resolution verified'] },
      { id: 'INC-0724', match: 81, service: 'Order Service', title: 'Database Connection Saturation', resolution: 'Rolled back deployment that introduced connection leak', outcome: 'Resolved in 23 minutes', matchReasons: ['Similar connection exhaustion pattern', 'Rollback successfully resolved incident', 'Post-deployment trigger identified'] },
      { id: 'INC-0612', match: 76, service: 'Inventory API', title: 'DB Pool Limit Reached', resolution: 'Added idle connection timeout (600s) + pool monitoring alert', outcome: 'Resolved in 34 minutes', matchReasons: ['Similar pool exhaustion', 'Monitoring gap identified', 'Configuration fix applied'] }
    ],
    timeline: [
      { time: '10:42', event: 'Incident detected — alert triggered', type: 'detected' },
      { time: '10:43', event: 'AI analyzed symptoms and error patterns', type: 'ai' },
      { time: '10:43', event: '3 similar incidents retrieved from memory', type: 'memory' },
      { time: '10:44', event: 'Resolution recommended: increase connection pool', type: 'recommendation' },
      { time: '10:48', event: 'Connection pool increased (10 → 50)', type: 'action' },
      { time: '10:51', event: 'Error rate normalized — 4% and declining', type: 'progress' },
      { time: '10:53', event: 'Incident resolved', type: 'resolved' }
    ],
    memoriesUsed: [
      { id: 'INC-0871', similarity: '94%' },
      { id: 'INC-0724', similarity: '81%' },
      { id: 'INC-0612', similarity: '76%' }
    ]
  },
  {
    id: 'INC-1041',
    service: 'Authentication Service',
    title: 'Token Validation Failures',
    severity: 'high',
    status: 'mitigating',
    time: '18 min ago',
    errorRate: '12%',
    responseTime: '2.4s avg',
    symptom: 'JWT token validation returning 401 errors across services',
    logs: '[10:26:14] ERROR: JWT validation failed: signature mismatch\n[10:26:18] ERROR: 401 Unauthorized — downstream services rejecting tokens\n[10:26:22] WARN: Token refresh rate spiking — 3x normal volume\n[10:26:35] ERROR: auth-service: signing key rotation detected',
    recommendation: 'Verify if a signing key rotation was recently performed without coordinating key propagation across services. Roll back to previous signing key or force token refresh across all clients.',
    confidence: 87,
    basedOnCount: 2,
    similarIncidents: [
      { id: 'INC-0903', match: 88, service: 'Auth Service', title: 'JWT Signing Key Mismatch', resolution: 'Rolled back signing key rotation — propagation delay caused mismatch', outcome: 'Resolved in 15 minutes', matchReasons: ['Same service', 'Same 401 error pattern', 'Key rotation correlation identified'] },
      { id: 'INC-0715', match: 79, service: 'API Gateway', title: 'Token Verification Failures', resolution: 'Deployed corrected JWK endpoint URL to all services', outcome: 'Resolved in 28 minutes', matchReasons: ['Similar JWT validation errors', 'Configuration propagation issue'] }
    ],
    timeline: [
      { time: '10:26', event: 'Incident detected — auth error rate spike', type: 'detected' },
      { time: '10:27', event: 'AI analyzed JWT validation failure pattern', type: 'ai' },
      { time: '10:28', event: '2 similar incidents retrieved from memory', type: 'memory' },
      { time: '10:28', event: 'Key rotation mismatch identified as likely cause', type: 'recommendation' },
      { time: '10:35', event: 'Engineering team rolling back key rotation', type: 'action' }
    ],
    memoriesUsed: [
      { id: 'INC-0903', similarity: '88%' },
      { id: 'INC-0715', similarity: '79%' }
    ]
  },
  {
    id: 'INC-1040',
    service: 'Notification Service',
    title: 'Message Queue Delay',
    severity: 'medium',
    status: 'resolved',
    time: '1 hr ago',
    errorRate: '0%',
    responseTime: '180ms avg',
    symptom: 'SQS queue consumer falling behind — message processing delayed',
    logs: '[09:45:22] WARN: Queue depth: 14,820 messages (threshold: 1000)\n[09:45:30] WARN: Consumer lag: 420 seconds\n[09:46:01] INFO: Scaling consumer instances: 2 → 8\n[09:52:14] INFO: Queue depth normalizing: 4,200 messages\n[10:01:33] INFO: Queue depth nominal: 180 messages',
    recommendation: 'Auto-scaling triggered consumer scale-out. Queue depth has normalized. No further action required.',
    confidence: 96,
    basedOnCount: 5,
    similarIncidents: [
      { id: 'INC-0992', match: 96, service: 'Notification Service', title: 'SQS Queue Backlog', resolution: 'Auto-scaled consumers from 2 to 8 instances', outcome: 'Resolved in 18 minutes', matchReasons: ['Same service', 'Same queue backlog pattern', 'Auto-scale resolution verified'] }
    ],
    timeline: [
      { time: '09:45', event: 'Queue depth alert triggered', type: 'detected' },
      { time: '09:46', event: 'AI identified consumer lag pattern', type: 'ai' },
      { time: '09:46', event: '5 similar incidents retrieved from memory', type: 'memory' },
      { time: '09:46', event: 'Auto-scale consumers recommended', type: 'recommendation' },
      { time: '09:46', event: 'Consumers scaled: 2 → 8 instances', type: 'action' },
      { time: '10:02', event: 'Queue depth normalized', type: 'progress' },
      { time: '10:15', event: 'Incident resolved', type: 'resolved' }
    ],
    memoriesUsed: [
      { id: 'INC-0992', similarity: '96%' },
      { id: 'INC-0881', similarity: '82%' },
      { id: 'INC-0741', similarity: '78%' }
    ]
  }
];

// Memory Bank
let MEMORY_BANK = [
  {
    id: 'mem_1',
    category: 'incident',
    title: 'Payment API — DB Connection Pool Exhaustion',
    service: 'Payment API',
    description: 'Connection pool exhausted after traffic spike. Max pool size was too small for peak load.',
    resolution: 'Increased pool size from 10 to 50. Restarted API service. Resolved in 11 min.',
    usedIn: 7,
    relevance: 94,
    timestamp: 'Incident INC-0871 · 14 days ago',
    tags: ['#payment-api', '#database', '#pool']
  },
  {
    id: 'mem_2',
    category: 'root_cause',
    title: 'DB Connection Pool Exhaustion — Root Cause Pattern',
    service: 'Multiple Services',
    description: 'Connection pool exhaustion typically caused by: (1) traffic spike without auto-scaling, (2) connection leak after deployment, (3) long-running queries holding connections.',
    resolution: 'Check pool config, recent deployments, and query duration metrics simultaneously.',
    usedIn: 12,
    relevance: 96,
    timestamp: 'Learned from 4 incidents · Updated 7 days ago',
    tags: ['#root-cause', '#database', '#pool']
  },
  {
    id: 'mem_3',
    category: 'resolution',
    title: 'Increase Connection Pool Size',
    service: 'Payment API, Order Service',
    description: 'Increasing PostgreSQL connection pool max_size from default 10 to 50 resolved connection exhaustion in INC-0871 and INC-0824.',
    resolution: 'Update DB_POOL_MAX_SIZE env var → Rolling restart of API pods → Monitor pool utilization',
    usedIn: 7,
    relevance: 94,
    timestamp: 'Verified fix · Used in 7 incidents',
    tags: ['#resolution', '#database', '#configuration']
  },
  {
    id: 'mem_4',
    category: 'incident',
    title: 'Auth Service — JWT Signing Key Mismatch',
    service: 'Authentication Service',
    description: 'JWT token validation failed after key rotation was deployed to auth service but not propagated to downstream consumers.',
    resolution: 'Rolled back signing key rotation. Updated deployment process to include propagation step.',
    usedIn: 4,
    relevance: 88,
    timestamp: 'Incident INC-0903 · 21 days ago',
    tags: ['#auth-service', '#jwt', '#deployment']
  },
  {
    id: 'mem_5',
    category: 'lesson',
    title: 'Key Rotation Must Be Coordinated Across Services',
    service: 'Auth Service',
    description: 'Signing key rotation deployed without coordinating propagation caused 15 min outage. Post-mortem action: add propagation gate to deployment pipeline.',
    resolution: 'Added canary check: verify all services have received new JWK before completing key rotation.',
    usedIn: 2,
    relevance: 90,
    timestamp: 'Lesson from INC-0903 · Added 20 days ago',
    tags: ['#lesson', '#auth', '#deployment-gate']
  },
  {
    id: 'mem_6',
    category: 'resolution',
    title: 'SQS Consumer Auto-Scale on Queue Depth',
    service: 'Notification Service',
    description: 'Scaling SQS consumers from 2 to 8 instances resolved queue backlog in under 20 minutes. Triggered by queue depth alert at 10x threshold.',
    resolution: 'Scale consumer ECS tasks: aws ecs update-service --desired-count 8. Monitor queue depth metric.',
    usedIn: 5,
    relevance: 96,
    timestamp: 'Verified fix · Used in 5 incidents',
    tags: ['#notification', '#sqs', '#scaling']
  },
  {
    id: 'mem_7',
    category: 'root_cause',
    title: 'Authentication Token Failure — Patterns',
    service: 'Auth Service, API Gateway',
    description: 'Token validation failures typically caused by: (1) key rotation without propagation, (2) expired tokens not refreshed, (3) clock skew between services.',
    resolution: 'Check recent key rotations, compare signing key fingerprints across services, verify clock sync.',
    usedIn: 6,
    relevance: 87,
    timestamp: 'Learned from 3 incidents · Updated 5 days ago',
    tags: ['#root-cause', '#auth', '#jwt']
  },
  {
    id: 'mem_8',
    category: 'lesson',
    title: 'Connection Pool Monitoring Gap',
    service: 'Payment API',
    description: 'INC-0871 revealed no alerting on connection pool utilization. Engineers only discovered exhaustion after errors started. Preventive: add pool utilization alert at 80%.',
    resolution: 'Added Prometheus metric: db_pool_utilization_ratio. Alert at 80%, page at 95%.',
    usedIn: 3,
    relevance: 91,
    timestamp: 'Lesson from INC-0871 · Added 14 days ago',
    tags: ['#lesson', '#monitoring', '#database']
  }
];

// Runbooks
const RUNBOOKS = [
  {
    id: 'rb_1',
    title: 'Database Connection Exhaustion',
    usedTimes: 18,
    successRate: 94,
    summary: 'Resolve database connection pool exhaustion causing service errors.',
    symptoms: [
      'High rate of connection timeout errors',
      'psycopg2.OperationalError or similar DB driver errors',
      'Error rate spike correlated with traffic increase or deployment',
      'DB connection pool metrics at maximum'
    ],
    diagnosis: [
      'Check current pool size: SELECT count(*) FROM pg_stat_activity',
      'Verify max_connections in PostgreSQL: SHOW max_connections',
      'Check for connection leaks in recent deployments',
      'Inspect long-running queries holding connections'
    ],
    resolution: [
      'Increase DB_POOL_MAX_SIZE environment variable (start with 2x current value)',
      'Deploy configuration change with rolling restart',
      'Monitor pool utilization metric immediately after restart',
      'If leak suspected: rollback last deployment, then increase pool',
      'Add connection pool utilization alert if missing'
    ],
    relatedIncidents: ['INC-0871', 'INC-0824', 'INC-0612', 'INC-0541']
  },
  {
    id: 'rb_2',
    title: 'API Latency Spike',
    usedTimes: 12,
    successRate: 91,
    summary: 'Diagnose and resolve unexpected API response time degradation.',
    symptoms: [
      'P99 latency > 2x baseline',
      'Increasing error rate on dependent services',
      'CPU or memory spike on API instances',
      'Upstream timeout errors in consumer logs'
    ],
    diagnosis: [
      'Check API instance CPU and memory utilization',
      'Inspect database query latency (slow query log)',
      'Verify downstream dependency health (database, cache, external APIs)',
      'Check for N+1 query patterns in recent code changes',
      'Review recent deployments for performance regressions'
    ],
    resolution: [
      'If DB-related: optimize slow queries or add indexes',
      'If traffic spike: scale API instances horizontally',
      'If dependency: circuit-break failing upstream and return cached response',
      'If code regression: rollback deployment',
      'Enable request tracing to identify bottleneck'
    ],
    relatedIncidents: ['INC-1039', 'INC-0998', 'INC-0876']
  },
  {
    id: 'rb_3',
    title: 'Authentication Failure',
    usedTimes: 9,
    successRate: 96,
    summary: 'Resolve widespread JWT or token validation failures across services.',
    symptoms: [
      'High rate of 401 Unauthorized responses',
      'JWT signature verification failures in logs',
      'Token refresh rate spike',
      'Users unable to authenticate across services'
    ],
    diagnosis: [
      'Check if signing key rotation was recently performed',
      'Compare JWK endpoint output across all service instances',
      'Verify clock synchronization between auth service and consumers',
      'Check token expiry times in JWT payload',
      'Test token validation against each service independently'
    ],
    resolution: [
      'If key rotation mismatch: rollback to previous signing key immediately',
      'Force key propagation to all services simultaneously',
      'If clock skew: sync NTP across affected instances',
      'If expired tokens: deploy token refresh mechanism',
      'Add pre-deployment gate: verify key propagation before rotation completes'
    ],
    relatedIncidents: ['INC-0903', 'INC-0715', 'INC-0621']
  }
];

// App State
let state = {
  currentView: 'incidents',
  incidents: [...INCIDENTS],
  memories: [...MEMORY_BANK],
  selectedIncidentId: null,
  activeCategoryFilter: 'all',
  searchQuery: '',
  memoryPopupVisible: false,
  selectedRunbookId: null
};

// ============================================================================
// 2. DOM ELEMENT REFERENCES
// ============================================================================

const dom = {
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.view-panel'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  pageTitle: document.getElementById('page-title'),
  btnQuickReset: document.getElementById('btn-quick-reset'),
  navMemoryCount: document.getElementById('nav-memory-count'),
  btnNewIncident: document.getElementById('btn-new-incident'),
  incidentListContainer: document.getElementById('incident-list-container'),
  resolvedListContainer: document.getElementById('resolved-list-container'),
  incidentEmptyState: document.getElementById('incident-empty-state'),
  incidentDetailContent: document.getElementById('incident-detail-content'),
  memoriesGrid: document.getElementById('memories-grid'),
  memorySearchInput: document.getElementById('memory-search-input'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  categoryPills: document.querySelectorAll('.cat-pill'),
  memoriesEmptyState: document.getElementById('memories-empty-state'),
  btnResetFilters: document.getElementById('btn-reset-filters'),
  btnOpenAddMemory: document.getElementById('btn-open-add-memory'),
  statTotalStored: document.getElementById('stat-total-stored'),
  runbooksList: document.getElementById('runbooks-list'),
  runbookDetailPanel: document.getElementById('runbook-detail-panel'),
  btnBackRunbooks: document.getElementById('btn-back-runbooks'),
  formPostmortem: document.getElementById('form-postmortem'),
  btnClearPm: document.getElementById('btn-clear-pm'),
  modalNewIncident: document.getElementById('modal-new-incident'),
  formNewIncident: document.getElementById('form-new-incident'),
  btnCloseNewIncidentModal: document.getElementById('btn-close-new-incident-modal'),
  btnCancelNewIncident: document.getElementById('btn-cancel-new-incident'),
  analysisProgress: document.getElementById('analysis-progress'),
  newIncidentFooter: document.getElementById('new-incident-footer'),
  modalAddMemory: document.getElementById('modal-add-memory'),
  formAddMemory: document.getElementById('form-add-memory'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelModal: document.getElementById('btn-cancel-modal'),
  toastContainer: document.getElementById('toast-container'),
  incChatInput: document.getElementById('inc-chat-input'),
  btnSendIncChat: document.getElementById('btn-send-inc-chat'),
  incChatMessages: document.getElementById('inc-chat-messages')
};

// ============================================================================
// 3. INITIALIZATION
// ============================================================================

function init() {
  setupNavigation();
  setupIncidentHandlers();
  setupMemoryHandlers();
  setupRunbookHandlers();
  setupPostmortemHandlers();
  setupModalHandlers();
  setupIncidentChat();
  renderIncidentList();
  renderMemoriesGrid();
  renderRunbooksList();
}

// ============================================================================
// 4. NAVIGATION
// ============================================================================

function setupNavigation() {
  dom.navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    });
  });

  if (dom.sidebarToggleBtn) {
    dom.sidebarToggleBtn.addEventListener('click', () => {
      dom.sidebar.classList.toggle('collapsed');
    });
  }

  if (dom.mobileMenuBtn) {
    dom.mobileMenuBtn.addEventListener('click', () => {
      dom.sidebar.classList.toggle('mobile-open');
    });
  }

  if (dom.btnQuickReset) {
    dom.btnQuickReset.addEventListener('click', () => {
      if (confirm('Reset demo to initial state?')) {
        state.memories = [...MEMORY_BANK];
        state.selectedIncidentId = null;
        renderIncidentList();
        renderMemoriesGrid();
        dom.incidentEmptyState.classList.remove('hidden');
        dom.incidentDetailContent.classList.add('hidden');
        showToast('Demo reset to initial state', 'success');
      }
    });
  }
}

function switchView(viewName) {
  state.currentView = viewName;
  dom.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });
  dom.views.forEach(panel => {
    panel.classList.toggle('active-view', panel.id === `view-${viewName}`);
  });
  const titles = {
    incidents: 'Incidents',
    memory: 'Incident Memory Bank',
    runbooks: 'Runbooks',
    postmortems: 'Post-Mortem',
    learning: 'The Agent Learns'
  };
  if (dom.pageTitle) dom.pageTitle.textContent = titles[viewName] || 'RecallOps';

  // Show/hide incident summary header
  const summaryHeader = document.getElementById('incident-summary-header');
  const newIncBtn = document.getElementById('btn-new-incident');
  if (summaryHeader) summaryHeader.style.display = viewName === 'incidents' ? '' : 'none';
  if (newIncBtn) newIncBtn.style.display = viewName === 'incidents' ? '' : 'none';

  dom.sidebar.classList.remove('mobile-open');
  if (viewName === 'memory') renderMemoriesGrid();
}

// ============================================================================
// 5. MOCK API FUNCTIONS (replace with fetch() calls to backend)
// ============================================================================

function loadIncidents() {
  return Promise.resolve(state.incidents);
}

function retrieveMemories(incidentDescription) {
  // Simulates Hindsight memory retrieval
  const incident = state.incidents.find(i => i.id === state.selectedIncidentId);
  if (incident) return Promise.resolve(incident.similarIncidents);
  return Promise.resolve([]);
}

function getRecommendation(incidentId) {
  const incident = state.incidents.find(i => i.id === incidentId);
  if (!incident) return Promise.resolve(null);
  return Promise.resolve({
    text: incident.recommendation,
    confidence: incident.confidence,
    basedOnCount: incident.basedOnCount,
    memoriesUsed: incident.memoriesUsed
  });
}

function analyzeIncident(data) {
  // Simulate analysis steps with delays
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: 'INC-' + (Math.floor(Math.random() * 900) + 1100),
        service: data.service,
        severity: data.severity,
        title: data.description.substring(0, 50) + (data.description.length > 50 ? '...' : ''),
        recommendation: 'Based on similar patterns in memory, this issue may be related to recent deployment changes or resource exhaustion. Check service logs and recent deployments.',
        confidence: 78,
        basedOnCount: 2,
        similarIncidents: [
          { id: 'INC-0902', match: 79, service: data.service, title: 'Similar Previous Incident', resolution: 'Rolled back recent deployment', outcome: 'Resolved in 18 minutes', matchReasons: ['Similar symptoms', 'Same service', 'Deployment correlation'] }
        ],
        memoriesUsed: [
          { id: 'INC-0902', similarity: '79%' },
          { id: 'INC-0845', similarity: '71%' }
        ]
      });
    }, 3500);
  });
}

function savePostMortem(data) {
  const newMemory = {
    id: 'mem_pm_' + Date.now(),
    category: 'incident',
    title: data.incident + ' — Post-Mortem',
    service: data.service || 'Unknown Service',
    description: 'Root cause: ' + data.rootCause + '. Lessons: ' + data.lessons,
    resolution: data.whatFixed,
    usedIn: 0,
    relevance: 90,
    timestamp: 'Added just now',
    tags: ['#post-mortem']
  };
  state.memories.push(newMemory);
  return Promise.resolve(newMemory);
}

function loadMemories() {
  return Promise.resolve(state.memories);
}

// ============================================================================
// 6. INCIDENT LIST & DETAIL
// ============================================================================

function setupIncidentHandlers() {
  if (dom.btnNewIncident) {
    dom.btnNewIncident.addEventListener('click', () => openNewIncidentModal());
  }
}

function renderIncidentList() {
  const active = state.incidents.filter(i => i.status !== 'resolved');
  const resolved = state.incidents.filter(i => i.status === 'resolved');

  if (dom.incidentListContainer) {
    dom.incidentListContainer.innerHTML = active.map(inc => renderIncidentCard(inc)).join('');
  }
  if (dom.resolvedListContainer) {
    dom.resolvedListContainer.innerHTML = resolved.map(inc => renderIncidentCard(inc)).join('');
  }

  // Attach click handlers
  document.querySelectorAll('.incident-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      selectIncident(id);
    });
  });
}

function renderIncidentCard(inc) {
  const severityClass = { critical: 'sev-critical', high: 'sev-high', medium: 'sev-medium', low: 'sev-low' }[inc.severity] || 'sev-medium';
  const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[inc.severity] || '🟡';
  const statusLabel = { investigating: 'Investigating', mitigating: 'Mitigating', resolved: 'Resolved', monitoring: 'Monitoring' }[inc.status] || inc.status;
  const selected = state.selectedIncidentId === inc.id ? 'selected' : '';
  return `
    <div class="incident-card ${selected}" data-id="${inc.id}">
      <div class="inc-card-header">
        <span class="inc-card-id">${inc.id}</span>
        <span class="inc-card-severity ${severityClass}">${severityEmoji} ${inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1)}</span>
      </div>
      <div class="inc-card-service">${inc.service}</div>
      <div class="inc-card-title">${inc.title}</div>
      <div class="inc-card-footer">
        <span class="inc-card-status status-${inc.status}">${statusLabel}</span>
        <span class="inc-card-time">${inc.time}</span>
      </div>
    </div>
  `;
}

function selectIncident(id) {
  state.selectedIncidentId = id;
  const inc = state.incidents.find(i => i.id === id);
  if (!inc) return;

  // Update selected state in list
  document.querySelectorAll('.incident-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });

  // Show detail panel
  dom.incidentEmptyState.classList.add('hidden');
  dom.incidentDetailContent.classList.remove('hidden');

  // Populate detail
  document.getElementById('detail-inc-id').textContent = inc.id;
  document.getElementById('detail-service').textContent = inc.service;
  document.getElementById('detail-title').textContent = inc.title;

  const severityBadge = document.getElementById('detail-severity-badge');
  severityBadge.textContent = ({ critical: '🔴 Critical', high: '🟠 High', medium: '🟡 Medium', low: '🟢 Low' }[inc.severity]) || inc.severity;
  severityBadge.className = 'inc-severity-badge sev-badge-' + inc.severity;

  const statusBadge = document.getElementById('detail-status-badge');
  statusBadge.textContent = inc.status.charAt(0).toUpperCase() + inc.status.slice(1);
  statusBadge.className = 'inc-status-badge status-badge-' + inc.status;

  // Metrics
  const metricsRow = document.getElementById('detail-metrics-row');
  if (metricsRow) {
    metricsRow.innerHTML = `
      <div class="inc-metric"><span class="inc-metric-val">${inc.errorRate}</span><span class="inc-metric-label">Error Rate</span></div>
      <div class="inc-metric"><span class="inc-metric-val">${inc.responseTime}</span><span class="inc-metric-label">Response Time</span></div>
      <div class="inc-metric inc-metric-wide"><span class="inc-metric-val symptom-val">⚠ ${inc.symptom}</span></div>
    `;
  }

  // Logs
  const logsEl = document.getElementById('detail-logs');
  if (logsEl) logsEl.innerHTML = `<pre class="log-pre">${inc.logs}</pre>`;

  // AI Recommendation
  document.getElementById('ai-rec-text').textContent = inc.recommendation;
  document.getElementById('ai-confidence').textContent = inc.confidence + '%';
  document.getElementById('ai-memory-count').textContent = inc.memoriesUsed.length;
  document.getElementById('ai-based-on-count').textContent = inc.basedOnCount;

  // Memory Used Popup
  const memList = document.getElementById('memory-used-list');
  if (memList) {
    memList.innerHTML = inc.memoriesUsed.map(m =>
      `<div class="mem-popup-row"><span class="mem-popup-id">${m.id}</span><span class="mem-popup-sim">${m.similarity} similar</span></div>`
    ).join('');
  }

  // Similar Incidents
  const simList = document.getElementById('similar-incidents-list');
  if (simList) {
    simList.innerHTML = inc.similarIncidents.map(sim => `
      <div class="similar-inc-card">
        <div class="sim-inc-header">
          <span class="sim-inc-id">${sim.id}</span>
          <span class="sim-inc-match">${sim.match}% similar</span>
        </div>
        <div class="sim-inc-service">${sim.service}</div>
        <div class="sim-inc-title">${sim.title}</div>
        <div class="sim-inc-resolution">
          <span class="sim-res-label">Previous resolution:</span>
          <strong>${sim.resolution}</strong>
        </div>
        <div class="sim-inc-outcome">✓ ${sim.outcome}</div>
      </div>
    `).join('');
  }

  document.getElementById('similar-count-badge').textContent = inc.similarIncidents.length + ' similar incidents';

  // Why This Recommendation
  const whyContent = document.getElementById('why-rec-content');
  if (whyContent) {
    whyContent.innerHTML = `
      <p class="why-rec-intro">We found <strong>${inc.basedOnCount} incidents</strong> with similar symptoms and error patterns.</p>
      ${inc.similarIncidents.slice(0, 2).map(sim => `
        <div class="why-rec-incident">
          <div class="why-inc-id">${sim.id} — ${sim.match}% similar</div>
          <ul class="why-reasons">
            ${sim.matchReasons.map(r => `<li>✓ ${r}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    `;
  }

  // Timeline
  const timelineEl = document.getElementById('inc-timeline-list');
  if (timelineEl) {
    timelineEl.innerHTML = inc.timeline.map(t => `
      <div class="timeline-row tl-${t.type}">
        <span class="tl-time">${t.time}</span>
        <span class="tl-dot"></span>
        <span class="tl-event">${t.event}</span>
      </div>
    `).join('');
  }

  // Clear chat
  if (dom.incChatMessages) {
    dom.incChatMessages.innerHTML = `<div class="inc-chat-hint">Ask about this incident, similar past incidents, or request clarification on the recommendation.</div>`;
  }

  // Resolve button
  const resolveBtn = document.getElementById('btn-resolve-incident');
  if (resolveBtn) {
    resolveBtn.onclick = () => resolveIncident(inc.id);
  }

  // Memory badge toggle
  const memBadge = document.getElementById('ai-memory-badge');
  if (memBadge) {
    memBadge.onclick = (e) => {
      e.stopPropagation();
      const popup = document.getElementById('memory-used-popup');
      popup.classList.toggle('hidden');
    };
  }

  // View Why button
  const btnViewWhy = document.getElementById('btn-view-why');
  if (btnViewWhy) {
    btnViewWhy.onclick = () => {
      const expander = document.getElementById('why-rec-expander');
      if (expander) { expander.open = true; expander.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    };
  }

  // View Runbook button
  const btnViewRunbook = document.getElementById('btn-view-runbook-from-inc');
  if (btnViewRunbook) {
    btnViewRunbook.onclick = () => {
      switchView('runbooks');
      // Try to auto-select matching runbook based on incident
      setTimeout(() => {
        const rb = RUNBOOKS[0]; // Default to first runbook for demo
        openRunbookDetail(rb.id);
      }, 100);
    };
  }

  // Close popup on outside click
  document.addEventListener('click', () => {
    const popup = document.getElementById('memory-used-popup');
    if (popup) popup.classList.add('hidden');
  }, { once: true });
}

function resolveIncident(id) {
  const inc = state.incidents.find(i => i.id === id);
  if (!inc) return;
  inc.status = 'resolved';
  inc.time = 'just now';
  renderIncidentList();
  selectIncident(id);
  showToast(`${id} marked as resolved. Redirecting to post-mortem...`, 'success');
  setTimeout(() => {
    switchView('postmortems');
    const pmIncInput = document.getElementById('pm-incident');
    const pmServiceInput = document.getElementById('pm-service');
    if (pmIncInput) pmIncInput.value = inc.id + ' — ' + inc.title;
    if (pmServiceInput) pmServiceInput.value = inc.service;
  }, 1500);
}

// ============================================================================
// 7. MEMORY BANK
// ============================================================================

function setupMemoryHandlers() {
  if (dom.memorySearchInput) {
    dom.memorySearchInput.addEventListener('input', () => {
      state.searchQuery = dom.memorySearchInput.value.toLowerCase();
      dom.btnClearSearch.classList.toggle('hidden', !state.searchQuery);
      renderMemoriesGrid();
    });
  }

  if (dom.btnClearSearch) {
    dom.btnClearSearch.addEventListener('click', () => {
      dom.memorySearchInput.value = '';
      state.searchQuery = '';
      dom.btnClearSearch.classList.add('hidden');
      renderMemoriesGrid();
    });
  }

  if (dom.categoryPills) {
    dom.categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        state.activeCategoryFilter = pill.dataset.category;
        dom.categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderMemoriesGrid();
      });
    });
  }

  if (dom.btnResetFilters) {
    dom.btnResetFilters.addEventListener('click', () => {
      state.searchQuery = '';
      state.activeCategoryFilter = 'all';
      if (dom.memorySearchInput) dom.memorySearchInput.value = '';
      if (dom.btnClearSearch) dom.btnClearSearch.classList.add('hidden');
      dom.categoryPills.forEach(p => p.classList.toggle('active', p.dataset.category === 'all'));
      renderMemoriesGrid();
    });
  }
}

function renderMemoriesGrid() {
  let filtered = state.memories;
  if (state.activeCategoryFilter !== 'all') {
    filtered = filtered.filter(m => m.category === state.activeCategoryFilter);
  }
  if (state.searchQuery) {
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(state.searchQuery) ||
      m.description.toLowerCase().includes(state.searchQuery) ||
      (m.service && m.service.toLowerCase().includes(state.searchQuery))
    );
  }

  const categoryColors = {
    incident: 'cat-incident',
    root_cause: 'cat-root-cause',
    resolution: 'cat-resolution',
    lesson: 'cat-lesson',
    runbook: 'cat-runbook'
  };
  const categoryLabels = {
    incident: 'Past Incident',
    root_cause: 'Root Cause',
    resolution: 'Resolution',
    lesson: 'Lesson Learned',
    runbook: 'Runbook'
  };

  if (dom.memoriesGrid) {
    if (filtered.length === 0) {
      dom.memoriesGrid.innerHTML = '';
      dom.memoriesEmptyState.classList.remove('hidden');
    } else {
      dom.memoriesEmptyState.classList.add('hidden');
      dom.memoriesGrid.innerHTML = filtered.map(mem => `
        <div class="memory-card ${categoryColors[mem.category] || ''}">
          <div class="mem-card-header">
            <span class="mem-category-tag">${categoryLabels[mem.category] || mem.category}</span>
            <span class="mem-relevance-badge">${mem.relevance}%</span>
          </div>
          <h4 class="mem-card-title">${mem.title}</h4>
          <div class="mem-card-service">${mem.service}</div>
          <p class="mem-card-desc">${mem.description}</p>
          ${mem.resolution ? `<div class="mem-card-resolution"><span class="mem-res-label">Resolution:</span> ${mem.resolution}</div>` : ''}
          <div class="mem-card-footer">
            <span class="mem-used-count">Used in ${mem.usedIn} incidents</span>
            <span class="mem-timestamp">${mem.timestamp}</span>
          </div>
          ${mem.tags ? `<div class="mem-tags">${mem.tags.map(t => `<span class="mem-tag">${t}</span>`).join('')}</div>` : ''}
        </div>
      `).join('');
    }
  }

  // Update counts
  updateMemoryCounts();
}

function updateMemoryCounts() {
  const countAll = document.getElementById('count-all');
  const countUser = document.getElementById('count-user');
  const countPref = document.getElementById('count-pref');
  const countInter = document.getElementById('count-inter');
  const countSol = document.getElementById('count-sol');
  if (countAll) countAll.textContent = state.memories.length;
  if (countUser) countUser.textContent = state.memories.filter(m => m.category === 'incident').length;
  if (countPref) countPref.textContent = state.memories.filter(m => m.category === 'root_cause').length;
  if (countInter) countInter.textContent = state.memories.filter(m => m.category === 'resolution').length;
  if (countSol) countSol.textContent = state.memories.filter(m => m.category === 'lesson').length;
  if (dom.statTotalStored) dom.statTotalStored.textContent = state.memories.length;
  if (dom.navMemoryCount) dom.navMemoryCount.textContent = 482 + state.memories.length - MEMORY_BANK.length;
}

// ============================================================================
// 8. RUNBOOKS
// ============================================================================

function setupRunbookHandlers() {
  if (dom.btnBackRunbooks) {
    dom.btnBackRunbooks.addEventListener('click', () => {
      dom.runbookDetailPanel.classList.add('hidden');
      document.getElementById('runbooks-main-view').classList.remove('hidden');
    });
  }
}

function renderRunbooksList() {
  if (!dom.runbooksList) return;
  dom.runbooksList.innerHTML = RUNBOOKS.map(rb => `
    <div class="runbook-card" data-id="${rb.id}">
      <div class="rb-card-header">
        <h4 class="rb-card-title">${rb.title}</h4>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rb-arrow-icon">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
      <p class="rb-card-summary">${rb.summary}</p>
      <div class="rb-card-footer">
        <span class="rb-stat">Used ${rb.usedTimes} times</span>
        <span class="rb-divider">·</span>
        <span class="rb-stat success-rate">${rb.successRate}% success</span>
      </div>
    </div>
  `).join('');

  dom.runbooksList.querySelectorAll('.runbook-card').forEach(card => {
    card.addEventListener('click', () => openRunbookDetail(card.dataset.id));
  });
}

function openRunbookDetail(id) {
  const rb = RUNBOOKS.find(r => r.id === id);
  if (!rb) return;
  state.selectedRunbookId = id;

  document.getElementById('runbooks-main-view').classList.add('hidden');
  dom.runbookDetailPanel.classList.remove('hidden');
  document.getElementById('runbook-detail-title').textContent = rb.title;
  document.getElementById('runbook-detail-meta').innerHTML =
    `<span class="rb-stat">Used ${rb.usedTimes} times</span> · <span class="rb-stat success-rate">${rb.successRate}% success</span>`;

  document.getElementById('runbook-detail-body').innerHTML = `
    <div class="rb-detail-section">
      <h4 class="rb-sec-title">Symptoms</h4>
      <ul class="rb-sec-list">${rb.symptoms.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    <div class="rb-detail-section">
      <h4 class="rb-sec-title">Diagnosis Steps</h4>
      <ol class="rb-sec-list ordered">${rb.diagnosis.map(s => `<li>${s}</li>`).join('')}</ol>
    </div>
    <div class="rb-detail-section">
      <h4 class="rb-sec-title">Resolution Steps</h4>
      <ol class="rb-sec-list ordered resolution-steps">${rb.resolution.map(s => `<li>${s}</li>`).join('')}</ol>
    </div>
    <div class="rb-detail-section">
      <h4 class="rb-sec-title">Related Incidents</h4>
      <div class="rb-related-incidents">${rb.relatedIncidents.map(id => `<span class="rb-related-badge">${id}</span>`).join('')}</div>
    </div>
  `;
}

// ============================================================================
// 9. POST-MORTEM
// ============================================================================

function setupPostmortemHandlers() {
  if (dom.formPostmortem) {
    dom.formPostmortem.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        incident: document.getElementById('pm-incident').value,
        service: document.getElementById('pm-service').value,
        severity: document.getElementById('pm-severity').value,
        rootCause: document.getElementById('pm-root-cause').value,
        whatFixed: document.getElementById('pm-what-fixed').value,
        whatFailed: document.getElementById('pm-what-failed').value,
        lessons: document.getElementById('pm-lessons').value,
        preventive: document.getElementById('pm-preventive').value,
        runbook: document.getElementById('pm-runbook').value
      };
      const saveBtn = document.getElementById('btn-save-postmortem');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      try {
        await savePostMortem(data);
        dom.formPostmortem.reset();
        showToast('✓ Post-mortem added to agent memory', 'success');
      } catch (err) {
        showToast('Error saving post-mortem', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path></svg> Save to Memory`;
      }
    });
  }

  if (dom.btnClearPm) {
    dom.btnClearPm.addEventListener('click', () => {
      if (dom.formPostmortem) dom.formPostmortem.reset();
    });
  }
}

// ============================================================================
// 10. MODALS
// ============================================================================

function setupModalHandlers() {
  // New Incident Modal
  if (dom.btnCloseNewIncidentModal) {
    dom.btnCloseNewIncidentModal.addEventListener('click', closeNewIncidentModal);
  }
  if (dom.btnCancelNewIncident) {
    dom.btnCancelNewIncident.addEventListener('click', closeNewIncidentModal);
  }
  if (dom.modalNewIncident) {
    dom.modalNewIncident.addEventListener('click', (e) => {
      if (e.target === dom.modalNewIncident) closeNewIncidentModal();
    });
  }
  if (dom.formNewIncident) {
    dom.formNewIncident.addEventListener('submit', handleNewIncidentSubmit);
  }

  // Add Memory Modal
  if (dom.btnCloseModal) {
    dom.btnCloseModal.addEventListener('click', closeAddMemoryModal);
  }
  if (dom.btnCancelModal) {
    dom.btnCancelModal.addEventListener('click', closeAddMemoryModal);
  }
  if (dom.modalAddMemory) {
    dom.modalAddMemory.addEventListener('click', (e) => {
      if (e.target === dom.modalAddMemory) closeAddMemoryModal();
    });
  }
  if (dom.btnOpenAddMemory) {
    dom.btnOpenAddMemory.addEventListener('click', () => {
      dom.modalAddMemory.classList.remove('hidden');
    });
  }
  if (dom.formAddMemory) {
    dom.formAddMemory.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('mem-category').value;
      const title = document.getElementById('mem-title').value;
      const description = document.getElementById('mem-description').value;
      const relevance = parseInt(document.getElementById('mem-relevance').value);
      const tagInput = document.getElementById('mem-tag').value;
      const newMem = {
        id: 'mem_' + Date.now(),
        category,
        title,
        service: 'Manual Entry',
        description,
        resolution: '',
        usedIn: 0,
        relevance,
        timestamp: 'Added just now',
        tags: tagInput ? tagInput.split(' ').filter(Boolean) : []
      };
      state.memories.push(newMem);
      renderMemoriesGrid();
      closeAddMemoryModal();
      dom.formAddMemory.reset();
      showToast('Memory stored in Hindsight bank', 'success');
    });
  }
}

function openNewIncidentModal() {
  if (dom.modalNewIncident) dom.modalNewIncident.classList.remove('hidden');
  if (dom.analysisProgress) dom.analysisProgress.classList.add('hidden');
  if (dom.newIncidentFooter) dom.newIncidentFooter.style.display = '';
  if (dom.formNewIncident) dom.formNewIncident.reset();
  resetAnalysisSteps();
}

function closeNewIncidentModal() {
  if (dom.modalNewIncident) dom.modalNewIncident.classList.add('hidden');
  if (dom.formNewIncident) dom.formNewIncident.reset();
  if (dom.analysisProgress) dom.analysisProgress.classList.add('hidden');
  resetAnalysisSteps();
}

function closeAddMemoryModal() {
  if (dom.modalAddMemory) dom.modalAddMemory.classList.add('hidden');
}

function resetAnalysisSteps() {
  [1, 2, 3].forEach(n => {
    const step = document.getElementById('step-' + n);
    if (step) { step.classList.remove('active', 'done'); }
  });
}

async function handleNewIncidentSubmit(e) {
  e.preventDefault();
  const service = document.getElementById('ni-service').value;
  const severity = document.getElementById('ni-severity').value;
  const description = document.getElementById('ni-description').value;
  const logs = document.getElementById('ni-logs').value;

  // Show analysis progress, hide footer
  if (dom.newIncidentFooter) dom.newIncidentFooter.style.display = 'none';
  if (dom.analysisProgress) dom.analysisProgress.classList.remove('hidden');

  // Step 1
  activateStep(1);
  await delay(1200);
  completeStep(1);
  activateStep(2);
  await delay(1300);
  completeStep(2);
  activateStep(3);

  try {
    const result = await analyzeIncident({ service, severity, description, logs });
    completeStep(3);
    await delay(400);

    // Add to incidents
    const newInc = {
      ...result,
      status: severity === 'critical' || severity === 'high' ? 'investigating' : 'monitoring',
      time: 'just now',
      errorRate: '—',
      responseTime: '—',
      symptom: description.substring(0, 60),
      logs: logs || 'No logs provided',
      timeline: [
        { time: formatTime(new Date()), event: 'Incident created', type: 'detected' },
        { time: formatTime(new Date()), event: 'AI analyzed symptoms', type: 'ai' },
        { time: formatTime(new Date()), event: `${result.basedOnCount} similar incidents retrieved`, type: 'memory' },
        { time: formatTime(new Date()), event: 'Recommendation generated', type: 'recommendation' }
      ]
    };
    state.incidents.unshift(newInc);
    renderIncidentList();
    closeNewIncidentModal();
    showToast(`${result.id} created — ${result.basedOnCount} similar incidents found`, 'success');
    selectIncident(newInc.id);
  } catch (err) {
    closeNewIncidentModal();
    showToast('Analysis failed — please try again', 'error');
  }
}

function activateStep(n) {
  const step = document.getElementById('step-' + n);
  if (step) step.classList.add('active');
}

function completeStep(n) {
  const step = document.getElementById('step-' + n);
  if (step) { step.classList.remove('active'); step.classList.add('done'); }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function formatTime(d) { return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); }

// ============================================================================
// 11. INCIDENT CHAT (AI within incident context)
// ============================================================================

function setupIncidentChat() {
  if (dom.btnSendIncChat) {
    dom.btnSendIncChat.addEventListener('click', sendIncidentChatMessage);
  }
  if (dom.incChatInput) {
    dom.incChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); sendIncidentChatMessage(); }
    });
  }
}

function sendIncidentChatMessage() {
  if (!dom.incChatInput || !dom.incChatMessages) return;
  const text = dom.incChatInput.value.trim();
  if (!text) return;

  dom.incChatInput.value = '';

  // Remove hint if present
  const hint = dom.incChatMessages.querySelector('.inc-chat-hint');
  if (hint) hint.remove();

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'inc-chat-msg user-msg';
  userMsg.textContent = text;
  dom.incChatMessages.appendChild(userMsg);

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'inc-chat-msg ai-msg typing-msg';
  typing.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  dom.incChatMessages.appendChild(typing);
  dom.incChatMessages.scrollTop = dom.incChatMessages.scrollHeight;

  // Generate mock AI response
  setTimeout(() => {
    typing.remove();
    const response = generateIncidentChatResponse(text);
    const aiMsg = document.createElement('div');
    aiMsg.className = 'inc-chat-msg ai-msg';
    aiMsg.innerHTML = `<span class="ai-msg-label">🧠 RecallOps Agent</span><p>${response}</p>`;
    dom.incChatMessages.appendChild(aiMsg);
    dom.incChatMessages.scrollTop = dom.incChatMessages.scrollHeight;
  }, 1200);
}

function generateIncidentChatResponse(text) {
  const inc = state.incidents.find(i => i.id === state.selectedIncidentId);
  if (!inc) return 'Please select an incident to discuss.';

  const t = text.toLowerCase();
  if (t.includes('connection pool') || t.includes('why') || t.includes('how')) {
    return `Based on Hindsight memory, INC-0871 had identical symptoms: <code>psycopg2.OperationalError</code> with pool exhaustion. In that incident, the default pool size of 10 was insufficient during a traffic spike. Increasing <code>max_pool_size</code> to 50 resolved it in 11 minutes. The same pattern appeared again in INC-0724 after a deployment introduced a connection leak.`;
  }
  if (t.includes('previous') || t.includes('similar') || t.includes('past')) {
    const matches = inc.similarIncidents || [];
    return `Found ${matches.length} similar incidents in memory: ${matches.map(m => `${m.id} (${m.match}% match)`).join(', ')}. The highest-confidence match is ${matches[0]?.id} at ${matches[0]?.match}% — same service, same error pattern, same successful resolution.`;
  }
  if (t.includes('rollback') || t.includes('deployment')) {
    return `INC-0724 (81% match) was resolved via rollback. In that case, a recent deployment introduced a connection leak. If you suspect a recent deployment caused this incident, rolling back while simultaneously increasing the connection pool is a viable approach. Check recent deployments in the last 2 hours.`;
  }
  if (t.includes('logs') || t.includes('error')) {
    return `The key signal in the logs is <code>${inc.logs.split('\n')[0]}</code>. This error indicates the connection pool has reached its maximum and cannot accept new connections. This is consistent with the pattern from INC-0871.`;
  }
  return `Based on Hindsight memory analysis of this incident (${inc.id}), the most likely cause is ${inc.symptom.toLowerCase()}. The AI recommendation has ${inc.confidence}% confidence based on ${inc.basedOnCount} similar incidents. What specific aspect would you like to investigate further?`;
}

// ============================================================================
// 12. TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-text">${message}</span>
  `;
  dom.toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// 13. INITIALIZE
// ============================================================================

document.addEventListener('DOMContentLoaded', init);
