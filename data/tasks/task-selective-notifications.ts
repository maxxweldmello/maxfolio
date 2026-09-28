import type { Task } from "../tasks.data";

export const taskSelectiveNotifications: Task = {
  taskId:    "task-selective-notifications",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Spring @Scheduled", "Kafka", "Spring AOP", "PostgreSQL"],
  image:     "/tasks/selective-notifications/hero.jpg",

  title: "Selective Property Notifications — Groups, Schedule, Recurring, Push / SMS / Email",

  description: "One notifications engine that targets any combination of (a) all properties, (b) a curated property group, (c) explicit property ids, (d) a mix — across push, SMS, or email. One endpoint + five orthogonal axes (target, channel, schedule, recurring, template) so ops can compose campaigns without engineering touching the codebase per send.",

  ideaPipeline: {
    steps: ["Admin POST /selective", "Resolve groups + properties", "Immediate → Kafka", "Scheduled → DB row", "Batch tick → processRecord → markRecordDone"],
    caption: "One controller, one DB write shape, flag-routed. sendToAll | propertyGroupIds[] | propertyIds[] resolve to a (propertyId, ownerUsername) union; immediate fires Kafka inline, scheduled/recurring writes a business_push_notification_list row. Batch ticks pick up due rows, re-resolve groups (so adds + removes track), check quiet hours + per-property timezone, fire Kafka, and on success advance recurring rows to next occurrence.",
  },

  problemStatement: "Operations needed one campaign tool that could 'send a push notification to every property in the LONDON group + 3 specific properties, every Monday morning at 9 in their local timezone, respecting quiet hours, with both an email and an SMS version'. Building that as a single UI form is one challenge; supporting all five orthogonal axes (recipients × channels × schedule mode × recurring frequency × timezone-awareness) on the backend without combinatorial spaghetti is another. We also needed property groups as a first-class concept — operators couldn't curate the same 18 properties by hand every time. And recurring campaigns had to advance automatically (Monday → next Monday) without operator intervention, while still allowing stopRecurringNotification to halt them on demand.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [

    // ─── 2 · One endpoint, six modes ───────────────────────────────────
    {
      path: "POST /admin/notification/send-message-to-selective-properties",
      caption: "02 · One route, six shapes — immediate all, immediate selective, scheduled, recurring, draft, and mixed groups+ids. `channel_types` is the only truly required field; the rest are validated per-mode inside the service (schedule needs future datetime, recurring needs start datetime, non-`send_to_all` needs at least one group or id).",
      language: "http",
      code: `# Immediate push + email to a curated group + two ad-hoc properties
curl -X POST https://api.kayana.io/admin/notification/send-message-to-selective-properties \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: ops@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "send_to_all": false,
    "property_group_ids": ["GRP_london"],
    "property_ids": ["PROP-2201", "PROP-2214"],
    "channel_types": ["PUSH", "EMAIL"],
    "push":  { "title": "Menu update, {{propertyName}}", "shortText": "New winter dishes live", "longText": "See the app for details.", "hasActionButton": true,  "actionButtonLabel": "Open", "actionButtonUrl": "kayana://menus" },
    "email": { "subject": "Winter menu — {{propertyName}}", "content": "Hi {{ownerName}}, ...", "attachmentUrl": null },
    "is_scheduled": false,
    "is_recurring": false,
    "is_draft": false,
    "respect_quiet_hours": true,
    "send_in_recipient_timezone": false,
    "is_transactional": false
  }'

# → 200 ServiceResponseBean
{ "status": true, "message": "Notification sent successfully",
  "description": "PUSH+EMAIL to 21 properties (LONDON group + 2 direct)" }

# Recurring weekly SMS in each property's local timezone
curl -X POST https://api.kayana.io/admin/notification/send-message-to-selective-properties \\
  -H "Authorization: Bearer <admin_jwt>" -H "username: ops@kayana.io" \\
  --json '{
    "send_to_all": true,
    "channel_types": ["SMS"],
    "sms": { "message": "Reminder: submit weekly numbers by 5pm", "link": "https://portal.kayana.io/weekly" },
    "is_recurring": true, "recurring_frequency": "WEEKLY",
    "recurring_start_datetime": "01-12-2025 09:00:00",
    "respect_quiet_hours": true, "send_in_recipient_timezone": true
  }'

# → 200  { "status": true, "message": "Recurring notification campaign created successfully" }

# Draft — persist, no send, no schedule (author revisits via /update-draft)
curl -X POST https://api.kayana.io/admin/notification/send-message-to-selective-properties \\
  -H "Authorization: Bearer <admin_jwt>" -H "username: ops@kayana.io" \\
  --json '{ "is_draft": true, "channel_types": ["PUSH"], "push": { "title":"WIP", "shortText":"" } }'

# → 200  { "status": true, "message": "Notification saved as draft" }`,
    },

    // ─── 3 · Service dispatch (part 1 · validate + resolve owners) ─────
    {
      path: "com.kayana.service.impl.KayanaAdminNotificationService#sendMessageToSelectiveProperties  (validate + owner resolution)",
      caption: "03 · Method is @LogActivity-annotated, so the aspect (task-audit) writes SEND_NOTIFICATION_CAMPAIGN off the response. Body per-mode-guards, mints one NOTIF_ id, then converges on one owner list. `send_to_all` → active owners across every ACTIVE property. Otherwise groups + ids are unioned + deduped and a bulk owner query joins in one round-trip.",
      language: "java",
      code: `@Override
@LogActivity(status = ActivityLogStatusEnum.SEND_NOTIFICATION_CAMPAIGN, username = "username")
public ServiceResponseBean sendMessageToSelectiveProperties(
        MessageRequestBean req, String username, ServiceResponseBean srb) {

    // Mode guards — schedule/recurring need a future datetime; draft short-circuits below.
    if (req.isScheduled() &&
        KayanaDateTimeUtils.validateFutureScheduleDatetime(req.getScheduleDatetime()) == null) {
        srb.setMessage("The scheduled date and time must be a valid date in the future."); return srb;
    }
    if (req.isRecurring() &&
        KayanaDateTimeUtils.validateFutureScheduleDatetime(req.getRecurringStartDatetime()) == null) {
        srb.setMessage("The recurring start date and time must be a valid date in the future."); return srb;
    }

    String notificationId = "NOTIF_".concat(KayanaCommonUtils.INSTANCE.uniqueIdentifier());

    // Draft — persist and stop
    if (req.isDraft()) {
        pushListRepo.save(KayanaBusinessPushNotificationList.builder()
            .kbpnlNotificationId(notificationId).kbpnlIsActive(true).kbpnlIsDraft(true)
            .kbpnlPropertyId(req.getPropertyIds()).kbpnlPropertyGroupId(req.getPropertyGroupIds())
            .kbpnlChannelType(req.getChannelTypes())
            .kbpnlPushContent(req.getPush()).kbpnlSmsContent(req.getSms()).kbpnlEmailContent(req.getEmail())
            .kbpnlIsRecurring(req.isRecurring()).kbpnlRecurringFrequency(req.getRecurringFrequency())
            .kbpnlRespectQuietHours(req.isRespectQuietHours())
            .kbpnlSendInRecipientTimezone(req.isSendInRecipientTimezone())
            .kbpnlIsTransactional(req.isTransactional())
            .kbpnlCreatedBy(applicationName).kbpnlCreatedDate(Calendar.getInstance())
            .build());
        srb.setStatus(true); srb.setMessage("Notification saved as draft");
        return srb;
    }

    // Owner resolution — same shape for immediate + scheduled + recurring
    List<String> propertyIds = null;
    List<Object[]> propertyOwners;

    if (Boolean.TRUE.equals(req.getSendToAll())) {
        propertyOwners = propertyRepo.findPropertyIdAndOwnerUsernames(
                GeneralStatusEnum.ACTIVE.getValue(),
                KayanaUserRoleNameEnum.OWNER.getValue(),
                GeneralStatusEnum.ACTIVE.getValue());
        if (propertyOwners.isEmpty()) { srb.setMessage("No users found"); return srb; }
    } else {
        boolean hasGroups = !CollectionUtils.isEmpty(req.getPropertyGroupIds());
        boolean hasProps  = !CollectionUtils.isEmpty(req.getPropertyIds());
        if (!hasGroups && !hasProps) {
            srb.setMessage("Either property_group_ids or property_ids must be provided"); return srb;
        }
        propertyIds = new ArrayList<>();
        if (hasGroups) {
            for (String groupId : req.getPropertyGroupIds()) {
                groupRepo.findByKbpgGroupId(groupId)
                        .filter(g -> !CollectionUtils.isEmpty(g.getKbpgPropertyIds()))
                        .ifPresent(g -> propertyIds.addAll(g.getKbpgPropertyIds()));
            }
        }
        if (hasProps) propertyIds.addAll(req.getPropertyIds());
        propertyIds = propertyIds.stream().distinct().collect(Collectors.toList());
        if (propertyIds.isEmpty()) { srb.setMessage("No valid selected properties found"); return srb; }

        propertyOwners = propertyRepo.findPropertyIdAndOwnerUsernamesByPropertyIds(
                GeneralStatusEnum.ACTIVE.getValue(),
                KayanaUserRoleNameEnum.OWNER.getValue(),
                GeneralStatusEnum.ACTIVE.getValue(),
                propertyIds);
        if (propertyOwners.isEmpty()) { srb.setMessage("No users found for the given properties"); return srb; }
    }
    // ... continues in stage 04 — immediate fan-out OR scheduled row insert
`,
    },

    // ─── 4 · Service dispatch (part 2 · immediate fan-out + row) ───────
    {
      path: "com.kayana.service.impl.KayanaAdminNotificationService#sendMessageToSelectiveProperties  (immediate fan-out + row insert)",
      caption: "04 · Immediate mode iterates the owner list, resolves phone (dialCode+number) and email per owner, fires PUSH/SMS/EMAIL via Kafka producers, and inserts one campaign-recipient row per (notificationId, propertyId, username). Regardless of mode, the final step writes exactly one kayana_business_push_notification_list row that the batch scheduler later ticks against.",
      language: "java",
      code: `    // Immediate — fan out to Kafka + record every recipient
    if (!req.isScheduled() && !req.isRecurring()) {
        for (Object[] row : propertyOwners) {
            String propertyId    = (String) row[0];
            String ownerUsername = (String) row[1];
            if (propertyId == null || ownerUsername == null || ownerUsername.isBlank()) continue;

            var property = propertyRepo.findByKbpdPropertyId(propertyId);
            var user     = userMasterRepo.findByKbumUsername(ownerUsername);
            if (property == null || user == null) continue;

            boolean needsSms   = req.getChannelTypes().contains(AsyncNotificationTypeEnum.SMS.getValue());
            boolean needsEmail = req.getChannelTypes().contains(AsyncNotificationTypeEnum.EMAIL.getValue());
            String phone = null, email = null;
            if (needsSms) {
                phone = KayanaPhoneNumberUtils.resolveSmsRecipientPhone(property, user);
                if (StringUtils.isBlank(phone)) {
                    srb.setMessage("Phone number missing for " + user.getKbumName() + " , skipping this.");
                    return srb;
                }
            }
            if (needsEmail) {
                email = user.getKbumEmail();
                if (email == null || email.isBlank()) {
                    srb.setMessage("Email missing for " + user.getKbumName() + " , skipping this.");
                    return srb;
                }
            }

            // Per-channel Kafka producers (async-notification-service consumes on the other end)
            for (String channel : req.getChannelTypes()) {
                switch (channel.toUpperCase()) {
                    case "PUSH"  -> kafkaProducer.triggerPushNotification(notificationId, req, propertyId, ownerUsername, user, property);
                    case "SMS"   -> kafkaProducer.triggerSmsNotification(req, phone, ownerUsername, user, property);
                    case "EMAIL" -> kafkaProducer.triggerEmailNotification(req, email, ownerUsername, property, user);
                }
            }

            // One row per recipient — powers "read" / "clicked" analytics later
            recipientRepo.save(KayanaBusinessPushNotificationCampaignRecipient.builder()
                    .kbpncrNotificationId(notificationId)
                    .kbpncrPropertyId(propertyId)
                    .kbpncrUsername(ownerUsername)
                    .kbpncrIsRead(false).kbpncrIsBtnClicked(false)
                    .kbpncrSentAt(Calendar.getInstance())
                    .kbpncrDeliveryStatus("SUBMITTED")
                    .kbpncrIsActive(true)
                    .kbpncrCreatedDate(Calendar.getInstance()).build());
        }
    }

    // One list row — the batch scheduler (stage 05) tick reads from here
    Calendar sentAt = (!req.isScheduled() && !req.isRecurring()) ? Calendar.getInstance() : null;
    pushListRepo.save(KayanaBusinessPushNotificationList.builder()
            .kbpnlNotificationId(notificationId).kbpnlIsActive(true).kbpnlIsDraft(false)
            .kbpnlPropertyId(propertyIds)                             // null → sendToAll marker
            .kbpnlPropertyGroupId(req.getPropertyGroupIds())
            .kbpnlChannelType(req.getChannelTypes())
            .kbpnlPushContent(req.getPush()).kbpnlSmsContent(req.getSms()).kbpnlEmailContent(req.getEmail())
            .kbpnlScheduleDatetime(
                    req.isRecurring() ? KayanaDateTimeUtils.parseStringToDate(req.getRecurringStartDatetime()) :
                    req.isScheduled() ? KayanaDateTimeUtils.parseStringToDate(req.getScheduleDatetime())      :
                    Calendar.getInstance())
            .kbpnlSentDatetime(sentAt)                                // stamped only for immediate sends
            .kbpnlIsScheduled(req.isScheduled() || req.isRecurring())
            .kbpnlIsRecurring(req.isRecurring())
            .kbpnlRecurringFrequency(req.getRecurringFrequency())
            .kbpnlRespectQuietHours(req.isRespectQuietHours())
            .kbpnlSendInRecipientTimezone(req.isSendInRecipientTimezone())
            .kbpnlIsTransactional(req.isTransactional())
            .kbpnlCreatedBy(applicationName)
            .kbpnlCreatedDate(Calendar.getInstance()).build());

    srb.setStatus(true);
    srb.setMessage(req.isRecurring() ? "Recurring notification campaign created successfully" :
                    req.isScheduled() ? "Notification scheduled successfully" :
                                        "Notification sent successfully");
    srb.setDescription(Boolean.TRUE.equals(req.getSendToAll())
            ? buildSendToAllDescription(req, propertyOwners.size())
            : buildNotificationDescription(req, propertyIds));
    return srb;
}`,
    },

    // ─── 5 · Batch scheduler — two cron paths ──────────────────────────
    {
      path: "com.kayana.scheduler.KayanaSelectivePropertiesNotificationScheduler   (kayana-batch-processor)",
      caption: "05 · Two @Scheduled crons, one class. Standard path drains rows whose UTC schedule time has passed. Timezone-aware path drains rows whose *date* has arrived but leaves per-property firing to the local-clock check inside processRecord. Both share the same guard: 21:00–08:00 UTC quiet-hours cutoff on the campaign, when opted in.",
      language: "java",
      code: `@Scheduled(cron = "\${scheduled.notification.scheduler.cron:0 * * * * ?}")
public void processScheduledNotifications() {
    // findPendingScheduledNotifications():
    //   SELECT * FROM kayana_business.kayana_business_push_notification_list
    //   WHERE (kbpnl_is_draft IS NULL OR kbpnl_is_draft = false)
    //     AND kbpnl_is_scheduled = true
    //     AND kbpnl_sent_datetime IS NULL
    //     AND (kbpnl_send_in_recipient_timezone IS NULL OR = false)
    //     AND (kbpnl_is_active IS NULL OR = true)
    //     AND kbpnl_schedule_datetime <= NOW()
    //   ORDER BY kbpnl_schedule_datetime ASC LIMIT 500
    var due = pushListRepo.findPendingScheduledNotifications();
    for (var record : due) {
        try {
            if (isInQuietHours(record)) continue;         // 21:00–08:00 UTC when respect_quiet_hours=true
            processRecord(record, null);                  // stage 06
            markRecordDone(record);                       // stage 07 (recurring bump lives here)
        } catch (Exception e) { log.error("error processing seqId={}", record.getKbpnlSeqId(), e); }
    }
}

@Scheduled(cron = "\${scheduled.timezone.notification.scheduler.cron:0 * * * * ?}")
public void processTimezoneAwareNotifications() {
    // Same predicate, but kbpnl_send_in_recipient_timezone = true and
    // "due" here means the schedule *date* has arrived — per-property firing is
    // decided inside processRecord by comparing each property's local time.
    var due = pushListRepo.findPendingTimezoneAwareNotifications();
    for (var record : due) {
        try {
            if (isInQuietHours(record)) continue;
            var scheduledDate = record.getKbpnlScheduleDatetime().toInstant().atZone(ZoneOffset.UTC).toLocalDate();
            if (scheduledDate.isAfter(LocalDate.now(ZoneOffset.UTC))) continue;

            processRecord(record, LocalTime.MIN);         // non-null → timezone-aware branch
            if (allPropertiesSent(record)) {
                markRecordDone(record);
            } else {
                // partial send — save progress on kbpnl_sent_property_ids, resume next tick
                record.setKbpnlUpdatedDate(Calendar.getInstance());
                pushListRepo.save(record);
            }
        } catch (Exception e) { log.error("error processing seqId={}", record.getKbpnlSeqId(), e); }
    }
}

// Quiet hours — one line, global 21:00–08:00 UTC when opted in
private boolean isInQuietHours(KayanaBusinessPushNotificationList r) {
    if (!Boolean.TRUE.equals(r.getKbpnlRespectQuietHours())) return false;
    int h = ZonedDateTime.now(ZoneOffset.UTC).getHour();
    return h >= 21 || h < 8;
}`,
    },

    // ─── 6 · processRecord — dedupe + timezone + fan-out ───────────────
    {
      path: "com.kayana.scheduler.KayanaSelectivePropertiesNotificationScheduler#processRecord",
      caption: "06 · Same channel switch as the admin service, but written for a batch tick: re-resolves the owner list every time (groups can gain/lose members between now and the schedule), dedupes against kbpnl_sent_property_ids (so a partial tick resumes without double-firing), and for timezone-aware records skips any property whose local clock hasn't yet reached the scheduled time.",
      language: "java",
      code: `/**
 * @param targetLocalTime null for standard sends; non-null enables the
 *                        per-property local-clock check for timezone-aware sends.
 */
private void processRecord(KayanaBusinessPushNotificationList record, LocalTime targetLocalTime) {
    List<String> channelTypes = objectMapper.convertValue(record.getKbpnlChannelType(), new TypeReference<>() {});
    if (channelTypes == null || channelTypes.isEmpty()) {
        // NPE guard — kbpnl_channel_type null would kill delivery for the whole record
        log.warn("processRecord :: channel types are null or empty, cannot deliver"); return;
    }

    // Re-resolve every tick — groups may have gained/lost members since the campaign was created
    var propertyOwners = resolvePropertyOwners(record);
    if (propertyOwners == null || propertyOwners.isEmpty()) return;

    Set<String> alreadySentPropertyIds = getSentPropertyIds(record);   // dedupe across ticks

    for (Object[] row : propertyOwners) {
        String propertyId    = (String) row[0];
        String ownerUsername = (String) row[1];
        if (propertyId == null || ownerUsername == null || ownerUsername.isBlank()) continue;

        if (alreadySentPropertyIds.contains(propertyId)) continue;      // partial-tick resume

        var property = propertyRepo.findByKbpdPropertyId(propertyId);
        if (property == null) continue;

        // Timezone-aware: only fire if the property's local clock has caught up.
        // Previously used exact minute equality → permanent miss when the tick ran
        // before the record was inserted in that same minute. isBefore() fixes that.
        if (targetLocalTime != null) {
            String tz = Optional.ofNullable(property.getKbpdPropertyTimeZone()).filter(s -> !s.isBlank()).orElse("UTC");
            var targetInPropZone = record.getKbpnlScheduleDatetime().toInstant().atZone(ZoneId.of(tz));
            if (ZonedDateTime.now(ZoneId.of(tz)).isBefore(targetInPropZone)) continue;
        }

        var user = userMasterRepo.findByKbumUsername(ownerUsername);
        if (user == null) continue;

        boolean needsContact = channelTypes.contains(AsyncNotificationTypeEnum.SMS.getValue())
                            || channelTypes.contains(AsyncNotificationTypeEnum.EMAIL.getValue());
        String phone = null, email = null;
        if (needsContact) {
            if (StringUtils.isNotBlank(user.getKbumDialCode()) && StringUtils.isNotBlank(user.getKbumPhoneNumber())) {
                phone = user.getKbumDialCode() + user.getKbumPhoneNumber();
            }
            email = user.getKbumEmail();
        }

        for (String channel : channelTypes) {
            switch (channel.toUpperCase()) {
                case "PUSH"  -> triggerPush(record, propertyId, ownerUsername, user, property);
                case "SMS"   -> { if (StringUtils.isNotBlank(phone))  triggerSms(record, phone, ownerUsername, user, property); }
                case "EMAIL" -> { if (StringUtils.isNotBlank(email))  triggerEmail(record, email, ownerUsername, property, user); }
            }
        }
        alreadySentPropertyIds.add(propertyId);
    }

    // Persist progress. For sendToAll, one sentinel; for selective, the actual set.
    List<String> targetIds = objectMapper.convertValue(record.getKbpnlPropertyId(), new TypeReference<>() {});
    record.setKbpnlSentPropertyIds(CollectionUtils.isEmpty(targetIds)
            ? Collections.singletonList("SENT_TO_ALL")
            : new ArrayList<>(alreadySentPropertyIds));
}`,
    },

    // ─── 7 · markRecordDone — recurring auto-advance ────────────────────
    {
      path: "com.kayana.scheduler.KayanaSelectivePropertiesNotificationScheduler#markRecordDone",
      caption: "07 · After a successful dispatch: stamp sent_datetime + last_sent_datetime on the row. If the campaign is recurring + still active + has a known frequency, mint a fresh occurrence row with kbpnl_schedule_datetime bumped forward until it lands strictly in the future — a schedule that was quiet for a week catches up rather than firing every missed occurrence.",
      language: "java",
      code: `private void markRecordDone(KayanaBusinessPushNotificationList record) {
    Calendar now = Calendar.getInstance();
    record.setKbpnlSentDatetime(now);
    record.setKbpnlLastSentDatetime(now);
    record.setKbpnlUpdatedBy(applicationName);
    record.setKbpnlUpdatedDate(now);
    pushListRepo.save(record);

    // Recurring? Advance to the next occurrence.
    if (!Boolean.TRUE.equals(record.getKbpnlIsRecurring())
        || !Boolean.TRUE.equals(record.getKbpnlIsActive())
        || record.getKbpnlRecurringFrequency() == null) return;

    String frequency = record.getKbpnlRecurringFrequency().toUpperCase();
    if (!frequency.equals("DAILY") && !frequency.equals("WEEKLY") && !frequency.equals("MONTHLY")) return;

    // Bump forward until strictly in the future — so a paused/quiet week catches up in one hop
    Calendar next = Calendar.getInstance();
    next.setTime(record.getKbpnlScheduleDatetime().getTime());
    Calendar nowCal = Calendar.getInstance();
    do {
        switch (frequency) {
            case "DAILY"   -> next.add(Calendar.DAY_OF_MONTH, 1);
            case "WEEKLY"  -> next.add(Calendar.WEEK_OF_YEAR, 1);
            case "MONTHLY" -> next.add(Calendar.MONTH, 1);
        }
    } while (!next.after(nowCal));

    pushListRepo.save(KayanaBusinessPushNotificationList.builder()
            .kbpnlNotificationId(record.getKbpnlNotificationId())        // same campaign id
            .kbpnlPropertyId(record.getKbpnlPropertyId())
            .kbpnlPropertyGroupId(record.getKbpnlPropertyGroupId())
            .kbpnlChannelType(record.getKbpnlChannelType())
            .kbpnlPushContent(record.getKbpnlPushContent())
            .kbpnlSmsContent(record.getKbpnlSmsContent())
            .kbpnlEmailContent(record.getKbpnlEmailContent())
            .kbpnlScheduleDatetime(next)                                  // ← next occurrence
            .kbpnlIsScheduled(true).kbpnlIsDraft(false).kbpnlIsRecurring(true)
            .kbpnlRecurringFrequency(record.getKbpnlRecurringFrequency())
            .kbpnlRespectQuietHours(record.getKbpnlRespectQuietHours())
            .kbpnlSendInRecipientTimezone(record.getKbpnlSendInRecipientTimezone())
            .kbpnlIsTransactional(record.getKbpnlIsTransactional())
            .kbpnlIsActive(true)
            .kbpnlSentDatetime(null)                                      // fresh row → not yet sent
            .kbpnlCreatedBy(applicationName)
            .kbpnlCreatedDate(Calendar.getInstance()).build());
}`,
    },

    // ─── 8 · Channel triggers → Kafka ───────────────────────────────────
    {
      path: "com.kayana.scheduler.KayanaSelectivePropertiesNotificationScheduler#triggerPush / triggerSms / triggerEmail",
      caption: "08 · Every channel resolves template variables ({{propertyName}}, {{ownerName}} etc.) against the concrete user + property, wraps the result in an AsyncNotificationMessageDetailBean, and hands it to KayanaNotificationUtils.publish — which enqueues onto Kafka for kayana-async-notification-service to fan out to FCM (push), the SMS gateway, and the email templater.",
      language: "java",
      code: `// PUSH — Firebase topic per owner, title+message resolved from template
private void triggerPush(KayanaBusinessPushNotificationList record, String propertyId, String username,
                         KayanaBusinessUserMaster user, KayanaBusinessPropertyDetail property) {
    var push = objectMapper.convertValue(record.getKbpnlPushContent(), PushNotificationContentBean.class);
    if (push == null) return;

    String title     = templateResolver.resolve(push.getTitle(),     user, property);
    String shortText = templateResolver.resolve(push.getShortText(), user, property);
    String longText  = templateResolver.resolve(push.getLongText(),  user, property);

    Map<String, Object> dataMap = new HashMap<>();
    dataMap.put("hasActionButton", push.isHasActionButton());
    dataMap.put("actionButtonLabel", push.getActionButtonLabel());
    dataMap.put("actionButtonUrl",  push.getActionButtonUrl());

    String message = SHORT_MESSAGE_START + shortText + SHORT_MESSAGE_END
                   + LONG_MESSAGE_START  + longText  + LONG_MESSAGE_END;

    notificationUtils.publish(AsyncNotificationMessageDetailBean.builder()
        .type(NotificationTypeEnum.SEND_MESSAGE_TO_SELECTIVE_PROPERTIES.getValue())
        .id(OrderSourceEnum.BUSINESS_APP.getValue())
        .dataMap(dataMap)
        .business(AsycnNotificationUserBean.builder()
            .username(username).propertyId(propertyId)
            .topic(FireBaseNotificationTopicsEnum.SEND_MESSAGE_TO_SELECTIVE_PROPERTIES.getValue() + username)
            .types(List.of(AsyncNotificationTypeBean.builder()
                    .type(AsyncNotificationTypeEnum.PUSH.getValue())
                    .title(message).message(title).build()))
            .build())
        .build());
}

// SMS — appends the link when present; templates the body
private void triggerSms(KayanaBusinessPushNotificationList record, String phone, String username,
                        KayanaBusinessUserMaster user, KayanaBusinessPropertyDetail property) {
    var sms = objectMapper.convertValue(record.getKbpnlSmsContent(), SmsNotificationContentBean.class);
    if (sms == null || StringUtils.isBlank(sms.getMessage())) return;

    String body = templateResolver.resolve(sms.getMessage(), user, property);
    if (StringUtils.isNotBlank(sms.getLink())) body = body + " " + sms.getLink();

    notificationUtils.publish(AsyncNotificationMessageDetailBean.builder()
        .type(NotificationTypeEnum.SEND_MESSAGE_TO_SELECTIVE_PROPERTIES.getValue())
        .dataMap(Map.of("message", body))
        .business(AsycnNotificationUserBean.builder()
            .username(username)
            .types(List.of(AsyncNotificationTypeBean.builder()
                    .type(AsyncNotificationTypeEnum.SMS.getValue())
                    .message(body).recepients(List.of(phone)).build()))
            .build())
        .build());
}

// EMAIL — country-scoped template + resolved subject + attachment toggle
private void triggerEmail(KayanaBusinessPushNotificationList record, String email, String username,
                          KayanaBusinessPropertyDetail property, KayanaBusinessUserMaster user) {
    var mail = objectMapper.convertValue(record.getKbpnlEmailContent(), EmailNotificationContentBean.class);
    if (mail == null) return;

    String subject = templateResolver.resolve(mail.getSubject(), user, property);
    String content = templateResolver.resolve(mail.getContent(), user, property);

    KayanaEmailTemplateMaster template = emailTemplateRepo.findByKetmEventKeyAndKetmCountryCode(
            EventKeyEnum.SEND_NOTIFICATION_EMAIL_TO_PROPERTIES.getValue(),
            property.getKbpdPropertyCountryCode());
    if (template == null) return;

    Map<String, Object> dataMap = new HashMap<>();
    dataMap.put("content", content);
    dataMap.put("attachmentUrl", mail.getAttachmentUrl());
    dataMap.put("attachmentButtonDisplay",
            StringUtils.isNotBlank(mail.getAttachmentUrl()) ? "inline-block" : "none");

    notificationUtils.publish(AsyncNotificationMessageDetailBean.builder()
        .type(NotificationTypeEnum.SEND_MESSAGE_TO_SELECTIVE_PROPERTIES.getValue())
        .dataMap(dataMap)
        .business(AsycnNotificationUserBean.builder()
            .types(List.of(AsyncNotificationTypeBean.builder()
                    .type(AsyncNotificationTypeEnum.EMAIL.getValue())
                    .templateId(template.getKetmTemplateId())
                    .recepients(List.of(email))
                    .subject(subject).build()))
            .build())
        .build());
}`,
    },

    // ─── 9 · Stop / cancel / update-draft ──────────────────────────────
    {
      path: "PUT /admin/notification/stop-recurring/{notificationId}   +   /cancel-scheduled/{notificationId}   +   /update-draft/{notificationId}",
      caption: "09 · Lifecycle over the same NOTIF_ id. `stop-recurring` flips is_active=false via one JPQL UPDATE — the next batch tick skips it because the predicate requires is_active. `cancel-scheduled` looks the row up first (still-scheduled + not yet sent). `update-draft` merges new content into the existing draft row without turning it into a live campaign.",
      language: "http",
      code: `# Stop a recurring campaign — one JPQL UPDATE, no soft delete needed
curl -X PUT https://api.kayana.io/admin/notification/stop-recurring/NOTIF_9f3a... \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200 ServiceResponseBean
{ "status": true, "message": "Recurring notification campaign stopped successfully" }

# Under the hood (repo)
#   @Modifying @Transactional
#   @Query("UPDATE KayanaBusinessPushNotificationList k
#             SET k.kbpnlIsActive = false, k.kbpnlUpdatedDate = :now
#             WHERE k.kbpnlNotificationId = :notificationId")
#   void deactivateByNotificationId(String notificationId, Calendar now);

# Cancel a one-shot scheduled notification (finds first row for the id, marks it done/inactive)
curl -X PUT https://api.kayana.io/admin/notification/cancel-scheduled/NOTIF_9f3a... \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200
{ "status": true, "message": "Scheduled notification cancelled" }

# Edit a draft in place (author revisits, keeps NOTIF_ id, doesn't yet fire or schedule)
curl -X PUT https://api.kayana.io/admin/notification/update-draft/NOTIF_9f3a... \\
  -H "Authorization: Bearer <admin_jwt>" -H "username: ops@kayana.io" \\
  --json '{
    "channel_types": ["PUSH", "EMAIL"],
    "push":  { "title": "Updated headline", "shortText": "Updated body" },
    "email": { "subject": "Updated subject", "content": "Updated content" },
    "is_draft": true
  }'

# → 200
{ "status": true, "message": "Draft updated" }`,
    },

    // ─── 10 · DDL — list row + recipient row ────────────────────────────
    {
      path: "PostgreSQL — kayana_business.kayana_business_push_notification_list  +  ...campaign_recipient",
      caption: "10 · Two tables. `kayana_business_push_notification_list` is the campaign row the batch scheduler ticks against — one per send (immediate, scheduled, draft, plus one fresh row per recurring occurrence). `kayana_business_push_notification_campaign_recipient` is the per-recipient audit trail — read receipts + button-clicks land here.",
      language: "sql",
      code: `-- Campaign row — the shape the batch scheduler joins against
CREATE TABLE kayana_business.kayana_business_push_notification_list (
    kbpnl_seq_id                     BIGSERIAL PRIMARY KEY,
    kbpnl_notification_id            VARCHAR(64) NOT NULL,        -- NOTIF_... (shared across recurring occurrences)
    kbpnl_property_id                JSONB,                        -- List<String> ids  |  null → send_to_all
    kbpnl_property_group_id          JSONB,                        -- List<String> group ids used to compose the send
    kbpnl_channel_type               JSONB,                        -- ["PUSH","SMS","EMAIL"]
    kbpnl_push_content               JSONB,                        -- PushNotificationContentBean
    kbpnl_sms_content                JSONB,                        -- SmsNotificationContentBean
    kbpnl_email_content              JSONB,                        -- EmailNotificationContentBean
    kbpnl_schedule_datetime          TIMESTAMPTZ,                  -- when this occurrence should fire
    kbpnl_sent_datetime              TIMESTAMPTZ,                  -- stamped on successful dispatch (null = pending)
    kbpnl_last_sent_datetime         TIMESTAMPTZ,
    kbpnl_sent_property_ids          JSONB,                        -- dedupe set OR ["SENT_TO_ALL"] marker
    kbpnl_is_scheduled               BOOLEAN,
    kbpnl_is_draft                   BOOLEAN,
    kbpnl_is_recurring               BOOLEAN,
    kbpnl_recurring_frequency        VARCHAR(16),                  -- DAILY | WEEKLY | MONTHLY
    kbpnl_respect_quiet_hours        BOOLEAN,                      -- global 21:00–08:00 UTC cutoff when true
    kbpnl_send_in_recipient_timezone BOOLEAN,                      -- routes rows to the timezone-aware cron
    kbpnl_is_transactional           BOOLEAN,
    kbpnl_is_active                  BOOLEAN,                      -- stop-recurring flips this to false
    kbpnl_created_by                 VARCHAR(64), kbpnl_created_date TIMESTAMPTZ,
    kbpnl_updated_by                 VARCHAR(64), kbpnl_updated_date TIMESTAMPTZ
);
-- The batch predicate (both crons)
--   is_draft = false AND is_scheduled = true AND sent_datetime IS NULL
--   AND is_active = true AND schedule_datetime <= NOW()
CREATE INDEX ix_kbpnl_pending
    ON kayana_business.kayana_business_push_notification_list (kbpnl_schedule_datetime)
    WHERE kbpnl_is_scheduled = true
      AND kbpnl_sent_datetime IS NULL
      AND (kbpnl_is_active IS NULL OR kbpnl_is_active = true);

-- One recipient row per (notificationId, propertyId, username) — powers read + click analytics
CREATE TABLE kayana_business.kayana_business_push_notification_campaign_recipient (
    kbpncr_seq_id         BIGSERIAL PRIMARY KEY,
    kbpncr_notification_id VARCHAR(64) NOT NULL,               -- FK to kbpnl_notification_id
    kbpncr_property_id     VARCHAR(64) NOT NULL,
    kbpncr_username        VARCHAR(128) NOT NULL,
    kbpncr_is_read         BOOLEAN DEFAULT FALSE,
    kbpncr_read_at         TIMESTAMPTZ,
    kbpncr_is_btn_clicked  BOOLEAN DEFAULT FALSE,
    kbpncr_btn_clicked_at  TIMESTAMPTZ,
    kbpncr_sent_at         TIMESTAMPTZ,
    kbpncr_delivery_status VARCHAR(32),                          -- "SUBMITTED" on insert, gateway may flip later
    kbpncr_is_active       BOOLEAN,
    kbpncr_created_date    TIMESTAMPTZ
);
CREATE INDEX ix_kbpncr_notification ON kayana_business.kayana_business_push_notification_campaign_recipient (kbpncr_notification_id);

-- End-to-end recap  ─────────────────────────────────────────────────
--   Composer                      → stage 01
--   POST /send-message-to-selective-properties → stages 02–04
--   Immediate: Kafka + recipient rows → stage 04
--   Scheduled / recurring: one list row → stage 04
--   Batch cron (two paths)        → stage 05
--     processRecord                → stage 06 (dedupe + timezone check + channel switch)
--     markRecordDone               → stage 07 (recurring bumps to next occurrence)
--   Channel Kafka publish          → stage 08
--   Stop / cancel / edit-draft     → stage 09
--   Storage shape + batch predicate→ stage 10`,
    },
  ],

  keyInsight: "Recipient axes (sendToAll | propertyGroupIds[] | propertyIds[]) and schedule axes (immediate / scheduled / recurring) and timezone axis (UTC-aware vs per-property local) all collapse onto the same business_push_notification_list row shape. The batch doesn't care which path created the row — it picks up due rows, re-resolves whatever recipient axis was stored (groups are re-expanded on every tick so adds + removes track), runs the same processRecord, and only treats recurring rows specially in markRecordDone where it mints the next occurrence with the SAME notificationId. stopRecurringNotification flips isActive on every row sharing that id, so the operator can halt a 12-week campaign with one click without having to time it against the next tick.",

  requestTrace: [
    { phase: "GROUP-CRUD",      detail: "Admin POST /admin/property-groups → BusinessPropertyGroupService.create/update/delete. Uniqueness on name; resolveInvalidPropertyIds runs findExistingPropertyIds against ACTIVE properties. Soft delete via status=DELETED. All under @LogActivity (see [[task-audit]])." },
    { phase: "CAMPAIGN-POST",   detail: "Admin POST /admin/notification/selective → sendMessageToSelectiveProperties. Validates schedule/recurring datetimes; isDraft → persist + return; otherwise compute propertyOwners." },
    { phase: "RECIPIENT-FANOUT", detail: "sendToAll=true → findPropertyIdAndOwnerUsernames returns every (propertyId, ownerUsername) for ACTIVE+OWNER. Otherwise: walk propertyGroupIds → expand current property lists → append explicit propertyIds → de-dup → findPropertyIdAndOwnerUsernamesByPropertyIds for owner resolution." },
    { phase: "IMMEDIATE-SEND",  detail: "!isScheduled && !isRecurring → for each (propertyId, ownerUsername): load BusinessUserMaster; if SMS/EMAIL in channelTypes, fail-fast if dialCode/phone/email missing (typed error per missing field). Per channel route via KafkaProducerSender.triggerPush/Sms/EmailNotification. Save a BusinessPushNotificationCampaignRecipient row per recipient." },
    { phase: "ROW-PERSIST",     detail: "Every path saves a BusinessPushNotificationList row: notificationId (NOTIF_…), propertyIds (null for sendToAll), propertyGroupIds (null if none), channelTypes[], content blocks, scheduleDatetime (recurring uses recurringStartDatetime; scheduled uses scheduleDatetime; immediate uses now()), isScheduled (true for both), isRecurring, recurringFrequency, respectQuietHours, sendInRecipientTimezone, isTransactional, isActive=true, sentDatetime (now for immediate, null otherwise)." },
    { phase: "STOP",            detail: "POST /admin/notification/stop/{notificationId} → deactivateByNotificationId flips isActive=false in one UPDATE. The next batch tick excludes the campaign from findPendingScheduledNotifications, so markRecordDone never mints a new occurrence." },
    { phase: "BATCH-STD",       detail: "processScheduledNotifications cron: findPendingScheduledNotifications (active + due + not timezone-aware) → per row → isInQuietHours skip → processRecord(null) → markRecordDone." },
    { phase: "BATCH-TZ",        detail: "processTimezoneAwareNotifications cron: findPendingTimezoneAwareNotifications (active + due + timezone-aware) → skip if scheduledDate > today (UTC) → processRecord(LocalTime.MIN). allPropertiesSent==true → markRecordDone; else save progress for the next tick." },
    { phase: "PROCESS-RECORD",  detail: "Defensive null check on channelTypes. Re-resolve owners (groups stay live across recurring ticks). Skip alreadySentPropertyIds. Timezone-aware: per-property local-clock check via isBefore (not exact-minute equality — that caused permanent misses). Per-channel Kafka publish via KayanaNotificationUtils.publish. Update sentPropertyIds on the row." },
    { phase: "MARK-DONE",       detail: "Set sentDatetime + lastSentDatetime. Recurring row + isActive=true + valid frequency → bump scheduleDatetime in a loop until it's in the future, mint a fresh row with the same notificationId + same content + isActive=true. stopRecurringNotification's flip prevents new occurrences but doesn't unsend already-sent ones." },
  ],

  constraintsLimitations: [
    "Quiet hours is platform-wide UTC 21:00–08:00; per-recipient quiet hours would need a column on the property row plus a per-row check inside processRecord (intentionally deferred — current cut is reversible and matches the operator UI today).",
    "markRecordDone only handles DAILY / WEEKLY / MONTHLY — FORTNIGHTLY appears in the docs but isn't in the switch; YEARLY would need a Calendar.YEAR arm.",
    "Recurring advance creates a new row per occurrence rather than reusing the same row with a bumped date — bloats the table over months/years but makes audit trails trivial (one row per occurrence = one record of what was sent when).",
    "The contact-data fail-fast in immediate-send returns on the first missing dialCode / phone / email, leaving partially-sent campaigns. A 'collect missing and report' shape would be friendlier but the operator UI doesn't surface it today.",
    "Timezone-aware completion uses sentPropertyIds vs propertyIds set-containment — if a property is removed from the group between ticks, the campaign can never reach allPropertiesSent until manually cleared.",
    "Email template missing for a country silently skips the recipient (warn log). Operators need to monitor logs to catch missing templates.",
  ],

  conclusion: "Two services, two batch methods, one campaign row shape, one notificationId. The trick is the row stores recipient axes + schedule axes + content as data — not as separate endpoints — so the batch's processRecord doesn't care whether a row came from sendToAll, a curated group, or an explicit id list. groupId-at-fire-time means group adds + removes track automatically; markRecordDone-mints-next-occurrence + stopRecurringNotification-flips-isActive gives operators clean control over recurring campaigns without ever having to time it against the cron.",
};
