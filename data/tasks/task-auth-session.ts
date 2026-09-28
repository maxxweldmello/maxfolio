import type { Task } from "../tasks.data";

export const taskAuthSession: Task = {
  taskId:    "task-auth-session",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Netty-SocketIO", "AWS Cognito", "MySQL", "ConcurrentHashMap"],
  image:     "/tasks/auth-session/hero.jpg",

  title: "Real-Time Session Management via Socket.IO",

  description: "Every admin login becomes a live Socket.IO connection bound to its Cognito access token. A super-admin can revoke any session — one tab, one device, or every device a user owns — and the affected browser disconnects + redirects to login in real time; the same revoke also kills the Cognito token so refresh paths can't re-issue.",

  ideaPipeline: {
    steps: ["Socket Handshake", "ClientSocketManager", "/signout-by-super-admin", "Cognito globalSignOut", "Broadcast logged_out"],
    caption: "Netty-SocketIO server on its own port binds every login to a live connection keyed by username + access token. Force-logout hits the IdP, flips a DB flag, and pushes a logout event to every socket the user owns — in one round trip.",
  },

  problemStatement: "Once a Cognito JWT was issued there was no way to revoke it before natural expiry. If an admin was offboarded, terminated, or compromised, ops had no kill switch — the token kept working until it expired. There was also no live visibility into who was signed in, on which device, from where. Polling wasn't acceptable: the revocation gap had to be sub-second, and a polled API would have hammered Cognito quotas.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "POST /admin/authentication/signin",
      caption: "01 · Sign-in — Cognito issues the token, one login-session row lands",
      language: "http",
      code: `# Entry point to the whole system. The response's accessToken is what
# every downstream Socket.IO handshake, fetch, and revoke will key off.

curl -X POST https://api.kayana.io/admin/authentication/signin \\
  -H "Content-Type: application/json" \\
  --json '{
    "email":    "admin@kayana.io",
    "password": "••••••••",
    "totp":     "482913",
    "ipAddress":"82.14.11.9"
  }'

# → ServiceResponseBean.data (Cognito payload)
{
  "status": true,
  "data": {
    "username":     "admin@kayana.io",
    "accessToken":  "eyJraWQi…",         # what pins every future socket
    "idToken":      "eyJraWQi…",
    "refreshToken": "eyJjdHki…",
    "expiresIn":    3600
  }
}

# On success the service inserts a row into kayana_admin.kayana_admin_login_sessions
# (username, access_token, browser_detail, os_detail, location,
#  is_currently_logged_in=true, ...) — see stage 07 for the shape.
`,
    },
    {
      path: "com.kayana.configs.KayanaSocketIOConfig",
      caption: "03 · The Netty-SocketIO server — its own port, its own lifecycle",
      language: "java",
      code: `package com.kayana.configs;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KayanaSocketIOConfig {

    @Value("\${socketio.host:localhost}")
    private String host;

    @Value("\${socketio.port:9092}")
    private int port;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config =
            new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin("*");
        return new SocketIOServer(config);
    }

    // Starts the server on Spring boot-up, tears it down on JVM shutdown.
    // Runs independently of the WebFlux HTTP pipeline — a slow event loop
    // never blocks the socket server and vice-versa.
    @Bean
    public CommandLineRunner socketServerRunner(SocketIOServer server) {
        return args -> {
            server.start();
            Runtime.getRuntime().addShutdownHook(new Thread(server::stop));
        };
    }
}
`,
    },
    {
      path: "com.kayana.handler.KayanaSocketIOEventHandler",
      caption: "04 · Event wiring — connect / disconnect / user_details / individual_logout",
      language: "java",
      code: `@Component
public class KayanaSocketIOEventHandler {

    @Value("#{'\${spring.application.name}'.toUpperCase()}")
    private String applicationName;

    @Autowired private IKayanaAdminLoginSessionRepo loginSessionRepo;
    @Autowired private KayanaClientSocketManagerUtils socketManager;
    @Autowired private KayanaAdminAuthenticationService authService;

    @Autowired
    public KayanaSocketIOEventHandler(SocketIOServer server) {

        // Connect — register the client under its username (from handshake).
        server.addConnectListener(client -> {
            String username = client.getHandshakeData().getSingleUrlParam("username");
            if (username != null) socketManager.registerByUsername(username, client);
        });

        // Disconnect — clean both the username→clients list AND the
        // sessionId→token maps, so a stale token never points at a dead socket.
        server.addDisconnectListener(client -> {
            String username = client.getHandshakeData().getSingleUrlParam("username");
            if (username != null) socketManager.unregisterClient(username, client);
            socketManager.unregisterSession(client.getSessionId());
        });

        // user_details — client tells us which accessToken this socket owns.
        // We now know: "sessionId → accessToken → SocketIOClient", so a
        // single-tab revoke can find one exact socket to disconnect.
        server.addEventListener("user_details", Map.class, (client, data, ackSender) -> {
            String accessToken = (String) data.get("access_token");
            String socketIdStr = (String) data.get("socket_id");
            String username    = (String) data.get("username");
            if (accessToken != null && socketIdStr != null && username != null) {
                try {
                    UUID socketSessionId = UUID.fromString(socketIdStr);
                    socketManager.registerSessionClient(socketSessionId, accessToken, client);
                    socketManager.registerByAccessToken(accessToken, client);
                } catch (IllegalArgumentException ignored) {}
            }
        });

        // individual_logout — the user self-closed one tab. Flip the DB flag
        // for that access token and push individual_logout_by_access_token
        // to only that socket.
        server.addEventListener("individual_logout", Map.class, (client, data, ackSender) -> {
            String accessToken = (String) data.get("access_token");
            if (accessToken == null || accessToken.isEmpty()) return;
            KayanaAdminLoginSession row = loginSessionRepo.findByKalsAccessToken(accessToken);
            if (row != null) {
                row.setKalsIsCurrentlyLoggedIn(Boolean.FALSE);
                row.setKalsUpdatedBy(applicationName);
                row.setKalsUpdatedDate(Calendar.getInstance());
                loginSessionRepo.saveAndFlush(row);
            }
            socketManager.notifyIndividualLogout(accessToken);
        });
    }
}
`,
    },
    {
      path: "com.kayana.utils.KayanaClientSocketManagerUtils",
      caption: "05 · In-memory registries — three ConcurrentHashMaps, everything O(1)",
      language: "java",
      code: `@Component
public class KayanaClientSocketManagerUtils {

    // username → every open socket that user owns (one per tab / device)
    private final Map<String, List<SocketIOClient>> clients = new ConcurrentHashMap<>();

    // sessionId ↔ accessToken bidirectional — needed for per-tab revoke
    private final Map<UUID, String>          sessionToAccessTokenMap = new ConcurrentHashMap<>();
    private final Map<UUID, SocketIOClient>  sessionToClientMap      = new ConcurrentHashMap<>();

    // ─── register / unregister ───────────────────────────────────────────
    public synchronized void registerByUsername(String username, SocketIOClient client) {
        clients.computeIfAbsent(username, k -> new ArrayList<>()).add(client);
    }
    public synchronized void registerByAccessToken(String accessToken, SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        sessionToClientMap.put(sessionId, client);
        sessionToAccessTokenMap.put(sessionId, accessToken);
    }
    public synchronized void unregisterClient(String username, SocketIOClient client) {
        if (clients.containsKey(username)) {
            clients.get(username).remove(client);
            if (clients.get(username).isEmpty()) clients.remove(username);
        }
    }
    public void unregisterSession(UUID sessionId) {
        sessionToAccessTokenMap.remove(sessionId);
        sessionToClientMap.remove(sessionId);
    }

    // ─── lookups ─────────────────────────────────────────────────────────
    public List<SocketIOClient> getClients(String username) {
        return clients.getOrDefault(username, Collections.emptyList());
    }
    public SocketIOClient getClientByAccessToken(String accessToken) {
        for (Map.Entry<UUID, String> e : sessionToAccessTokenMap.entrySet())
            if (e.getValue().equals(accessToken)) return sessionToClientMap.get(e.getKey());
        return null;
    }

    // ─── individual-tab logout push ──────────────────────────────────────
    public void notifyIndividualLogout(String accessToken) {
        SocketIOClient target = getClientByAccessToken(accessToken);
        if (target != null) {
            target.sendEvent("individual_logout_by_access_token", accessToken);
            unregisterByAccessToken(accessToken);
        }
    }
}
`,
    },
    {
      path: "kayana_admin.kayana_admin_login_sessions",
      caption: "06 · Where the sessions live — one row per (user, device, token)",
      language: "sql",
      code: `-- One row per active browser/device. When a token is issued by Cognito
-- during /signin the service inserts a row; when the user (or a super-admin)
-- signs out, kals_is_currently_logged_in flips to false.
CREATE TABLE kayana_admin.kayana_admin_login_sessions (
  kals_seq_id                 BIGSERIAL PRIMARY KEY,
  kals_username               VARCHAR(255),
  kals_access_token           TEXT,
  kals_browser_detail         VARCHAR(120),
  kals_os_detail              VARCHAR(80),
  kals_location               VARCHAR(160),  -- ip → geo, best-effort
  kals_is_currently_logged_in BOOLEAN,
  kals_created_by             VARCHAR(80),
  kals_created_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kals_updated_by             VARCHAR(80),
  kals_updated_date           TIMESTAMPTZ
);
CREATE INDEX ix_kals_username_active
  ON kayana_admin.kayana_admin_login_sessions (kals_username, kals_is_currently_logged_in);

-- Two rows for one user with two tabs open on the same laptop:
INSERT INTO kayana_admin.kayana_admin_login_sessions (
  kals_username, kals_access_token, kals_browser_detail, kals_os_detail,
  kals_location, kals_is_currently_logged_in, kals_created_by
) VALUES
  ('admin@kayana.io','eyJraWQi…A','Chrome 128','macOS 15','London, GB', true, 'KAYANA-ADMIN-SERVICE'),
  ('admin@kayana.io','eyJraWQi…B','Chrome 128','macOS 15','London, GB', true, 'KAYANA-ADMIN-SERVICE');
`,
    },
    {
      path: "GET /admin/authentication/fetch-all-login-sessions",
      caption: "07 · Read side — 'who's signed in right now?'",
      language: "http",
      code: `# What the super-admin's sessions screen calls. Response mirrors the DB
# table above, restricted to currently-logged-in rows for one username.

curl -X GET "https://api.kayana.io/admin/authentication/fetch-all-login-sessions\\
?username=admin@kayana.io" \\
  -H "Authorization: Bearer <super_admin_jwt>"

# ServiceResponseBean.data
{
  "status": true,
  "data": [
    {
      "kalsSeqId":       11421,
      "kalsUsername":    "admin@kayana.io",
      "kalsAccessToken": "eyJraWQi…A",       # what the revoke will target
      "kalsBrowserDetail": "Chrome 128",
      "kalsOsDetail":      "macOS 15",
      "kalsLocation":      "London, GB",
      "kalsIsCurrentlyLoggedIn": true,
      "kalsCreatedDate": "2026-08-29T18:12:11Z"
    },
    { "kalsSeqId": 11422, "kalsAccessToken": "eyJraWQi…B", "..." : "..." }
  ]
}
`,
    },
    {
      path: "POST /admin/authentication/signout-by-super-admin",
      caption: "08 · Revoke — one call to kill one tab, one device, or every session",
      language: "http",
      code: `# The 'kill' button next to each session row on the admin dashboard.
# Targets one accessToken; the service will find every socket the user
# owns and disconnect them all (stage 09).

curl -X POST "https://api.kayana.io/admin/authentication/signout-by-super-admin\\
?access_token=eyJraWQi…A" \\
  -H "Authorization: Bearer <super_admin_jwt>"

# → ServiceResponseBean
{
  "status": true,
  "message": "User signed out successfully."
}

# Under the hood: Cognito globalSignOut (kills the refresh path) →
# flip every active kayana_admin_login_sessions row for this user →
# broadcast "logged_out" to every SocketIOClient bound to that username.
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminAuthenticationService#signOutBySuperAdmin",
      caption: "09 · The whole revoke — Cognito + DB + socket broadcast, one method",
      language: "java",
      code: `public ServiceResponseBean signOutBySuperAdmin(String accessToken,
                                               ServiceResponseBean srb) {
    try {
        KayanaAdminLoginSession row = loginSessionRepo.findByKalsAccessToken(accessToken);
        if (row == null) {
            srb.setStatus(false);
            srb.setMessage("No matching session found for the provided access token.");
            return srb;
        }

        // 1. Kill the token on the IdP — refresh path can't reissue.
        GlobalSignOutRequest req = GlobalSignOutRequest.builder()
                .accessToken(accessToken).build();
        awsCognitoIdentityProvider.globalSignOut(req);

        // 2. Flip every active row for this user in the DB — one write batch.
        String username = row.getKalsUsername();
        List<KayanaAdminLoginSession> active = loginSessionRepo
            .findByKalsUsernameAndKalsIsCurrentlyLoggedInTrueOrderByKalsUpdatedDateDescKalsCreatedDateDesc(username);
        if (!CollectionUtils.isEmpty(active)) {
            Calendar now = Calendar.getInstance();
            active.forEach(s -> {
                s.setKalsIsCurrentlyLoggedIn(Boolean.FALSE);
                s.setKalsUpdatedBy(applicationName);
                s.setKalsUpdatedDate(now);
            });
            loginSessionRepo.saveAll(active);
        }

        // 3. Push "logged_out" to every open socket for this username —
        //    sub-second, no polling. The browser handles the redirect.
        List<SocketIOClient> clients = socketManager.getClients(username);
        for (SocketIOClient c : clients) c.sendEvent("logged_out", "You are been logged out");

        srb.setStatus(true);
        srb.setMessage("User signed out successfully.");
    } catch (NotAuthorizedException e) {
        srb.setStatus(false);
        srb.setMessage("Access Token expired or invalid");
    } catch (Exception e) {
        srb.setStatus(false);
        srb.setMessage("Unexpected error: " + e.getMessage());
    }
    return srb;
}
`,
    },
  ],

  keyInsight: "Two parallel sources of truth, each doing the job it's good at. The DB row answers 'who WAS signed in' — durable, queryable, audit-friendly. The in-memory registry answers 'who can I REACH right now' — lock-free maps under ConcurrentHashMap, O(1) lookups, lost on restart by design. Trying to keep them perfectly in sync on every socket event would re-introduce the polling latency the sockets were built to avoid.",

  requestTrace: [
    { phase: "SIGN-IN",    detail: "HTTP POST returns Cognito id/access/refresh tokens. saveLoginSession persists a kayana_admin_login_sessions row with browser, OS, geo-IP location, and kals_is_currently_logged_in=TRUE." },
    { phase: "CONNECT",    detail: "Client opens a Socket.IO connection to port 9092 with ?username=<u>. The connect listener registers the SocketIOClient under that username in ClientSocketManager." },
    { phase: "BIND",       detail: "Client emits user_details with {access_token, socket_id, username}. The handler binds the access token to this specific SocketIOClient via sessionId → token + sessionId → client maps." },
    { phase: "KILL",       detail: "Super-admin calls POST /signout-by-super-admin?access_token=<t>. The service runs Cognito globalSignOut, flips kals_is_currently_logged_in=FALSE in the DB, and broadcasts logged_out to every socket of that username." },
    { phase: "REDIRECT",   detail: "All of the user's open tabs receive logged_out, clear local state, and redirect to /login — typically within the same network RTT as the API call." },
    { phase: "DISCONNECT", detail: "Browser close / network drop triggers the disconnect listener, which removes the SocketIOClient from the maps. The DB row remains TRUE until the next explicit signout or the verification path corrects it." },
  ],

  constraintsLimitations: [
    "Single-instance only: the in-memory registry doesn't span nodes. Force-logout reaches only sockets on the issuing instance — Redis Pub/Sub fan-out is pre-designed but not wired.",
    "The socket handshake doesn't itself verify the access token; trust currently rests on the HTTP layer that issued it.",
    "Disconnect leaves kals_is_currently_logged_in=TRUE until the next explicit signout or verification call — the dashboard can show stale-live rows briefly.",
  ],

  conclusion: "A token bound to a live socket turns 'invalidate this user' from 'wait for the token to expire' into a one-line API call. Two maps, four listeners, one DB table — and the ops team gets the kill switch a fintech-grade admin platform actually needs.",
};
