import type { Task } from "../tasks.data";

export const taskAudit: Task = {
  taskId:    "task-audit",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Spring AOP", "Spring Events", "MySQL"],
  image:     "/tasks/audit/hero.jpg",

  title: "Annotation-Driven AOP-Based Centralized Activity Logging",

  description: "One Spring AOP annotation turns every state-changing admin action into a tamper-resistant audit row — captured by an aspect, published as an `ApplicationEvent`, and persisted to `kayana_admin_audit_log`. Centralised so no controller has to remember to log; the annotation captures actor + action + entity id + a before/after JSON snapshot for diff-able history.",

  ideaPipeline: {
    steps: ["@LogActivity", "KayanaLoggingAspect (@Around)", "ActivityLogEvent", "@EventListener", "MySQL"],
    caption: "Method-level annotation, AOP captures intent off the ServiceResponseBean, publishes an immutable event — a dedicated listener writes the row to kayana_activity_log_details on a background thread so the caller is never blocked.",
  },

  problemStatement: "The Kayana Web Admin Portal platform spans 12+ Spring Boot services that all mutate sensitive state — tags, timings, pricing, partner settings, KYC. Most logged nothing. When a partner asked 'who changed this?' support engineers had no answer. We needed one durable audit trail across every service — without rewriting any of them.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "PUT /admin/timing/update-property-timings",
      caption: "01 · CRUD — admin edits a property's opening hours",
      language: "http",
      code: `# One representative endpoint from kayana-admin-service. 40+ services
# use the exact same pattern — every state-changing admin call is
# audit-instrumented, and the caller sees nothing extra.

curl -X PUT https://api.kayana.io/admin/timing/update-property-timings \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: admin@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "propertyId": "PROP-2201",
    "propertyTimingDetailBean": [
      { "day": "MON", "openTime": "09:00", "closeTime": "23:00", "status": "OPEN" }
    ],
    "platform": "WEB_ADMIN"
  }'

# → ServiceResponseBean
{
  "status": true,
  "message": null,
  "description": "Weekday close: 22:00 → 23:00",
  "propertyId": "PROP-2201",
  "data": null
}

# The aspect never touches the request/response shape. The service
# method decides what the audit line says by setting \`description\` and
# \`propertyId\` on the response bean — see tab 02.
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminTimingService",
      caption: "02 · The annotation site — one line makes it auditable",
      language: "java",
      code: `@Override
@LogActivity(status = ActivityLogStatusEnum.PROPERTY_TIMINGS, username = "username")
public ServiceResponseBean updatePropertyTimings(
        UpdatePropertyTimingRequestBean req,
        String username,
        ServiceResponseBean srb) {

    KayanaBusinessTimingDetail row =
        timingRepo.findByKbtdPropertyId(req.getPropertyId());
    if (row == null) {
        srb.setMessage("No details found to update");
        return srb;
    }

    List<PropertyTimingDetailBean> oldTiming = toBeanList(row.getKbtdPropertyTiming());
    List<PropertyTimingDetailBean> newTiming = req.getPropertyTimingDetailBean();

    // The aspect reads \`description\` and \`propertyId\` off the bean
    // the moment this method returns. Nothing else needs to happen here.
    String description = buildTimingDiffDescription(oldTiming, newTiming);

    row.setKbtdPropertyTiming(resolvePayload(row.getKbtdPropertyTiming(), newTiming));
    row.setKbtdUpdatedBy(applicationName);
    row.setKbtdUpdatedDate(Calendar.getInstance());
    timingRepo.saveAndFlush(row);
    kafkaProducer.publishUpdateSettingsNotification(row.getKbtdPropertyId(),
                                                    "UPDATE PROPERTY TIMING");

    srb.setStatus(true);
    srb.setPropertyId(req.getPropertyId());
    srb.setDescription(description);
    return srb;
}
`,
    },
    {
      path: "com.kayana.annotations.LogActivity",
      caption: "03 · The annotation — the entire developer surface",
      language: "java",
      code: `package com.kayana.annotations;

import com.kayana.enums.ActivityLogStatusEnum;
import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogActivity {

    /** Action name — becomes kald_log_activity on the row. */
    ActivityLogStatusEnum status() default ActivityLogStatusEnum.UNKNOWN;

    /**
     * Who did it. Two forms:
     *   • plain param name:  "username"          → direct match on a method parameter
     *   • SpEL expression:   "#req.username"     → evaluated with all params bound
     *                        "'sys:' + #accountId"
     *                        "#a ?: 'GUEST'"
     */
    String username();

    /** Client platform — WEB_ADMIN, PARTNER_ADMIN, MOBILE, ... */
    String platform() default "WEB_ADMIN";
}
`,
    },
    {
      path: "com.kayana.aspects.KayanaLoggingAspect",
      caption: "04 · The @Around interceptor — captures intent, dispatches async",
      language: "java",
      code: `@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class KayanaLoggingAspect {

    private final ActivityLogDispatchService dispatch;
    private final SpelExpressionParser spelParser = new SpelExpressionParser();

    @Around("@annotation(logActivity)")
    public Object logActivity(ProceedingJoinPoint jp, LogActivity logActivity) throws Throwable {
        Object[] args       = jp.getArgs();
        String[] paramNames = ((MethodSignature) jp.getSignature()).getParameterNames();

        ActivityLogStatusEnum status = logActivity.status();
        String username = resolveExpression(logActivity.username(), paramNames, args, null);
        String platform = logActivity.platform();

        // Method runs first — audit never delays the caller.
        Object result = jp.proceed();

        if (result instanceof ServiceResponseBean srb) {
            if (!Boolean.TRUE.equals(srb.getStatus())) return result; // skip failures

            String propertyId  = srb.getPropertyId()  != null ? srb.getPropertyId()  : "";
            String description = srb.getDescription() != null ? srb.getDescription() : "";
            if (status == ActivityLogStatusEnum.UNKNOWN && srb.getActivityLogStatusEnum() != null)
                status = srb.getActivityLogStatusEnum();
            if ((platform == null || platform.isBlank()) && srb.getPlatform() != null)
                platform = srb.getPlatform();

            // Fire and forget — see tab 05.
            dispatch.dispatch(status, username, propertyId, description, platform);
        }
        return result;
    }

    /** Plain param-name match first, SpEL as a fallback (see full file). */
    private String resolveExpression(String expr, String[] names, Object[] args, String def) {
        // ... implementation elided for brevity ...
        return null;
    }
}
`,
    },
    {
      path: "com.kayana.service.impl.ActivityLogDispatchService",
      caption: "05 · Async handoff — off the WebFlux event loop, over to log-service",
      language: "java",
      code: `@Service
@Slf4j
@RequiredArgsConstructor
public class ActivityLogDispatchService {

    @Value("#{'\${spring.application.name}'.toUpperCase()}")
    private String applicationName;

    private final ApplicationEventPublisher applicationEventPublisher;

    @Nullable private IKayanaLogFeignClient kayanaLogFeignClient;

    @Autowired(required = false)
    public void setKayanaLogFeignClient(IKayanaLogFeignClient c) {
        this.kayanaLogFeignClient = c;
    }

    @Async
    public void dispatch(ActivityLogStatusEnum status, String username,
                         String propertyId, String description, String platform) {

        ActivityLogRequestBean req = ActivityLogRequestBean.builder()
            .status(status.getValue())
            .username(username)
            .propertyId(propertyId)
            .description(description)
            .applicationName(applicationName)   // e.g. "KAYANA-ADMIN-SERVICE"
            .platformAccess(platform)
            .build();

        try {
            if (kayanaLogFeignClient != null) {
                kayanaLogFeignClient.generateLog(req);      // → POST /log/activity
            } else {
                publishLocalEvent(status, username, propertyId, description, platform);
            }
        } catch (Exception e) {
            // Log-service unreachable — fall back to a local ApplicationEvent
            // so the row still lands.
            log.warn("Log service unreachable, falling back to local DB: {}", e.getMessage());
            publishLocalEvent(status, username, propertyId, description, platform);
        }
    }
}
`,
    },
    {
      path: "POST /log/activity",
      caption: "06 · Log-service receives it — one write endpoint per event",
      language: "http",
      code: `# What the Feign client above posts to. kayana-log-service owns the
# audit schema; every service in the cluster hits this one endpoint.

curl -X POST https://api.kayana.io/log/activity \\
  -H "Content-Type: application/json" \\
  --json '{
    "status":          "PROPERTY_TIMINGS",
    "username":        "admin@kayana.io",
    "propertyId":      "PROP-2201",
    "description":     "Weekday close: 22:00 → 23:00",
    "applicationName": "KAYANA-ADMIN-SERVICE",
    "platformAccess":  "WEB_ADMIN",
    "currentState":    { "MON": { "open": "09:00", "close": "22:00" } },
    "newState":        { "MON": { "open": "09:00", "close": "23:00" } }
  }'

