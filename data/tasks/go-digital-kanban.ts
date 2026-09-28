import type { Task } from "../tasks.data";

export const goDigitalKanban: Task = {
  taskId:    "go-digital-kanban",
  projectId: "go-digital-kanban",
  status:    "completed",
  role:      "solo",
  techTags:  ["Angular 16", "Angular CDK", "Angular Material", "Spring Boot 3.4", "STOMP", "SockJS", "Spring Security", "JWT", "MySQL", "JJWT"],

  title: "Real-time Collaborative Kanban Board",

  description: "Full-stack Kanban board where multiple users drag cards across Backlog, InProgress, and Completed columns simultaneously. Every mutation — add, edit, delete, drag — broadcasts over STOMP/SockJS to all connected clients; the Angular client treats the WebSocket as a change signal and re-fetches authoritative state from REST, keeping every session consistent without polling.",

  problemStatement: "Go Digital needed an internal task management board multiple team members could use at the same time without page refreshes. Any card move, edit, or deletion had to propagate instantly to every other open session. The board also needed per-user views — each member sees only tasks assigned to them — and multi-user assignment so a single task could belong to several people simultaneously.",

  howItWorks: `Angular 16 handles the frontend; Spring Boot 3.4.2 (Java 17) handles REST and WebSocket brokering.

The board has three fixed columns — Backlog, InProgress, Completed — driven by the task's \`status\` field. Angular CDK's drag-and-drop moves cards between them. On drop, \`transferArrayItem\` updates the local array optimistically, then \`TaskService.updateTask()\` fires a REST \`PUT /api/tasks/{id}\` to persist the new status. The Spring controller saves the change and immediately calls \`WebSocketTaskHandler.sendTaskUpdate()\`, which pushes the full \`Tasks\` entity to \`/topic/tasks\` via \`SimpMessagingTemplate\`.

Every connected Angular client has a \`WebSocketService\` (root-provided) that subscribes to \`/topic/tasks\` at startup and emits each message through a \`Subject<any>\`. \`TaskComponent\` listens via \`taskService.getTaskUpdates()\` and on any emission calls \`loadTasks()\` — a full REST re-fetch. The WebSocket carries no client-side diff logic; it is purely a "something changed" signal, and the REST response is always the source of truth.

Auth is stateless JWT (JJWT 0.12.6, HmacSHA256, 1-hour expiry). The signing key is generated fresh at startup — ephemeral by design for a portfolio project. All \`/api/**\` endpoints require a valid token; \`/ws/**\` is permit-all so the WebSocket handshake doesn't require auth. The token is attached manually per-request via \`HttpHeaders\` — no HTTP interceptor.

Client-side filtering (priority, multi-select assignees, due-date range) runs through a reactive \`FormGroup\`; \`valueChanges\` triggers \`applyFilters()\` on every change. Per-column sort by priority (High/Medium/Low) or due date toggles ascending/descending independently per column.`,

  approachToSolve: [
    {
      step: "Backend first",
      detail: "Auth, REST CRUD, and WebSocket config were wired in Spring Boot before touching Angular — so the frontend consumed real endpoints from day 1.",
    },
    {
      step: "Drag-and-drop with CDK",
      detail: "Angular CDK's `CdkDragDrop` moves cards between the three column arrays; `getStatusFromList()` maps the container id to the correct `Status` enum value before sending the REST update.",
    },
    {
      step: "WebSocket broadcast pattern",
      detail: "`WebSocketTaskHandler` is injected into the REST controller and called after every save or delete. On add/update it sends the full `Tasks` entity; on delete it sends the integer `taskId`. Both go to `/topic/tasks`.",
    },
    {
      step: "Change-signal, not state-carrier",
      detail: "The Angular client doesn't parse the WS payload — any message triggers a full `GET /api/tasks` re-fetch. This eliminates client-side merge logic and keeps every session in sync with authoritative server state.",
    },
    {
      step: "Multi-user assignment",
      detail: "Tasks carry a `Set<Users> assignees` (many-to-many via `user_task` join table). On create, the controller re-fetches each `Users` entity by id to attach fully managed JPA objects before saving.",
    },
  ],

  apiChanges: [
    { method: "POST", path: "/auth/signup",       note: "Register — BCrypt-encodes password, returns 201",    response: "{ message }" },
    { method: "POST", path: "/auth/signin",       note: "Authenticate — returns 1-hour JWT",                  response: "{ token }" },
    { method: "GET",  path: "/auth/users",        note: "List all users (JWT required)",                      response: "UsersDto[]" },
    { method: "GET",  path: "/auth/current-user", note: "Resolve logged-in user from Authorization header",   response: "Users" },
    { method: "GET",  path: "/api/tasks",         note: "All tasks, assignees flattened to username/id lists", response: "TaskDto[]" },
    { method: "POST", path: "/api/tasks",         note: "Create task → save → broadcast full entity via WS",  response: "200 OK" },
    { method: "PUT",  path: "/api/tasks/{id}",    note: "Replace task fields → save → broadcast via WS",      response: "200 OK" },
    { method: "DELETE", path: "/api/tasks/{id}",  note: "Delete → broadcast integer taskId via WS",           response: "200 OK" },
  ],

  databaseSchema: {
    ddl: `-- users
CREATE TABLE users (
  user_id  INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL  -- BCrypt
);

-- tasks
CREATE TABLE tasks (
  task_id     INT PRIMARY KEY AUTO_INCREMENT,
  title       VARCHAR(255),
  description VARCHAR(255),
  priority    VARCHAR(50),   -- High | Medium | Low
  status      VARCHAR(50),   -- Backlog | InProgress | Completed
  due_date    DATE
);

-- many-to-many assignment
CREATE TABLE user_task (
  task_id INT REFERENCES tasks(task_id),
  user_id INT REFERENCES users(user_id)
);`,
    sample: {
      headers: ["task_id", "title", "priority", "status", "due_date"],
      rows: [
        ["1", "Design auth flow", "High",   "Completed",  "2025-03-10"],
        ["2", "Build task CRUD",  "High",   "InProgress", "2025-03-15"],
        ["3", "Add WS broadcast", "Medium", "Backlog",    "2025-03-20"],
      ],
    },
  },

  codeExample: [
    {
      path: "POST /auth/signin",
      caption: "01 · Signup then sign in to get a JWT. The token is valid for 1 hour and must be sent as a `Bearer` header on every `/api/**` request. The signing key is generated fresh at server startup — ephemeral by design.",
      language: "http",
      code: `# 1. Register a new user
curl -X POST http://localhost:8080/auth/signup \\
  -H "Content-Type: application/json" \\
  --json '{ "username": "alice", "password": "pass123" }'
# → 201  { "message": "User registered successfully" }

# 2. Sign in and receive the JWT
curl -X POST http://localhost:8080/auth/signin \\
  -H "Content-Type: application/json" \\
  --json '{ "username": "alice", "password": "pass123" }'
# → 200  { "token": "eyJhbGciOiJIUzI1NiJ9..." }  (1-hour expiry)

# 3. List all users (token required — used to populate the assignee picker)
curl http://localhost:8080/auth/users \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
# → 200  [ { "id": 1, "username": "alice" }, { "id": 2, "username": "bob" } ]`,
    },
    {
      path: "POST /api/tasks",
      caption: "02 · Create a task with multi-user assignment. The server re-fetches each `Users` entity by id before saving so the join table gets fully managed JPA objects. On success it immediately broadcasts the saved entity to `/topic/tasks` — every connected client receives the push and re-fetches its task list.",
      language: "http",
      code: `curl -X POST http://localhost:8080/api/tasks \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  --json '{
    "title":       "Build task CRUD",
    "description": "REST endpoints with WebSocket broadcast",
    "priority":    "High",
    "status":      "Backlog",
    "dueDate":     "2025-04-01",
    "assignees":   [{ "id": 1 }, { "id": 2 }]
  }'
# → 200  "Task added successfully"
# Server side: service.addTask(task) → webSocketTaskHandler.sendTaskUpdate(task)
# All /topic/tasks subscribers receive the full Tasks entity instantly`,
    },
    {
      path: "PUT /api/tasks/{id}  ·  drag-drop status update",
      caption: "03 · On drag-and-drop, Angular CDK moves the card optimistically between column arrays, then fires this request to persist the new status. The controller saves, then broadcasts the updated entity — every other open session re-fetches and sees the move.",
      language: "http",
      code: `# Card dragged from Backlog → InProgress
curl -X PUT http://localhost:8080/api/tasks/3 \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  --json '{
    "title":       "Build task CRUD",
    "description": "REST endpoints with WebSocket broadcast",
    "priority":    "High",
    "status":      "InProgress",
    "dueDate":     "2025-04-01",
    "assignees":   [{ "id": 1 }, { "id": 2 }]
  }'
# → 200  "Task updated successfully"
# WS broadcast: SimpMessagingTemplate.convertAndSend("/topic/tasks", updatedTask)

# Delete — broadcasts the integer taskId (not an entity)
curl -X DELETE http://localhost:8080/api/tasks/3 \\
  -H "Authorization: Bearer <token>"
# → 200  "Task deleted successfully"
# WS broadcast: convertAndSend("/topic/tasks", 3)   ← raw int, same topic`,
    },
    {
      path: "WebSocket — STOMP over SockJS",
      caption: "04 · The Angular `WebSocketService` boots a STOMP client at app startup and subscribes to `/topic/tasks`. Every incoming message triggers a full REST re-fetch — the WS payload is ignored; it is only a change signal. Reconnect delay is 5 s; heartbeat interval 4 s.",
      language: "java",
      code: `// Backend — registers the SockJS endpoint and simple in-memory broker
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:4200")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}

// Backend — pushes change events after every REST mutation
@Component
public class WebSocketTaskHandler {
    private final SimpMessagingTemplate messagingTemplate;

    public void sendTaskUpdate(Tasks task) {
        messagingTemplate.convertAndSend("/topic/tasks", task);
    }

    public void sendTaskDelete(int taskId) {
        messagingTemplate.convertAndSend("/topic/tasks", taskId);
    }
}`,
    },
  ],

  errorHandlingEdgeCases: [
    {
      title: "Ephemeral JWT secret",
      note: "The HmacSHA256 signing key is generated with `KeyGenerator.getInstance('HmacSHA256')` on `JwtServiceImpl` construction, not read from config. Every server restart invalidates all existing tokens — acceptable for a portfolio project, a hard bug in production.",
    },
    {
      title: "Unauthenticated WebSocket endpoint",
      note: "`/ws/**` is permit-all in Spring Security. Only the REST API verifies JWT. Any client that can reach the server can subscribe to `/topic/tasks` and receive task data without a valid token.",
    },
    {
      title: "Same topic for two payload shapes",
      note: "Add/update push a full `Tasks` entity; delete pushes an integer `taskId`. Both land on `/topic/tasks`. The Angular client sidesteps the ambiguity by ignoring the payload and always calling `loadTasks()` instead.",
    },
    {
      title: "Assignee resolution asymmetry on update",
      note: "`addTask()` re-fetches each `Users` entity from the repository to attach fully managed JPA objects. `updateTask()` sets `existingTask.setAssignees(task.getAssignees())` directly, skipping re-resolution — a behavioral difference between the two paths.",
    },
  ],

  keyInsight: "Using the WebSocket as a pure change-signal — ignoring the payload and always re-fetching from REST — eliminates all client-side merge logic. Any session that receives the signal ends up with exactly the same authoritative state from the server, regardless of what type of event triggered the broadcast. The tradeoff is one extra GET per mutation per connected client, which is fine at team scale but would need rethinking under high concurrency.",

  futureEnhancements: [
    "Replace the ephemeral HmacSHA256 key with a stable secret in environment config so tokens survive server restarts.",
    "Add a STOMP connect interceptor to validate JWT on WebSocket handshake — currently any client can subscribe without auth.",
    "Carry event type in the WS payload (ADD/UPDATE/DELETE + entity) so the client can apply a targeted patch instead of a full re-fetch on every broadcast.",
    "Persist card ordering within a column via a `position` field with gap-based numbering to avoid full-list re-numbering on every reorder.",
  ],
};
