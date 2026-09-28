import type { Metadata } from "next";
import Link from "next/link";
import { workData } from "@/data/work.data";
import { goDigitalKanban as task } from "@/data/tasks/go-digital-kanban";
import Section, { Prose, Points } from "@/components/task/Section";
import { Pull } from "@/components/task/Bits";
import CodeSlides from "@/components/task/CodeSlides";
import ZoomableSvg from "@/components/prose/ZoomableSvg";
import { kanbanFlowSvg } from "@/data/tasks/kanban-flow.svg";
import { ArrowLeft } from "@/components/icons";

export const metadata: Metadata = {
  title: task.title,
  description: task.description.slice(0, 180),
};

function locateProject() {
  for (const company of workData) {
    const project = company.projects.find((p) => p.id === "go-digital-kanban");
    if (project) return { company, project };
  }
  return null;
}

const backendSlides = [
  {
    file: "TasksController.java",
    caption: "Every change is saved by the service, then announced to all connected browsers.",
    code: `@PostMapping("/tasks")
public ResponseEntity<String> addingTask(@RequestBody Tasks task) {
    service.addTask(task);
    webSocketTaskHandler.sendTaskUpdate(task);
    return ResponseEntity.ok("Task added successfully");
}

@PutMapping("/tasks/{id}")
public ResponseEntity<String> updatingTask(@PathVariable int id, @RequestBody Tasks task) {
    service.updateTask(id, task);
    webSocketTaskHandler.sendTaskUpdate(task);
    return ResponseEntity.ok("Task updated successfully");
}

@DeleteMapping("/tasks/{id}")
public ResponseEntity<String> deletingTask(@PathVariable int id) {
    service.deleteTask(id);
    webSocketTaskHandler.sendTaskDelete(id);
    return ResponseEntity.ok("Task deleted successfully");
}`,
  },
  {
    file: "TasksServiceImpl.java",
    caption: "The rules live in the service: a due date in the future, and assignees looked up before saving.",
    code: `public void addTask(Tasks task) {
    if (task.getDueDate() == null || task.getDueDate().before(new Date())) {
        throw new IllegalArgumentException("Due date must be a future date");
    }
    if (task.getAssignees() != null && !task.getAssignees().isEmpty()) {
        Set<Users> existingUsers = task.getAssignees().stream()
                .map(user -> usersRepository.findById(user.getId()).orElse(null))
                .filter(user -> user != null)
                .collect(Collectors.toSet());
        task.setAssignees(existingUsers);
    }
    repo.save(task);
}`,
  },
  {
    file: "WebSocketConfig.java and WebSocketTaskHandler.java",
    caption: "One STOMP endpoint over SockJS, one topic, and a handler that sends to it.",
    code: `@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins("http://localhost:4200").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}

@Component
public class WebSocketTaskHandler {
    public void sendTaskUpdate(Tasks task) {
        messagingTemplate.convertAndSend("/topic/tasks", task);
    }

    public void sendTaskDelete(int taskId) {
        messagingTemplate.convertAndSend("/topic/tasks", taskId);
    }
}`,
  },
];

const frontendSlides = [
  {
    file: "task.component.ts: drop()",
    caption: "Dropping a card in another column changes its status. The card moves at once, then the change is saved.",
    code: `drop(event: CdkDragDrop<any[]>) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    const task = event.previousContainer.data[event.previousIndex];
    const updatedTask = { ...task, status: this.getStatusFromList(event.container.id) };

    transferArrayItem(event.previousContainer.data, event.container.data,
                      event.previousIndex, event.currentIndex);

    this.taskService.updateTask(task.id, updatedTask).subscribe();
  }
}

getStatusFromList(listId: string) {
  switch (listId) {
    case 'backlogList':    return 'Backlog';
    case 'inProgressList': return 'InProgress';
    case 'completedList':  return 'Completed';
  }
}`,
  },
  {
    file: "websocket.service.ts",
    caption: "The app connects once, subscribes to the channel, and reconnects by itself if it drops.",
    code: `this.stompClient = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});

this.stompClient.onConnect = () => {
  this.stompClient.subscribe('/topic/tasks', (message) => {
    this.taskUpdates.next(JSON.parse(message.body));
  });
};

this.stompClient.activate();`,
  },
  {
    file: "task.component.ts: subscribeToTaskUpdates()",
    caption: "Any message means something changed, so the board reloads the list from the server.",
    code: `subscribeToTaskUpdates() {
  this.taskService.getTaskUpdates().subscribe(() => {
    this.loadTasks();
    this.applyFilters();
  });
}`,
  },
];