# → bare Boolean; admin-service treats it as fire-and-forget.
{ "data": true }
`,
    },
    {
      path: "kayana_audit.kayana_activity_log_details",
      caption: "07 · Where it lands — one immutable row per audit event",
      language: "sql",
      code: `-- Lives in its own schema (kayana_audit) with no UPDATE / DELETE grants
-- for the service role, so a row can't be quietly rewritten later.
CREATE TABLE kayana_audit.kayana_activity_log_details (
  kald_seq_id           BIGSERIAL PRIMARY KEY,
  kald_username         VARCHAR(255),
  kald_log_activity     VARCHAR(80),          -- ActivityLogStatusEnum.value
  kald_log_description  TEXT,
  kald_property_id      VARCHAR(64),
  kald_created_by       VARCHAR(80),          -- upstream applicationName
  kald_created_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kald_logs_current     JSONB,                -- currentState from tab 06
  kald_logs_new         JSONB,                -- newState from tab 06
  kald_platform_access  VARCHAR(32)           -- WEB_ADMIN / PARTNER_ADMIN / ...
);

CREATE INDEX ix_kald_property_id_created
  ON kayana_audit.kayana_activity_log_details (kald_property_id, kald_created_date DESC);

-- The row the walkthrough above produces:
INSERT INTO kayana_audit.kayana_activity_log_details (
  kald_username, kald_log_activity, kald_log_description,
  kald_property_id, kald_created_by,
  kald_logs_current, kald_logs_new, kald_platform_access
) VALUES (
  'admin@kayana.io',
  'PROPERTY_TIMINGS',
  'Weekday close: 22:00 → 23:00',
  'PROP-2201',
  'KAYANA-ADMIN-SERVICE',
  '{"MON":{"open":"09:00","close":"22:00"}}'::jsonb,
  '{"MON":{"open":"09:00","close":"23:00"}}'::jsonb,
  'WEB_ADMIN'
);
`,
    },
    {
      path: "GET /admin/log/fetch-logs",
      caption: "08 · Read side — paged ledger, most recent first",
      language: "http",
      code: `# The Activity screen in the admin portal calls this on load.

