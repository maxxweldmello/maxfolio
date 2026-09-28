import type { Task } from "../tasks.data";

export const taskMenus: Task = {
  taskId:    "task-menus",
  projectId: "kayana-admin",
  status:    "completed",
  role:      "solo",
  techTags:  ["Java", "Spring Boot", "OpenCSV", "MySQL", "JPA", "Kafka"],
  image:     "/tasks/menus/hero.jpg",

  title: "Bulk Menu Authoring — ZIP Export / Import",

  description: "A ZIP-based export / import streams a property's entire menu hierarchy (menus → categories → items → addons → combo groups → combo items) across environments as a ZIP of CSVs.",

  ideaPipeline: {
    steps: ["Export → ZIP", "Multipart upload", "BFS dep check", "Layered save + FK rewire", "Kafka publish"],
    caption: "Export walks the graph and streams each layer into its own CSV inside a ZipOutputStream. Import inverts it: depth-bounded BFS rejects cross-menu combo refs, a validate* chain catches dup identifiers, then a 7-step saveAll runs in dependency order — each layer rewiring foreign keys via its own oldId→newId map.",
  },

  problemStatement: "Onboarding a new restaurant property meant rebuilding the menu by hand — hundreds of items, dozens of addon categories, combo groups whose ingredients reference items in other menus. Copying through the UI took an entire day per property and introduced typos. There was no clean way to back up a menu before a destructive change, and no way to move a tested catalog from staging to production atomically.",

  /* Inline flow rendering — every stage on the page, one long scroll. */
  codeInline: true,

  codeExample: [
    {
      path: "POST /admin/menu/export-menus",
      caption: "02 · Export endpoint — one JSON payload in, one ZIP out",
      language: "http",
      code: `# Real endpoint on kayana-admin-service. Everything in and out is JSON
# except the returned data field which carries the ZIP bytes.

curl -X POST https://api.kayana.io/admin/menu/export-menus \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: admin@kayana.io" \\
  -H "Content-Type: application/json" \\
  --json '{
    "menuIds": ["MNU-1121", "MNU-1122"]
  }' \\
  --output menus-export.zip

# The service is annotated @LogActivity(EXPORT_MENU_AS_ZIP) so the whole
# export lands as a single audit row for the property (see task-audit).

# Response envelope (before the zip bytes are streamed to disk):
{
  "status":  true,
  "message": "Menu export completed",
  "propertyId": "PROP-2201"
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminMenuService#exportMenusAsZip",
      caption: "03 · Export walk — one ZipOutputStream, seven CSVs written in dependency order",
      language: "java",
      code: `@Override
@LogActivity(status = ActivityLogStatusEnum.EXPORT_MENU_AS_ZIP, username = "username")
@Transactional(readOnly = true)
public ServiceResponseBean exportMenusAsZip(List<String> menuIds,
                                             String username,
                                             ServiceResponseBean srb) {

    try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
         ZipOutputStream zip = new ZipOutputStream(baos)) {

        // Layer 1 — MENUS (root of the graph)
        List<KayanaBusinessMenuDetail> menus =
            menuRepo.findByKbmdMenuIdIn(menuIds);
        if (CollectionUtils.isEmpty(menus))
            throw new RuntimeException("No kayanaBusinessMenuDetails found");
        menuUtils.writeCsv(zip, KayanaCommonConstants.MENUS,
                           menus.stream().map(menuUtils::mapMenu).toList(),
                           MenuCsv.class);

        // Layer 2 — CATEGORIES scoped to those menus
        List<KayanaBusinessCategoryDetail> cats =
            catRepo.findByKbcdCategoryStatusAndKbcdMenuIdIn(
                CategoryStatusEnum.ACTIVE.getValue(),
                menus.stream().map(KayanaBusinessMenuDetail::getKbmdMenuId).toList());
        menuUtils.writeCsv(zip, KayanaCommonConstants.CATEGORIES,
                           cats.stream().map(menuUtils::mapCategory).toList(),
                           CategoryCsv.class);

        // Layer 3 — ITEMS in those categories
        List<KayanaBusinessItemDetail> items = itemRepo
            .findByKbidItemStatusInAndKbidCategoryIdIn(
                List.of(ItemStatusEnum.ACTIVE.getValue(),
                        ItemStatusEnum.INACTIVE.getValue()),
                cats.stream().map(KayanaBusinessCategoryDetail::getKbcdCategoryId).toList());
        menuUtils.writeCsv(zip, KayanaCommonConstants.ITEMS,
                           items.stream().map(menuUtils::mapItem).toList(),
                           ItemCsv.class);

        // Layers 4–7 follow the same pattern:
        //   ADDON_CATEGORIES  → keyed by item id
        //   ADDONS            → keyed by item id
        //   COMBO_GROUPS      → keyed by item id (only combo items)
        //   COMBO_ITEMS       → keyed by combo group id
        // ... each written to its own ZipEntry so the importer can pick
        // them up one file at a time, in the same order.

        srb.setData(baos.toByteArray());     // bytes returned as the response body
        srb.setStatus(true);
        srb.setPropertyId(menus.get(0).getKbmdPropertyId());
    } catch (Exception e) {
        throw new RuntimeException("Failed to export menu data", e);
    }
    return srb;
}
`,
    },
    {
      path: "menus-export.zip — layout",
      caption: "04 · What comes out — one ZIP, seven CSVs, deterministic filenames",
      language: "text",
      code: `menus-export.zip
├── menus.csv                # root — menu_id, property_id, menu_identifier, ...
├── categories.csv           # FK: menu_id
├── items.csv                # FK: category_id
├── addon-categories.csv     # FK: item_id
├── addons.csv               # FK: item_id (+ addon_category_id)
├── combo-groups.csv         # FK: item_id  (only for combo items)
└── combo-items.csv          # FK: combo_group_id, item_id

# Filenames are fixed by KayanaCommonConstants — the importer switches on
# these strings to decide which CSV maps to which row type (stage 06).
`,
    },
    {
      path: "MenuCsv / CategoryCsv / ItemCsv — @CsvBindByName",
      caption: "05 · Row shape — every column is opencsv-annotated, so the CSV header is the schema",
      language: "java",
      code: `// One class per CSV file. Fields are @CsvBindByName so opencsv reads/writes
// by header name — column reordering in the file is safe.

public class MenuCsv {
    @CsvBindByName(column = "menu_id",           required = false) private String menuId;
    @CsvBindByName(column = "property_id",       required = false) private String propertyId;
    @CsvBindByName(column = "menu_identifier",   required = false) private String menuIdentifier;
    @CsvBindByName(column = "menu_deliverect_id",required = false) private String menuDeliverectId;
    @CsvBindByName(column = "menu_robo_key",     required = false) private String menuRoboKey;
    @CsvBindByName(column = "eposnow_id",        required = false) private String eposNowId;
    // ... more descriptive columns
}

public class CategoryCsv {
    @CsvBindByName(column = "category_id",         required = false) private String categoryId;
    @CsvBindByName(column = "menu_id",             required = false) private String menuId;         // FK
    @CsvBindByName(column = "category_identifier", required = false) private String categoryIdentifier;
    @CsvBindByName(column = "category_deliverect_id", required = false) private String deliverectCategoryId;
    // ...
}

public class ItemCsv {
    @CsvBindByName(column = "item_id",           required = false) private String itemId;
    @CsvBindByName(column = "category_id",       required = false) private String categoryId;      // FK
    @CsvBindByName(column = "deliverect_item_id",required = false) private String deliverectItemId;
    @CsvBindByName(column = "eposnow_item_id",   required = false) private String eposnowItemId;
    @CsvBindByName(column = "item_robo_key",     required = false) private String itemRoboKey;
    // ...
}

// The importer stores oldId → newId per layer (menuMap, categoryMap, itemMap,
// addonCategoryMap, addonMap, comboGroupMap, comboItemMap) so it can rewire
// FKs when it writes each subsequent layer into the target property (stage 08).
`,
    },
    {
      path: "POST /admin/menu/import-menus",
      caption: "06 · Import endpoint — multipart upload targeting the destination property",
      language: "http",
      code: `# Multipart because the ZIP itself is a real file part, not JSON.
# targetPropertyId decides where the rewired graph gets rooted.

curl -X POST "https://api.kayana.io/admin/menu/import-menus\\
?property_id=PROP-7788" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: admin@kayana.io" \\
  -F "zip-file=@menus-export.zip;type=application/zip"

# → ServiceResponseBean
{
  "status": true,
  "message": null,
  "description": "Imported 2 menus, 12 categories, 87 items, 24 addon categories, 96 addons, 4 combo groups, 18 combo items into PROP-7788"
}

# Fails cleanly on any duplicate identifier — one aggregated error message,
# transaction rolls back, no partial write on the target property:
{
  "status": false,
  "message": "Duplicate identifiers found: Duplicate Menu: Menu → 'lunch-2024', Duplicate Category: Category → 'starters'"
}
`,
    },
    {
      path: "com.kayana.service.impl.KayanaAdminMenuService#importMenusFromZip",
      caption: "07 · Read the ZIP — validate every layer, then save in dependency order under one transaction",
      language: "java",
      code: `@Override
@Transactional(rollbackFor = Exception.class)
@LogActivity(status = ActivityLogStatusEnum.IMPORT_MENU_THROUGH_ZIP, username = "username")
public ServiceResponseBean importMenusFromZip(File zipFile,
                                              String targetPropertyId,
                                              String username,
                                              ServiceResponseBean srb) {

    // One oldId → newId map per layer. Populated as each layer is saved so
    // the next layer can rewire its foreign keys without a second SQL pass.
    Map<String,String> menuMap = new HashMap<>(),  categoryMap = new HashMap<>(),
                       itemMap = new HashMap<>(),  addonCategoryMap = new HashMap<>(),
                       addonMap = new HashMap<>(), comboGroupMap  = new HashMap<>(),
                       comboItemMap = new HashMap<>();

    List<MenuCsv> menuRows = null;   /* ...all six other row lists... */

    // Read each CSV entry from the ZIP into its typed row list.
    try (ZipInputStream zin = new ZipInputStream(new FileInputStream(zipFile))) {
        ZipEntry entry;
        while ((entry = zin.getNextEntry()) != null) {
            String name = entry.getName();
            if (name.contains("/")) name = name.substring(name.lastIndexOf('/') + 1);
            switch (name) {
                case KayanaCommonConstants.MENUS            -> menuRows          = menuUtils.readCsv(zin, MenuCsv.class);
                case KayanaCommonConstants.CATEGORIES       -> categoryRows      = menuUtils.readCsv(zin, CategoryCsv.class);
                case KayanaCommonConstants.ITEMS            -> itemRows          = menuUtils.readCsv(zin, ItemCsv.class);
                case KayanaCommonConstants.ADDON_CATEGORIES -> addonCategoryRows = menuUtils.readCsv(zin, AddonCategoryCsv.class);
                case KayanaCommonConstants.ADDONS           -> addonRows         = menuUtils.readCsv(zin, AddonCsv.class);
                case KayanaCommonConstants.COMBO_GROUPS     -> comboGroupRows    = menuUtils.readCsv(zin, ComboGroupCsv.class);
                case KayanaCommonConstants.COMBO_ITEMS      -> comboItemRows     = menuUtils.readCsv(zin, ComboItemCsv.class);
            }
        }

        // Validate every layer BEFORE any write — collect errors, abort as one.
        List<String> validationErrors = new ArrayList<>();
        Set<String>  duplicateMenus   = validateMenus(menuRows, targetPropertyId, validationErrors);
        validateCategories(categoryRows, menuRows, targetPropertyId, validationErrors, duplicateMenus);
        validateItems(itemRows, categoryRows, menuRows, targetPropertyId, validationErrors, duplicateMenus);
        validateAddonCategories(addonCategoryRows, itemRows, categoryRows, menuRows, targetPropertyId, validationErrors, duplicateMenus);
        validateAddons(addonRows, addonCategoryRows, itemRows, categoryRows, menuRows, targetPropertyId, validationErrors, duplicateMenus);
        if (!validationErrors.isEmpty()) {
            srb.setMessage("Duplicate identifiers found: " + String.join(", ", validationErrors));
            return srb;                                    // @Transactional rolls back
        }

        // Save in dependency order — every layer rewires FKs via its map.
        menuRepo.saveAll(menuUtils.importMenus(menuRows, targetPropertyId, menuMap));
        catRepo.saveAll(menuUtils.importCategories(categoryRows, categoryMap, menuMap));
        itemRepo.saveAll(menuUtils.importItems(itemRows, itemMap, categoryMap, targetPropertyId));
        addonCatRepo.saveAll(menuUtils.importAddonCategories(addonCategoryRows, addonCategoryMap, itemMap));
        addonRepo.saveAll(menuUtils.importAddons(addonRows, itemMap, addonCategoryMap, addonMap));
        comboGroupRepo.saveAll(menuUtils.importComboGroups(comboGroupRows, comboGroupMap, itemMap));
        comboItemRepo.saveAll(menuUtils.importComboItems(comboItemRows, comboGroupMap, comboItemMap, itemMap));

        // Publish a menu-sync Kafka event so downstream services (Deliverect,
        // UrbanPiper, POS terminals) reload the target property's menu cache.
        String menuIdsCsv = menuMap.values().stream().collect(Collectors.joining(","));
        if (!menuIdsCsv.isBlank())
            kafkaProducer.publishNotification(targetPropertyId, menuIdsCsv);

        srb.setStatus(true);
        srb.setDescription(menuUtils.buildImportDescription(/* row lists + maps */));
    } catch (Exception e) {
        srb.setStatus(false);
        srb.setMessage("Menu import failed");
    }
    return srb;
}
`,
    },
    {
      path: "KayanaAdminMenuService#validateMenus (one of five)",
      caption: "08 · Validation — one guardrail per layer, run before any write hits the DB",
      language: "java",
      code: `// One validator per row type — same shape for every layer. Each one
// looks up the target property for an existing row with the same
// identifier + ACTIVE status; if it finds one, the whole import fails
// with a single joined error message (see stage 06's failure response).

private Set<String> validateMenus(List<MenuCsv> menuRows,
                                  String propertyId,
                                  List<String> errors) {

    Set<String> duplicateMenuIdentifiers = new HashSet<>();
    if (menuRows == null) return duplicateMenuIdentifiers;

    for (MenuCsv menu : menuRows) {
        boolean exists = menuRepo
            .existsByKbmdPropertyIdAndKbmdMenuIdentifierAndKbmdMenuStatus(
                propertyId,
                menu.getMenuIdentifier(),
                GeneralStatusEnum.ACTIVE.getValue());
        if (exists) {
            errors.add("Duplicate Menu: Menu → '" + menu.getMenuIdentifier() + "'");
            duplicateMenuIdentifiers.add(menu.getMenuIdentifier());
        }
    }
    return duplicateMenuIdentifiers;
}

// validateCategories, validateItems, validateAddonCategories, validateAddons
// follow the exact same shape — same lookup style, same error format,
// duplicateMenuIdentifiers is threaded through so a category under a
// dup-menu isn't reported twice.
`,
    },
    {
      path: "KayanaAdminMenuService#discoverMenuDependencies",
      caption: "09 · Combo dependency BFS — rejects cross-menu combo refs before export runs",
      language: "java",
      code: `// Combos can point at items in OTHER menus. Before exporting we walk the
// menu graph BFS-style and refuse to go deeper than maxDependencyDepth —
// prevents an export that would land as a broken FK on the target side.

public List<MenuDependencyInfo> discoverMenuDependencies(Set<String> initialMenuIds,
                                                          Integer maxDependencyDepth) {

    Set<String> visitedMenus = new HashSet<>();
    Set<String> currentLevel = new HashSet<>(initialMenuIds);
    List<MenuDependencyInfo> discovered = new ArrayList<>();

    int depth = 0;
    String status = GeneralStatusEnum.ACTIVE.getValue();

    while (!currentLevel.isEmpty()) {
        if (depth++ >= maxDependencyDepth) throw new DependencyDepthExceededException();

        Set<String> nextLevel = new HashSet<>();
        for (String menuId : currentLevel) {
            if (!visitedMenus.add(menuId)) continue;

            List<KayanaBusinessCategoryDetail> cats =
                catRepo.findByKbcdMenuIdAndKbcdCategoryStatus(menuId, status);

            for (KayanaBusinessCategoryDetail cat : cats)
                for (KayanaBusinessItemDetail item : itemRepo.findByKbidCategoryIdAndKbidItemStatus(
                                                        cat.getKbcdCategoryId(), status))
                    if (Boolean.TRUE.equals(item.getKbidIsCombo()))
                        for (KayanaBusinessComboGroupDetails g :
                                comboGroupRepo.findByKbcgdItemIdAndKbcgdComboGroupStatus(
                                    item.getKbidItemId(), status))
                            for (KayanaBusinessComboItemDetails dep :
                                    comboItemRepo.findByKbcidComboGroupIdAndKbcidComboItemStatus(
                                        g.getKbcgdComboGroupId(), status)) {
                                // ... resolve dep.item → depItem → depCategory
                                // ... if depCategory.menuId is NEW, add to nextLevel
                            }
        }
        currentLevel = nextLevel;
    }
    return discovered;
}
`,
    },
    {
      path: "POST /admin/menu/trigger-menu-sync-notification",
      caption: "10 · Downstream sync — Kafka fan-out so POS terminals + integrations reload",
      language: "http",
      code: `# After a successful import, the service publishes on the menu-sync Kafka
# topic keyed by (propertyId, menuIdsCsv). Downstream services subscribe:
#   • kayana-terminal-service  → refreshes on-device menu cache
#   • kayana-integration-service → re-syncs Deliverect / UrbanPiper
#   • kayana-cache-service     → invalidates the per-property menu cache
#
# The same broadcast can be re-triggered manually from the admin UI:

curl -X POST "https://api.kayana.io/admin/menu/trigger-menu-sync-notification\\
?property_id=PROP-7788" \\
  -H "Authorization: Bearer <admin_jwt>" \\
  -H "username: admin@kayana.io"

# → ServiceResponseBean
{
  "status":  true,
  "message": "Menu sync notification published"
}
`,
    },
  ],

  keyInsight: "Every entity layer streams into its own CSV inside a single ZipOutputStream, and import inverts that exactly — a depth-bounded BFS refuses cross-menu combo references before anything is written, then a 7-step saveAll rebuilds foreign keys with one oldId→newId map per layer. That's how a transactional move between environments stays both atomic and diffable.",

  requestTrace: [
    { phase: "EXPORT-CALL",     detail: "Admin selects menus → POST /export-as-zip with the menu IDs. Service walks menus → categories → items → addons → combo groups → combo items, mapping each layer through KayanaMenuUtils, writing each to its own CSV inside a ZipOutputStream." },
    { phase: "EXPORT-RESPOND",  detail: "ZIP bytes returned in ServiceResponseBean.fileBytes; trading name returned in message for the download filename; HTML description carries a human summary for the @LogActivity row." },
    { phase: "IMPORT-PARSE",    detail: "Multipart upload streams to /tmp. ZipInputStream walks entries by filename; OpenCSV with LowerCaseHeaderMappingStrategy deserialises each into a typed bean list." },
    { phase: "IMPORT-CHECK",    detail: "discoverMenuDependencies runs a depth-bounded BFS — if any combo_item or addon.linkedItem points to a menu not in the ZIP, the request is refused with a human-readable list of the missing menus." },
    { phase: "IMPORT-VALIDATE", detail: "validateMenus → validateCategories → validateItems → validateAddonCategories → validateAddons walks each layer at the target property and reports every duplicate identifier in one pass." },
    { phase: "IMPORT-SAVE",     detail: "Seven saveAll calls in dependency order. Each importLayer() generates new IDs, rewires FKs via its oldId→newId map, and (for addons) re-points linkedItem through the same map. Single @Transactional — failure rolls everything back." },
    { phase: "PUBLISH",         detail: "kayanaKafkaProducerSender.publishNotification(targetPropertyId, menuIds) — catalog cache, POS sync, and downstream consumers reconcile from the event." },
  ],

  constraintsLimitations: [
    "Cross-menu combo references must travel together in the same ZIP; the depth-bounded BFS refuses partial graphs rather than silently importing dangling references.",
  ],

  conclusion: "ZipOutputStream + OpenCSV is the entire portability story for the menu graph — export streams every layer to its own CSV, import inverts it with a depth-bounded BFS and a 7-step layered save that rewires foreign keys as it goes. Every mutation still hits the same JPA repos, the same @LogActivity audit aspect, and the same Kafka publisher.",
};
