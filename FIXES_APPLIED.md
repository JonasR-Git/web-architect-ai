# Angewendete Fixes - 2026-01-30

## ✅ Bereits implementiert

### 1. Typo Fix: `compareClusterst` → `compareClusters`
**Datei:** `src/modules/analysis/services/content-similarity-analyzer.ts`
**Zeilen:** 98, 183
**Status:** ✅ ERLEDIGT

**Änderungen:**
```typescript
// Zeile 98: Methodenname korrigiert
static compareClusters(profile1, profile2) { ... }

// Zeile 183: Aufruf korrigiert
const rec = this.compareClusters(profiles[i], profiles[j]);
```

---

### 2. Migration Plan Validation & Auto-Fix
**Datei:** `src/modules/core/ai-service.ts`
**Zeilen:** 401-403 (Integration), 762-843 (Helper-Methoden)
**Status:** ✅ ERLEDIGT

**Neue Funktionalität:**

#### A. Integration in `generateMigrationPlan()` (Zeile 401-403)
```typescript
const plan = await this.callAI(messages, AI_MODELS.migration, `Migration Plan(Tier ${tier})`);

// VALIDATION & AUTO-FIX: Ensure pattern_mapping exists and is correct
this.validateAndFixMigrationPlan(plan);

return plan;
```

#### B. Validierungs-Methode (Zeile 762-800)
```typescript
private validateAndFixMigrationPlan(plan: any): void {
    // 1. pattern_mapping existiert?
    if (!plan.pattern_mapping || plan.pattern_mapping.length === 0) {
        plan.pattern_mapping = this.generatePatternMappingFromPageMapping(plan.page_mapping || []);
    }

    // 2. [slug] fehlt in target_base?
    plan.pattern_mapping = plan.pattern_mapping.map(pm => {
        if ((pm.pattern.includes('[item]') || pm.pattern.includes('[slug]')) &&
            !pm.target_base.includes('[')) {

            const basePath = pm.target_base.replace(/\/$/, '');
            pm.target_base = `${basePath}/[slug]`;
        }
        return pm;
    });

    // 3. Trailing Slashes entfernen (außer /)
    plan.page_mapping = plan.page_mapping.map(pm => {
        if (pm.new_path && pm.new_path !== '/' && pm.new_path.endsWith('/')) {
            pm.new_path = pm.new_path.replace(/\/$/, '');
        }
        return pm;
    });
}
```

#### C. Auto-Generator für pattern_mapping (Zeile 802-843)
```typescript
private generatePatternMappingFromPageMapping(pageMapping: any[]): any[] {
    const patternMap = new Map<string, any>();

    pageMapping.forEach(pm => {
        // Erkennt Patterns wie /blog/[item]
        if (pm.old_url && (pm.old_url.includes('[item]') || pm.old_url.includes('[slug]'))) {
            let targetBase = pm.new_path || pm.old_url;

            // Fügt [slug] hinzu wenn fehlend
            if (!targetBase.includes('[')) {
                targetBase = targetBase.replace(/\/$/, '') + '/[slug]';
            }

            patternMap.set(pm.old_url, {
                pattern: pm.old_url,
                target_base: targetBase,
                action: pm.action || 'redirect',
                type: pm.type || 'page',
                reason: pm.reason || 'Auto-generated from page_mapping'
            });
        }
    });

    return Array.from(patternMap.values());
}
```

**Was wird gefixt:**
- ✅ Fehlende `pattern_mapping` wird automatisch aus `page_mapping` generiert
- ✅ Fehlende `[slug]` werden in `target_base` ergänzt (z.B. `/insights/` → `/insights/[slug]`)
- ✅ Trailing Slashes werden entfernt (z.B. `/services/` → `/services`)

**Beispiel-Transformation:**

**Vorher (AI Output):**
```json
{
  "page_mapping": [
    {
      "old_url": "/blog/[item]",
      "new_path": "/insights/",
      "action": "merge"
    }
  ]
}
```

**Nachher (Nach Validation):**
```json
{
  "page_mapping": [
    {
      "old_url": "/blog/[item]",
      "new_path": "/insights",
      "action": "merge"
    }
  ],
  "pattern_mapping": [
    {
      "pattern": "/blog/[item]",
      "target_base": "/insights/[slug]",
      "action": "merge",
      "type": "page",
      "reason": "Auto-generated from page_mapping"
    }
  ]
}
```

---

## 📊 Erwartete Verbesserungen