curl -X GET "https://api.kayana.io/admin/log/fetch-logs?page=0&size=25" \\
  -H "Authorization: Bearer <admin_jwt>"

# ServiceResponseBean → data.rows[]
{
  "status": true,
  "data": {
    "page": 0,
    "size": 25,
    "total": 4218,
    "rows": [
      {
        "logActivity":            "PROPERTY_TIMINGS",
        "businessTradingname":    "Riverside Cafe",
        "username":               "admin@kayana.io",
        "logActivityDescription": "Weekday close: 22:00 → 23:00",
        "logActivityDateTime":    "2026-08-29T18:42:11Z",
        "logCreatedFrom":         "KAYANA-ADMIN-SERVICE"
      }
    ]
  }
}

# The service joins across kayana_business_user_master /
# kayana_admin_user_master / kayana_customer to resolve \`username\` into
# \`businessTradingname\` — the audit row itself only stores raw username.
`,
    },
    {
      path: "GET /admin/log/fetch-logs-by-property-id",
      caption: "09 · Drill-down — 'who changed this property?'",
      language: "http",
      code: `curl -X GET "https://api.kayana.io/admin/log/fetch-logs-by-property-id\\
?property_id=PROP-2201&page=0&size=25" \\
  -H "Authorization: Bearer <admin_jwt>"

# Same shape as fetch-logs but scoped to one propertyId. Support opens
# a business, sees only its own history — no cross-tenant leakage.
{
  "status": true,
  "data": {
    "propertyId": "PROP-2201",
    "page": 0, "size": 25, "total": 62,
    "rows": [
      {
        "logActivity":            "APPLICATION_CHARGE",
        "username":               "ops@kayana.io",
        "logActivityDescription": "Application charge: 1.5% → 1.75%",
        "logActivityDateTime":    "2026-08-27T15:12:04Z",
        "logCreatedFrom":         "KAYANA-ADMIN-SERVICE",
        "oldApplicationChargers": [{ "mcc": "5814", "chargePercent": 1.5  }],
        "newApplicationChargers": [{ "mcc": "5814", "chargePercent": 1.75 }]
      }
    ]
  }
}
`,
    },
  ],

  keyInsight: "Intent stays in the service. Mechanism stays in the aspect. The service decides what the log line says by setting description and propertyId on the response bean; the aspect only takes that decision and publishes it as an immutable ApplicationEvent. A dedicated listener writes the row to MySQL on a background thread. That split is why a single annotation works on wildly different methods — and why the audit log can never sit on the request path.",

  requestTrace: [
    { phase: "REQUEST",  detail: "Admin hits a POST/PUT/DELETE endpoint — controller forwards to the annotated service method." },
    { phase: "SERVICE",  detail: "The method does its real work. Before returning, it sets status, propertyId, and a human description on the ServiceResponseBean." },
    { phase: "ASPECT",   detail: "@Around continues after the method. If status==true, it reads description / propertyId off the bean and resolves the username via direct param-name match or SpEL." },
    { phase: "DISPATCH", detail: "@Async dispatchLog publishes an immutable ActivityLogEvent via ApplicationEventPublisher and returns. The aspect never touches the database itself." },
    { phase: "PERSIST",  detail: "@EventListener handle(ActivityLogEvent) runs on a background thread and saves a row to kayana_audit.kayana_activity_log_details." },
    { phase: "RESPONSE", detail: "The HTTP response has already returned. The whole audit step never appears on the caller's timeline." },
  ],

  constraintsLimitations: [
    "Self-invocation bypass: this.method() inside the same class skips the AOP proxy — annotate on the public service entry point only.",
    "Description is free text on the bean; structured before/after diffs only land for entities that populate kald_logs_current / kald_logs_new (jsonb).",
    "Username resolution falls back to plain toString() — SpEL keeps it flexible but a wrong parameter name still produces null silently.",
  ],

  conclusion: "The annotation is the entire developer surface. The aspect handles parameter resolution (plain or SpEL), response-bean reading, and the async event publish — none of which a feature developer ever sees.",
};
