import type { Task } from "../tasks.data";

export const taskKnowledgeBase: Task = {
  taskId:    "task-knowledge-base",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "Spring WebFlux", "AWS S3 (versioned)", "Project Reactor", "PostgreSQL (jsonb)"],
  image:     "/tasks/knowledge-base/hero.jpg",

  title: "Knowledge Base Document Management Module posting in AWS S3",

  description: "Platform's product-documentation source of truth — Folder → File → Page hierarchy with JSONB page content. Published versions are uploaded to a versioned AWS S3 bucket (S3-side versioning enabled) with per-page history, so a rollback is a single GET against an older version id without touching the live DB row.",

  ideaPipeline: {
    steps: ["Upsert folder + file", "Upsert pages (jsonb)", "FilePart → temp file (boundedElastic)", "PutObject + versionId capture", "knowledge_base_documents row"],
    caption: "Authors edit Folder → File → Page in the admin UI. Each save upserts pages and writes a history row for every changed page. Publishing streams the FilePart off the WebFlux event loop into a temp file via Reactor's boundedElastic scheduler, then S3.putObject runs synchronously inside the reactor chain; the returned versionId is stamped onto a knowledge_base_documents row so the Adeyt training pipeline can ingest a deterministic snapshot.",
  },

  problemStatement: "Customers ask the in-product chatbot (Adeyt) questions like 'how do I refund a card-machine transaction' or 'how does a payout schedule work' — and generic LLM answers were wrong, stale, or contradicted what the platform actually did. We needed a single source of truth for product documentation that (a) lived inside the platform so internal authors could keep it current, (b) supported a Folder → File → Page hierarchy with rich (jsonb) page content so the authoring UX matched a real CMS, (c) gave operators a draft / publish workflow so half-finished pages never leaked to the AI training set, (d) persisted every published file to a versioned S3 bucket with the S3 versionId stamped on the row so the training pipeline could ingest a deterministic snapshot, and (e) journaled every page-level change (old content + new content + old status + new status + file_version) so authors could see when content drifted and the AI team could replay any past version.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [

    // ─── 2 · Folder upsert ──────────────────────────────────────────────
    {
      path: "POST /admin/knowledge-base/upsert-knowledge-base-folder",
      caption: "02 · Folder create-or-update — one endpoint, folder_id decides which path runs. Locked folders block delete downstream; DELETED status flips the row instead of removing it.",
      language: "http",
      code: `curl -X POST https://api.kayana.io/admin/knowledge-base/upsert-knowledge-base-folder \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: docs@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "folder_name": "Payments",
    "parent_folder_id": null,
    "is_locked_folder": false
  }'

# → 200 ServiceResponseBean (create)
{
  "status": true,
  "message": "Folder created successfully",
  "description": "Knowledge Base Folder 'Payments' has been created",
  "activityLogStatusEnum": "KNOWLEDGE_BASE_FOLDER_CREATED",
  "data": {
    "folderId": "KKBF_9f3a...",
    "parentFolderId": null,
    "name": "Payments",
    "status": "CREATED",
    "isLockedFolder": false,
    "createdBy": "KAYANA-ADMIN-SERVICE"
  }
}

# Rename hits the same endpoint with folder_id set — the response's
# 'description' becomes "Knowledge Base Folder renamed from 'X' to 'Y'".`,
    },

    // ─── 3 · Folder service body ────────────────────────────────────────
    {
      path: "com.kayana.service.impl.KayanaAdminKnowledgeBaseService#upsertKnowledgeBaseFolder",
      caption: "03 · Guards → parent lookup → update vs. insert. The @LogActivity annotation on the method is the only audit wiring — the aspect (see task-audit) reads status/description off the response bean when the method returns.",
      language: "java",
      code: `@Override
@LogActivity(username = "username")
public ServiceResponseBean upsertKnowledgeBaseFolder(
        KnowledgeBaseRequestBean req, String username, ServiceResponseBean srb) {

    if (req == null || req.getFolderName() == null || req.getFolderName().isBlank()) {
        srb.setMessage("Folder name cannot be empty"); return srb;
    }
    Calendar now = Calendar.getInstance();
    String folderName    = req.getFolderName().trim();
    String parentFolderId = req.getParentFolderId();

    // 1) validate parent (if any) — must exist and not be DELETED
    if (parentFolderId != null && !parentFolderId.isBlank()) {
        var parent = folderRepo.findByKkbdfFolderId(parentFolderId);
        if (parent.isEmpty()) { srb.setMessage("Parent folder not found"); return srb; }
        if (GeneralStatusEnum.DELETED.getValue().equalsIgnoreCase(parent.get().getKkbdfStatus())) {
            srb.setMessage("Parent folder is deleted"); return srb;
        }
    }

    // 2) update path
    if (req.getFolderId() != null && !req.getFolderId().isBlank()) {
        var existing = folderRepo.findByKkbdfFolderId(req.getFolderId())
                .orElseThrow(() -> new IllegalStateException("Folder not found"));

        if (parentFolderId != null && parentFolderId.equalsIgnoreCase(req.getFolderId())) {
            srb.setMessage("Folder cannot be its own parent"); return srb;
        }
        String oldFolderName = existing.getKkbdfFolderName();
        existing.setKkbdfFolderName(folderName);
        existing.setKkbdfParentFolderId(parentFolderId);
        existing.setKkbdfIsLockedFolder(req.getIsLockedFolder());
        if (req.getFolderStatus() != null) existing.setKkbdfStatus(req.getFolderStatus().trim());
        existing.setKkbdfUpdatedDate(now);
        existing.setKkbdfUpdatedBy(applicationName);
        folderRepo.save(existing);

        srb.setStatus(true);
        srb.setData(mapFolderEntityToResponse(existing));
        if (GeneralStatusEnum.DELETED.getValue().equalsIgnoreCase(existing.getKkbdfStatus())) {
            srb.setActivityLogStatusEnum(ActivityLogStatusEnum.KNOWLEDGE_BASE_FOLDER_DELETED);
            srb.setDescription("Knowledge Base Folder '" + folderName + "' has been deleted");
        } else {
            srb.setActivityLogStatusEnum(ActivityLogStatusEnum.KNOWLEDGE_BASE_FOLDER_UPDATED);
            srb.setDescription(oldFolderName.equals(folderName)
                ? "Knowledge Base Folder '" + folderName + "' updated"
                : "Knowledge Base Folder renamed from '" + oldFolderName + "' to '" + folderName + "'");
        }
        return srb;
    }

    // 3) insert path
    String newFolderId = KayanaCommonConstants.INSTANCE.KNOWLEDGE_BASE_FOLDER_ID_PREFIX
            .concat(KayanaCommonUtils.INSTANCE.uniqueIdentifier());
    var row = KayanaKnowledgeBaseDocumentFolder.builder()
            .kkbdfFolderId(newFolderId).kkbdfFolderName(folderName)
            .kkbdfParentFolderId(parentFolderId).kkbdfIsLockedFolder(req.getIsLockedFolder())
            .kkbdfStatus(GeneralStatusEnum.CREATED.getValue())
            .kkbdfCreatedDate(now).kkbdfCreatedBy(applicationName).build();
    folderRepo.save(row);

    srb.setStatus(true);
    srb.setActivityLogStatusEnum(ActivityLogStatusEnum.KNOWLEDGE_BASE_FOLDER_CREATED);
    srb.setDescription("Knowledge Base Folder '" + folderName + "' has been created");
    srb.setData(mapFolderEntityToResponse(row));
    return srb;
}`,
    },

    // ─── 4 · File upsert ────────────────────────────────────────────────
    {
      path: "POST /admin/knowledge-base/upsert-knowledge-base-file",
      caption: "04 · File create-or-move-or-rename — one endpoint, four side effects. The activity-log description is composed from what actually changed (rename / move / rename+move / delete / plain update), so downstream audit rows read like sentences.",
      language: "http",
      code: `curl -X POST https://api.kayana.io/admin/knowledge-base/upsert-knowledge-base-file \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: docs@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "folder_id":     "KKBF_9f3a...",
    "file_id":       null,
    "file_name":     "How Payouts Work",
    "file_version":  null,
    "file_metadata": { "author": "docs@kayana.io", "audience": "merchants" },
    "file_status":   null
  }'

# → 200 ServiceResponseBean
{
  "status": true,
  "message": "File created successfully",
  "description": "Knowledge Base File 'How Payouts Work' has been created in folder 'Payments'",
  "activityLogStatusEnum": "KNOWLEDGE_BASE_FILE_CREATED",
  "data": {
    "folderId": "KKBF_9f3a...",
    "fileId":   "KKBFI_b41c...",
    "name":     "How Payouts Work",
    "status":   "CREATED",
    "version":  "v1",
    "metadata": { "author": "docs@kayana.io", "audience": "merchants" }
  }
}

# Rename inside the same folder  → description = "renamed from 'X' to 'Y' in folder 'Payments'"
# Move to a different folder     → description = "'X' moved from folder 'A' to 'B'"
# Rename + move together         → description = "renamed from 'X' to 'Y' and moved from 'A' to 'B'"
# file_status = "DELETED"        → activityLogStatusEnum = KNOWLEDGE_BASE_FILE_DELETED`,
    },

    // ─── 5 · Publish endpoint (multipart) ───────────────────────────────
    {
      path: "POST /admin/knowledge-base/upload-knowledge-base-document",
      caption: "05 · The one that actually goes to S3. Multipart: a JSON part `knowledge_base_request_json` with the full page list and a file part `file` with the assembled document. Draft saves the same body without the file part.",
      language: "http",
      code: `curl -X POST https://api.kayana.io/admin/knowledge-base/upload-knowledge-base-document \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: docs@kayana.io" \\
  -F 'knowledge_base_request_json={
        "file_id":       "KKBFI_b41c...",
        "file_status":   "PUBLISHED",
        "file_metadata": { "author": "docs@kayana.io", "audience": "merchants" },
        "pages": [
          { "page_id": null,               "content": { "blocks": [{"type":"h1","text":"How Payouts Work"}] } },
          { "page_id": "KKBP_11ee...",     "content": { "blocks": [{"type":"p","text":"Payouts land T+2..."}] } }
        ]
      };type=application/json' \\
  -F 'file=@./how-payouts-work.pdf'

# → 200 ServiceResponseBean
{
  "status": true,
  "message": "File published successfully",
  "description": "Knowledge Base File 'How Payouts Work' in folder 'Payments' has been published with version v3",
  "activityLogStatusEnum": "KNOWLEDGE_BASE_FILE_PUBLISHED",
  "data": {
    "fileId":  "KKBFI_b41c...",
    "version": "v3",
    "status":  "PUBLISHED",
    "pages": [
      { "pageId": "KKBP_c92d...", "pageNumber": 1, "operation": "CREATE", "status": "PUBLISHED" },
      { "pageId": "KKBP_11ee...", "pageNumber": 2, "operation": "UPDATE", "status": "PUBLISHED" }
    ]
  }
}

# Draft path: drop the -F 'file=...' and set "file_status":"DRAFT" — the service
# skips the S3 upload entirely (see stage 06) and only writes rows + history.`,
    },

    // ─── 6 · Publish service: page diff + version bump ──────────────────
    {
      path: "com.kayana.service.impl.KayanaAdminKnowledgeBaseService#uploadKnowledgeBaseDocumentWithUpsertFileAndPages (part 1 of 2)",
      caption: "06 · Every incoming page is diffed against the existing row set — matched pages update, new pages insert, missing pages soft-delete. Any real change (content OR status) writes a history row (stage 09). Publish also bumps the file version by parsing the last `v<n>` and adding one.",
      language: "java",
      code: `@Override
@LogActivity(username = "username")
public ServiceResponseBean uploadKnowledgeBaseDocumentWithUpsertFileAndPages(
        KnowledgeBaseRequestBean req, Mono<FilePart> file,
        String username, ServiceResponseBean srb) {

    if (req == null || req.getFileId() == null || req.getFileId().isBlank()) {
        srb.setMessage("FileId is required"); return srb;
    }
    Calendar now = Calendar.getInstance();
    String finalStatus = req.getFileStatus();     // PUBLISHED or DRAFT

    var fileRow = fileRepo.findByKkbdfiFileId(req.getFileId())
            .orElseThrow(() -> new IllegalStateException("File not found"));

    // Version bump only when publishing — parses the last "v<n>" for this file
    String nextFileVersion;
    if (GeneralStatusEnum.PUBLISHED.getValue().equalsIgnoreCase(finalStatus)) {
        nextFileVersion = docsRepo.findTopByKkbdFileIdOrderByKkbdCreatedDateDesc(req.getFileId())
                .map(d -> "v" + (Integer.parseInt(d.getKkbdFileVersion().replace("v", "")) + 1))
                .orElse(KayanaCommonConstants.INSTANCE.KNOWLEDGE_BASE_VERSION_1);
        fileRow.setKkbdfiFileVersion(nextFileVersion);
    } else {
        nextFileVersion = fileRow.getKkbdfiFileVersion();
    }

    // Diff against what's already in the DB
    var existing = pageRepo.findByKkbdpFileId(req.getFileId());
    Map<String, KayanaKnowledgeBaseDocumentPage> byId =
            existing.stream().collect(Collectors.toMap(KayanaKnowledgeBaseDocumentPage::getKkbdpPageId, p -> p));
    Set<String> incomingPageIds = new HashSet<>();
    int pageCounter = 1;

    for (KnowledgeBaseRequestBean.PageData p : req.getPages()) {
        if (p.getPageId() != null && byId.containsKey(p.getPageId())) {
            // UPDATE
            var row = byId.get(p.getPageId());
            Object oldContent = row.getKkbdpContent();
            String oldStatus  = row.getKkbdpStatus();

            row.setKkbdpPageNumber((long) pageCounter);
            row.setKkbdpContent(p.getContent());
            row.setKkbdpStatus(finalStatus);
            row.setKkbdpUpdatedDate(now); row.setKkbdpUpdatedBy(applicationName);
            pageRepo.save(row);
            incomingPageIds.add(p.getPageId());

            if (!Objects.equals(oldContent, p.getContent()) || !Objects.equals(oldStatus, finalStatus)) {
                logPagesHistory(row.getKkbdpPageId(), req.getFileId(),
                        GeneralStatusEnum.UPDATE.getValue(),
                        oldStatus, finalStatus, oldContent, p.getContent(),
                        fileRow.getKkbdfiFileVersion(), now, username);
            }
        } else {
            // INSERT
            String pageId = KayanaCommonConstants.INSTANCE.KNOWLEDGE_BASE_PAGE_ID_PREFIX
                    .concat(KayanaCommonUtils.INSTANCE.uniqueIdentifier());
            var row = KayanaKnowledgeBaseDocumentPage.builder()
                    .kkbdpFileId(req.getFileId()).kkbdpPageId(pageId)
                    .kkbdpPageNumber((long) pageCounter)
                    .kkbdpContent(p.getContent()).kkbdpStatus(finalStatus)
                    .kkbdpCreatedDate(now).kkbdpCreatedBy(applicationName).build();
            pageRepo.save(row);
            incomingPageIds.add(pageId);
            logPagesHistory(pageId, req.getFileId(),
                    GeneralStatusEnum.CREATE.getValue(),
                    null, finalStatus, null, p.getContent(),
                    fileRow.getKkbdfiFileVersion(), now, username);
        }
        pageCounter++;
    }

    // Soft-delete anything that came out of the incoming set
    for (var row : existing) {
        if (!incomingPageIds.contains(row.getKkbdpPageId())) {
            String oldStatus = row.getKkbdpStatus();
            row.setKkbdpStatus(GeneralStatusEnum.DELETED.getValue());
            row.setKkbdpUpdatedDate(now); row.setKkbdpUpdatedBy(applicationName);
            pageRepo.save(row);
            logPagesHistory(row.getKkbdpPageId(), req.getFileId(),
                    GeneralStatusEnum.DELETE.getValue(),
                    oldStatus, GeneralStatusEnum.DELETED.getValue(),
                    row.getKkbdpContent(), null,
                    fileRow.getKkbdfiFileVersion(), now, username);
        }
    }
    // ... continues in stage 07 (S3 upload + docs row + activity log)
}`,
    },

    // ─── 7 · Publish service: FilePart → temp file → S3 ─────────────────
    {
      path: "com.kayana.service.impl.KayanaAdminKnowledgeBaseService#uploadKnowledgeBaseDocumentWithUpsertFileAndPages (part 2 of 2)",
      caption: "07 · The reactor half. FilePart streams onto Schedulers.boundedElastic() so the WebFlux event loop never blocks; the file lands in a temp path, S3.putObject runs synchronously inside that reactor step, and the returned versionId is stamped onto a fresh knowledge_base_documents row along with the CDN url. Failure branch still logs + always deletes the temp.",
      language: "java",
      code: `// s3 metadata comes from the incoming file_metadata jsonb — keys lowercased,
// values re-serialised with JsonGenerator.Feature.ESCAPE_NON_ASCII so S3 headers stay 7-bit clean
Map<String, String> s3Metadata = buildS3MetadataFromRequest(req);
String metadataJson             = toMetadataJson(req);

fileRow.setKkbdfiStatus(finalStatus);
fileRow.setKkbdfiUpdatedDate(now); fileRow.setKkbdfiUpdatedBy(applicationName);

if (GeneralStatusEnum.PUBLISHED.getValue().equalsIgnoreCase(finalStatus)) {
    if (file == null) { srb.setMessage("File is required for publishing"); return srb; }

    CountDownLatch latch = new CountDownLatch(1);
    file.flatMap(filePart -> Mono.fromCallable(() -> Files.createTempFile("kb-publish-", ".tmp"))
            .subscribeOn(Schedulers.boundedElastic())        // never block the event loop
            .flatMap(tempFile -> DataBufferUtils.write(filePart.content(), tempFile)
                    .then(Mono.fromRunnable(() -> {
                        try {
                            File localFile = tempFile.toFile();
                            if (localFile.length() == 0) throw new IllegalStateException("Uploaded file is empty");

                            String envFolder = environment.getActiveProfiles().length == 0
                                    ? "fallback" : environment.getActiveProfiles()[0];
                            String ext       = extractExtension(filePart.filename());
                            String s3Key     = KayanaCommonConstants.INSTANCE.KNOWLEDGE_BASE_S3_FOLDER_NAME
                                    + "/" + envFolder + "/" + req.getFileId() + ext;

                            PutObjectRequest put = PutObjectRequest.builder()
                                    .bucket(knowledgeBaseBucketName)
                                    .key(s3Key)
                                    .contentType(Optional.ofNullable(filePart.headers().getContentType())
                                            .map(Object::toString).orElse("application/octet-stream"))
                                    .metadata(s3Metadata)
                                    .build();

                            PutObjectResponse resp = s3Client.putObject(put, RequestBody.fromFile(localFile));
                            String s3Version = resp.versionId();   // ← versioned bucket returns this

                            String cdnUrl = knowledgeBaseDocumentCdnUrl.replaceAll("/$", "") + "/" + s3Key;

                            docsRepo.save(KayanaKnowledgeBaseDocuments.builder()
                                    .kkbdFileId(req.getFileId())
                                    .kkbdFileName(filePart.filename())
                                    .kkbdFileUrl(cdnUrl)               // deterministic CDN url
                                    .kkbdMetadata(metadataJson)         // jsonb
                                    .kkbdS3Version(s3Version)           // ← what Adeyt ingest keys off
                                    .kkbdFileVersion(nextFileVersion)   // v3
                                    .kkbdStatus(GeneralStatusEnum.PUBLISHED.getValue())
                                    .kkbdCreatedDate(Calendar.getInstance())
                                    .kkbdCreatedBy(applicationName).build());
                        } catch (Exception e) {
                            log.error("Error during publish", e);
                            srb.setMessage(e.getMessage());
                        } finally {
                            try { Files.deleteIfExists(tempFile); }
                            catch (IOException ex) { log.error("Temp cleanup failed", ex); }
                        }
                    })))
            .doFinally(sig -> latch.countDown()).subscribe();
    latch.await();                                    // controller Mono waits for S3 to finish
}

fileRepo.save(fileRow);

// Activity-log wiring — the aspect (task-audit) reads this off the bean on return
if (GeneralStatusEnum.PUBLISHED.getValue().equalsIgnoreCase(finalStatus)) {
    srb.setActivityLogStatusEnum(ActivityLogStatusEnum.KNOWLEDGE_BASE_FILE_PUBLISHED);
    srb.setDescription("Knowledge Base File '" + fileRow.getKkbdfiFileName()
        + "' in folder '" + folderName + "' has been published with version " + fileRow.getKkbdfiFileVersion());
} else {
    srb.setActivityLogStatusEnum(ActivityLogStatusEnum.KNOWLEDGE_BASE_FILE_DRAFTED);
    srb.setDescription("Knowledge Base File '" + fileRow.getKkbdfiFileName()
        + "' in folder '" + folderName + "' has been saved as draft");
}
srb.setStatus(true); srb.setData(mapFileEntityToResponse(fileRow));
return srb;`,
    },

    // ─── 8 · Inline content image upload + delete ───────────────────────
    {
      path: "POST /admin/knowledge-base/upload-knowledge-base-content-image   +   DELETE /delete-knowledge-base-content-image",
      caption: "08 · Editor-side image pipeline — the same reactor+temp+S3 pattern as publish, but images land under a separate images/ prefix under the environment folder, and the response hands back the cdn_url the editor pastes into the page's jsonb block.",
      language: "http",
      code: `# upload
curl -X POST https://api.kayana.io/admin/knowledge-base/upload-knowledge-base-content-image \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -F 'image=@./payout-diagram.png'

# → 200
{
  "status": true,
  "message": "Image uploaded successfully",
  "data": {
    "cdn_url": "https://cdn.kayana.io/knowledge-base/prod/images/1735579271-2fa9c1",
    "s3_key":  "knowledge-base/prod/images/1735579271-2fa9c1"
  }
}

# delete (editor removes the image from the page)
curl -X DELETE "https://api.kayana.io/admin/knowledge-base/delete-knowledge-base-content-image?s3Key=knowledge-base/prod/images/1735579271-2fa9c1" \\
  -H "Authorization: Bearer <admin_jwt>"

# → 200
{ "status": true, "message": "Image deleted successfully" }`,
    },

    // ─── 9 · DDL — four tables + one history table ──────────────────────
    {
      path: "PostgreSQL — kayana_knowledge_base_document_folder / _file / _page / _documents / _page_history",
      caption: "09 · Real column names as pulled from the JPA entities. `content` is jsonb so a page holds an arbitrary editor block tree; `metadata` is jsonb so authors can attach anything; `documents` is the append-only publish ledger — one row per (file_id, file_version) with the S3 versionId that pins it.",
      language: "sql",
      code: `-- 1) Folders
CREATE TABLE kayana_knowledge_base_document_folder (
    kkbdf_seq_id           BIGSERIAL PRIMARY KEY,
    kkbdf_folder_id        VARCHAR(64)  UNIQUE NOT NULL,
    kkbdf_folder_name      VARCHAR(255) NOT NULL,
    kkbdf_parent_folder_id VARCHAR(64),
    kkbdf_is_locked_folder BOOLEAN      DEFAULT FALSE,
    kkbdf_status           VARCHAR(32)  NOT NULL,       -- CREATED / DELETED
    kkbdf_created_date     TIMESTAMPTZ,
    kkbdf_created_by       VARCHAR(64),
    kkbdf_updated_date     TIMESTAMPTZ,
    kkbdf_updated_by       VARCHAR(64)
);

-- 2) Files (one row per file, holds the *live* version pointer)
CREATE TABLE kayana_knowledge_base_document_file (
    kkbdfi_seq_id       BIGSERIAL PRIMARY KEY,
    kkbdfi_folder_id    VARCHAR(64)  NOT NULL,
    kkbdfi_file_id      VARCHAR(64)  UNIQUE NOT NULL,
    kkbdfi_file_name    VARCHAR(255) NOT NULL,
    kkbdfi_file_version VARCHAR(16),                    -- "v1", "v2", ...
    kkbdfi_metadata     JSONB,
    kkbdfi_status       VARCHAR(32)  NOT NULL,          -- CREATED / DRAFT / PUBLISHED / DELETED
    kkbdfi_created_date TIMESTAMPTZ, kkbdfi_created_by VARCHAR(64),
    kkbdfi_updated_date TIMESTAMPTZ, kkbdfi_updated_by VARCHAR(64)
);

-- 3) Pages (rich editor blocks, jsonb)
CREATE TABLE kayana_knowledge_base_document_page (
    kkbdp_seq_id       BIGSERIAL PRIMARY KEY,
    kkbdp_file_id      VARCHAR(64) NOT NULL,
    kkbdp_page_id      VARCHAR(64) UNIQUE NOT NULL,
    kkbdp_page_number  BIGINT      NOT NULL,
    kkbdp_content      JSONB,                            -- the editor's block tree
    kkbdp_status       VARCHAR(32) NOT NULL,             -- DRAFT / PUBLISHED / DELETED
    kkbdp_created_date TIMESTAMPTZ, kkbdp_created_by VARCHAR(64),
    kkbdp_updated_date TIMESTAMPTZ, kkbdp_updated_by VARCHAR(64)
);

-- 4) Documents ledger — one row per publish, S3 versionId pins the artefact
CREATE TABLE kayana_knowledge_base_documents (
    kkbd_seq_id       BIGSERIAL PRIMARY KEY,
    kkbd_file_id      VARCHAR(64) NOT NULL,
    kkbd_file_name    VARCHAR(512),
    kkbd_file_url     TEXT,                              -- CDN url
    kkbd_metadata     JSONB,
    kkbd_s3_version   VARCHAR(128),                      -- what Adeyt ingest keys off
    kkbd_file_version VARCHAR(16),                       -- "v3"
    kkbd_status       VARCHAR(32),
    kkbd_created_date TIMESTAMPTZ, kkbd_created_by VARCHAR(64),
    kkbd_update_date  TIMESTAMPTZ, kkbd_updated_by  VARCHAR(64)
);

-- 5) Page-level history — one row per changed page per save, both content payloads
CREATE TABLE kayana_knowledge_base_page_history (
    kkbph_seq_id      BIGSERIAL PRIMARY KEY,
    kkbph_page_id     VARCHAR(64) NOT NULL,
    kkbph_file_id     VARCHAR(64) NOT NULL,
    kkbph_action      VARCHAR(16),                       -- CREATE / UPDATE / DELETE
    kkbph_old_status  VARCHAR(32),
    kkbph_new_status  VARCHAR(32),
    kkbph_old_content JSONB,
    kkbph_new_content JSONB,
    kkbph_file_version VARCHAR(16),                      -- the *file* version the change belongs to
    kkbph_created_by   VARCHAR(64),
    kkbph_created_date TIMESTAMPTZ
);`,
    },

    // ─── 10 · History write + audit tie-in ──────────────────────────────
    {
      path: "com.kayana.service.impl.KayanaAdminKnowledgeBaseService#logPagesHistory   +   ActivityLogStatusEnum",
      caption: "10 · Every meaningful page save writes one row into kayana_knowledge_base_page_history with both old and new jsonb content, so an author can see when text drifted and the Adeyt team can replay any past version. The file-level activity row is written by the aspect off the response bean — see the eight KNOWLEDGE_BASE_* enum entries.",
      language: "java",
      code: `// KayanaAdminKnowledgeBaseService — private helper
private void logPagesHistory(String pageId, String fileId, String action,
        String oldStatus, String newStatus,
        Object oldContent, Object newContent,
        String fileVersion, Calendar now, String username) {

    pageHistoryRepo.save(KayanaKnowledgeBasePageHistory.builder()
            .kkbphPageId(pageId).kkbphFileId(fileId).kkbphAction(action)
            .kkbphOldStatus(oldStatus).kkbphNewStatus(newStatus)
            .kkbphOldContent(oldContent).kkbphNewContent(newContent)
            .kkbphFileVersion(fileVersion)
            .kkbphCreatedBy(username).kkbphCreatedDate(now).build());
}

// com.kayana.enums.ActivityLogStatusEnum  (log-service)
public enum ActivityLogStatusEnum {
    // ... (audit rows the aspect emits off the response bean)
    KNOWLEDGE_BASE_FOLDER_CREATED("KNOWLEDGE BASE FOLDER CREATED"),
    KNOWLEDGE_BASE_FOLDER_UPDATED("KNOWLEDGE BASE FOLDER UPDATED"),
    KNOWLEDGE_BASE_FOLDER_DELETED("KNOWLEDGE BASE FOLDER DELETED"),
    KNOWLEDGE_BASE_FILE_CREATED  ("KNOWLEDGE BASE FILE CREATED"),
    KNOWLEDGE_BASE_FILE_UPDATED  ("KNOWLEDGE BASE FILE UPDATED"),
    KNOWLEDGE_BASE_FILE_DELETED  ("KNOWLEDGE BASE FILE DELETED"),
    KNOWLEDGE_BASE_FILE_DRAFTED  ("KNOWLEDGE BASE FILE DRAFTED"),
    KNOWLEDGE_BASE_FILE_PUBLISHED("KNOWLEDGE BASE FILE PUBLISHED"),
    // ...
}

// End-to-end recap  ────────────────────────────────────────────────
//   Author edits tree                    →  stage 01
//   Save folder / rename / delete        →  stages 02–03
//   Save / rename / move file            →  stage 04
//   Publish (or draft) with pages+file   →  stage 05
//     ├── diff & upsert every page       →  stage 06
//     ├── stream to S3, capture versionId→  stage 07
//     ├── insert kb_documents ledger row →  stage 07
//     └── every changed page             →  stage 10 (history row)
//   Editor image ops                     →  stage 08
//   Storage layout                       →  stage 09
//   Aspect emits KNOWLEDGE_BASE_* audit  →  stage 10`,
    },
  ],

  keyInsight: "The whole module is shaped around two invariants that the Adeyt AI training pipeline depends on. Invariant one: file_version only moves on transition to PUBLISHED — so drafts can be edited freely without polluting the version sequence, and 'v3' actually means 'the third published snapshot'. Invariant two: the S3 versionId is stamped on the knowledge_base_documents row at PUT time — so the training pipeline reads a deterministic immutable object even after later publishes overwrite the same s3Key. Pair that with per-page history (old / new content + status + file_version) and the AI team can replay any prior corpus state; pair it with the FilePart → temp-file → boundedElastic pattern and the WebFlux event loop never blocks on a multi-MB document.",

  requestTrace: [
    { phase: "FOLDER",        detail: "POST /admin/knowledge-base/upsert-knowledge-base-folder. folderId empty → create KBFLDR_…/CREATED. Otherwise update — name / parent / locked / status. Self-parent + deleted-parent guards. Typed @LogActivity description per outcome." },
    { phase: "FILE",          detail: "POST /admin/knowledge-base/upsert-knowledge-base-file. fileId empty → create KBFILE_…/v1/CREATED. Otherwise resolve old + new folder names and emit a typed description per outcome — renamed only / moved only / both / deleted / generic update." },
    { phase: "PUBLISH-PARSE", detail: "POST /admin/knowledge-base/upload-knowledge-base-document (multipart). Controller Jacksons the knowledge_base_request_json part by hand; the FilePart stays a Mono<FilePart> so the streaming path is reactor-driven." },
    { phase: "VERSION",       detail: "If finalStatus=PUBLISHED, look up the previous knowledge_base_documents row by file_id ordered desc; parse 'v3' → 3; bump to 'v4'. Drafts inherit the prior version." },
    { phase: "PAGE-DIFF",     detail: "Index existing pages by pageId. For each PageData in the request: existing pageId → UPDATE + logPagesHistory if content or status changed; new → CREATE + logPagesHistory; existing-but-missing-from-request → soft-DELETE + logPagesHistory. page_number is reassigned 1..N from request order." },
    { phase: "METADATA",      detail: "fileMetadata is serialised twice — full JSON onto kkbdfi_metadata for the UI, and an ASCII-escaped sanitised Map<String,String> for S3 user-metadata (S3 user-metadata is ASCII-only)." },
    { phase: "S3-PUT",        detail: "FilePart.content() → DataBufferUtils.write(...) on Schedulers.boundedElastic() → s3Key = KB_FOLDER/profile/fileId.ext → s3Client.putObject. PutObjectResponse.versionId() captured for the row." },
    { phase: "DOC-ROW",       detail: "knowledge_base_documents row saved: file_id, file_name, file_url (CDN-prefixed s3Key), metadata JSON, s3_version, file_version (nextFileVersion), status=PUBLISHED. This is what Adeyt training pulls." },
    { phase: "LATCH",         detail: "CountDownLatch.countDown() in doFinally; latch.await() in the outer service method. The HTTP response only returns once S3 has ACK'd the PUT and the row is durable." },
    { phase: "ACTIVITY-LOG",  detail: "ActivityLogStatusEnum is set per outcome — KNOWLEDGE_BASE_FILE_PUBLISHED / KNOWLEDGE_BASE_FILE_DRAFTED — and the description carries the file + folder name + version. The aspect from [[task-audit]] picks it up after commit." },
    { phase: "IMAGE-CRUD",    detail: "Image upload: same Reactor pattern, s3Key = KB_FOLDER/profile/images/uniqueImageId, response is { cdn_url, s3_key }. Image delete: writes a delete marker (bucket versioning is enabled) — past published documents stay readable from their stamped versionId." },
  ],

  constraintsLimitations: [
    "CountDownLatch.await() blocks the calling thread while the reactor chain runs — fine inside a Spring @Service method but means the publish path can't be reached concurrently from a single request thread without serialising.",
    "S3 user-metadata is ASCII-only and capped at 2KB total; non-trivial fileMetadata gets ASCII-escaped + sanitised, which can mangle keys with non-ASCII characters. The full original JSON is stored on the row separately to recover the un-escaped form.",
    "page_number is reassigned 1..N from request order on every save — there's no way to do a 'move only this page' update; the entire pages array is the contract.",
    "logPagesHistory only fires on content / status change for updates — a page that's saved with identical content + status doesn't write a row, which is correct but can confuse 'why is there no history entry?' debugging.",
    "Delete on the image endpoint writes a delete marker; the bytes are not purged. That's intentional for corpus reproducibility but means S3 storage costs grow without bound until lifecycle rules are configured.",
  ],

  conclusion: "Five endpoints, three repositories' worth of relational rows, one versioned S3 bucket. The shape is what gives the AI team a deterministic corpus to train on — and gives the authoring team a real CMS with rollback. The trick was keeping the S3 PUT inside the reactor chain without blocking the event loop, and keeping the version sequence meaningful by only bumping on PUBLISHED.",
};