export default function GoDigitalKanbanPage() {
  const place = locateProject();
  const tags = task.techTags.filter((t) => !/JWT|JJWT|Security/i.test(t));

  const sections: { id: string; title: string; body: React.ReactNode }[] = [];
  const add = (id: string, title: string, body: React.ReactNode) =>
    sections.push({ id, title, body });

  add(
    "project",
    "The project",
    <div className="space-y-5">
      <Prose>
        Go Digital was building a project management portal, in the spirit of Jira: one place where a team plans its work as tasks,
        assigns each one to the people responsible, and follows it from the backlog through to done.
      </Prose>
      <Prose>
        It is a full-stack web app, an Angular frontend on top of a Spring Boot API and a MySQL database, and the board of tasks is
        the part of it people spend their day in.
      </Prose>
    </div>
  );

  add(
    "part",
    "My part in it",
    <div className="space-y-5">
      <Prose>
        I joined as an intern, and this is the piece I was given: the live task board. Tasks are created, edited and dragged between
        Backlog, In Progress and Completed, and when one person changes something, everyone else looking at the board sees it at once,
        without refreshing.
      </Prose>
      <Prose>
        I built it across both sides, the Angular screens and the Spring Boot service behind them, in a three-week sprint.
      </Prose>
    </div>
  );

  add(
    "backend",
    "What I built: backend",
    <div>
      <Points
        items={[
          "The task API in Spring Boot: endpoints to list, add, update and delete tasks, split into a controller, a service and a repository.",
          "The data model in MySQL: a task has a title, description, priority, status (Backlog, InProgress or Completed) and due date, and can be assigned to several people.",
          "The rules on the server, such as a due date having to be in the future, and looking up each assignee properly before a task is saved.",
          "The WebSocket channel: a STOMP endpoint over SockJS, and a small handler that announces every add, update and delete to everyone connected.",
        ]}
      />
      <CodeSlides slides={backendSlides} />
    </div>
  );

  add(
    "frontend",
    "What I built: frontend",
    <div>
      <Points
        items={[
          "The board itself, in Angular 16 with Angular Material: three columns, Backlog, In Progress and Completed, each listing its task cards.",
          "Adding and editing a task in a dialog (title, description, priority, assignees and due date), and a confirmation before a task is deleted.",
          "Drag and drop with Angular CDK. A card moves to its new column straight away on my screen, and the change is then saved to the server.",
          "Filters by priority, assignee and due-date range, and a sort by priority or date that works on each column separately.",
          "The live connection: a small service that stays connected to the server over WebSocket, listens for changes, and reconnects on its own if the connection drops.",
        ]}
      />
      <CodeSlides slides={frontendSlides} />
    </div>
  );

  add(
    "together",
    "How the two work together",
    <div className="space-y-7">
      <ZoomableSvg svg={kanbanFlowSvg} caption="A change goes to the API, is saved, and is announced on one WebSocket channel; every open browser then reloads the board." />
      <Prose>
        The frontend stays subscribed to one channel, <code>/topic/tasks</code>. After every save or delete, the backend sends a message
        to that channel. That message is only a signal that something changed: each browser ignores what is in it and simply asks the
        API for the current list of tasks.
      </Prose>
      <Prose>
        Adding a task, moving a card, editing and deleting all follow the same path, so there is one flow to understand and nothing to
        merge on the client.
      </Prose>
    </div>
  );

  add(
    "conclusion",
    "Conclusion",
    <div className="space-y-7">
      {task.keyInsight && <Pull>{task.keyInsight}</Pull>}
      <Prose>
        It was my first time building a feature end to end: a screen, the API behind it, the database, and the live link between
        them. Owning both sides is what showed me how a small decision on one side, like what the server broadcasts, shapes
        everything on the other.
      </Prose>
    </div>
  );

  return (
    <main className="min-h-screen" style={{ overflowX: "clip", maxWidth: "100vw" }}>
      {(place?.project?.walkthroughUrl ?? task.image) && (
        <div style={{ width: "100%", aspectRatio: "5/2", overflow: "hidden" }}>
          <img src={place?.project?.walkthroughUrl ?? task.image} alt={task.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
        </div>
      )}

      <div className="mx-auto max-w-[1220px] px-6 md:px-10 pt-10 pb-32">
        <div className="flex flex-wrap items-center gap-x-2 mono">
          <Link href="/work" className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent-strong)]" style={{ color: "var(--ink-30)" }}>
            <ArrowLeft size={12} />
            Work
          </Link>
          {place && (
            <>
              <span style={{ color: "var(--ink-15)" }}>/</span>
              <span style={{ color: "var(--ink-30)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {place.company.company}
              </span>
            </>
          )}
        </div>

        <header className="mt-8">
          <h1 className="display text-[clamp(2rem,5vw,3.4rem)]">
            {task.title}
          </h1>

          <p className="mt-6 text-[16px] leading-[1.72]" style={{ color: "var(--ink-70)" }}>
            {task.description}
          </p>

          <p className="mono mt-5" style={{ color: "var(--ink-30)" }}>
            {tags.join("  ·  ")}
          </p>
        </header>

        <div className="mt-16 flex gap-14">
          <div className="min-w-0 flex-1">
            {sections.map((s, i) => (
              <Section key={s.id} id={s.id} index={i + 1} title={s.title}>
                {s.body}
              </Section>
            ))}
          </div>

          {sections.length > 2 && (
            <aside className="hidden lg:block w-[188px] shrink-0">
              <div className="sticky top-28">
                <p className="label mb-4">Contents</p>
                <ol className="space-y-2.5">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="flex gap-3 text-[13px] transition-colors hover:text-[var(--accent-strong)]" style={{ color: "var(--ink-45)" }}>
                        <span className="mono" style={{ color: "var(--ink-15)" }}>{String(i + 1).padStart(2, "0")}</span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}
        </div>

      </div>

    </main>
  );
}