### Vorher (migration-mapping (4).json)
```json
{
  "mapping": [
    {
      "old_url": "/blog/[item]",
      "new_path": "/insights/",  // ❌ Fehlt [slug]!
      "action": "merge"
    },
    {
      "old_url": "/news/[item]",
      "new_path": "/insights/",  // ❌ Fehlt [slug]!
      "action": "merge"
    },
    {
      "old_url": "/services/[item]",
      "new_path": "/services/",  // ❌ Fehlt [slug]!
      "action": "redirect"
    }
  ]
  // ❌ Kein pattern_mapping!
}
```

### Nachher (Mit Auto-Fix)
```json
{
  "page_mapping": [
    {
      "old_url": "/blog/[item]",
      "new_path": "/insights",  // ✅ Trailing Slash entfernt
      "action": "merge"
    },
    {
      "old_url": "/news/[item]",
      "new_path": "/insights",  // ✅ Trailing Slash entfernt
      "action": "merge"
    },
    {
      "old_url": "/services/[item]",
      "new_path": "/services",  // ✅ Trailing Slash entfernt
      "action": "redirect"
    }
  ],
  "pattern_mapping": [  // ✅ Auto-generiert!
    {
      "pattern": "/blog/[item]",
      "target_base": "/insights/[slug]",  // ✅ [slug] hinzugefügt
      "action": "merge",
      "type": "page",
      "reason": "Auto-generated from page_mapping"
    },
    {
      "pattern": "/news/[item]",
      "target_base": "/insights/[slug]",  // ✅ [slug] hinzugefügt
      "action": "merge",
      "type": "page",
      "reason": "Auto-generated from page_mapping"
    },
    {
      "pattern": "/services/[item]",
      "target_base": "/services/[slug]",  // ✅ [slug] hinzugefügt
      "action": "redirect",
      "type": "page",
      "reason": "Auto-generated from page_mapping"
    }
  ]
}
```

---

## 🔄 Noch zu implementieren (Priorität)

### Fix 3: Auto-Clustering reaktivieren (HOCH)
**Datei:** `src/modules/core/utils/grouping.ts`
**Zeilen:** 64-79

**Problem:** Ohne `forceArchetypes` werden ALLE Seiten als `uniquePages` klassifiziert.

**Lösung:** Auto-Detection-Logik hinzufügen (siehe COMPLETE_FLOW_ANALYSIS.md)

---

### Fix 4: Sprachvarianten VOR Normalisierung (MITTEL)
**Datei:** `src/app/actions.ts`
**Zeilen:** 111-112

**Problem:** `semanticMerges` muss manuell definiert werden.

**Lösung:**
```typescript
// 1. Detect variants FIRST
if (!semanticMerges || semanticMerges.merges.length === 0) {
    const { detectAndLinkVariants } = await import('@/modules/core/utils/normalization');
    structureWithVariants = await detectAndLinkVariants(structure);
    semanticMerges = buildSemanticMergesFromVariants(structureWithVariants);
}

// 2. Then normalize
const normalizedStructure = normalizeStructureToConcepts(structureWithVariants, semanticMerges);
```

---

### Fix 5: Coverage-Validierung (MITTEL)
**Datei:** `src/modules/analysis/services/mapping-validator.ts` (NEU)

**Funktion:** Prüft, ob alle Quell-URLs gemappt sind.

**Status:** Siehe Plan-Datei für vollständige Implementierung.

---

## 🧪 Test-Szenario

**Test mit ganztags.net:**

1. **Crawl** durchführen
2. **Migration Plan** generieren
3. **Erwartung:**
   - ✅ `pattern_mapping` existiert
   - ✅ Alle Targets haben `[slug]` wo nötig
   - ✅ Keine Trailing Slashes (außer `/`)

**Console Output:**
```
[MigrationAction] Triggered
✅ [Migration Plan(Tier 0)] COMPLETE in 45.2 s
✅ [MigrationPlan] Auto-generated 3 pattern mappings
⚠️ [MigrationPlan] Fixing missing [slug] in /blog/[item] → /insights
⚠️ [MigrationPlan] Fixing missing [slug] in /news/[item] → /insights
⚠️ [MigrationPlan] Fixing missing [slug] in /services/[item] → /services
```

---

## 📋 Checkliste

- [x] Typo `compareClusterst` → `compareClusters` gefixt
- [x] Migration Plan Validation implementiert
- [x] Auto-Generation für fehlende `pattern_mapping`
- [x] Auto-Fix für fehlende `[slug]` in `target_base`
- [x] Trailing Slash Normalisierung
- [ ] Auto-Clustering reaktivieren
- [ ] Sprachvarianten-Detection integrieren
- [ ] Coverage-Validierung implementieren
- [ ] Mit ganztags.net testen

---

**Erstellt:** 2026-01-30
**Status:** 2/5 Fixes implementiert, 3 ausstehend
