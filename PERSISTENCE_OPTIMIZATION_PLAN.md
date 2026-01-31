# Session Persistence Optimization Plan

## 🎯 Ziel
Reduziere Save-Zeiten von ~500ms auf ~50ms für typische Änderungen.

---

## 📂 Neue Datei-Struktur

### **Vorher (Monolithisch):**
```
data/sessions/[id]/
  └── session.json (5-50 MB!)
```

### **Nachher (Granular):**
```
data/sessions/[id]/
  ├── meta.json          (~1 KB - name, url, timestamps)
  ├── state.json         (~100 bytes - view, tabs, UI state)
  ├── structure.json     (2-10 MB - crawl data, ändert sich SELTEN)
  ├── migration.json     (1-5 MB - migration plan)
  ├── design.json        (100-500 KB - design config)
  ├── specs/
  │   ├── component.json (500 KB - component library)
  │   ├── pages/
  │   │   ├── index.json
  │   │   ├── about.json
  │   │   └── ...
  │   └── optimized/
  │       ├── index.json
  │       └── ...
  └── assets/
      ├── custom_0.png
      └── ...
```

---

## 🚀 Performance-Gewinn

| **Operation** | **Vorher** | **Nachher** | **Speedup** |
|---------------|------------|-------------|-------------|
| Tab wechseln | 20 MB write (500ms) | 100 bytes (5ms) | **100x** |
| View ändern | 20 MB write | 100 bytes | **100x** |
| Migration Plan update | 20 MB write | 1-5 MB write (100ms) | **5x** |
| Session laden (nur Meta) | 20 MB parse | 1 KB parse | **20,000x** |
| Session laden (komplett) | 20 MB parse (500ms) | Paralleles Laden (200ms) | **2.5x** |

---

## 🔧 Implementierungs-Schritte

### **Phase 1: Split Critical Files** (2-3h)

1. **Refactor PersistenceService**
   ```typescript
   export const PersistenceService = {
     async saveState(id: string, state: UIState) {
       // Nur state.json updaten (~100 bytes)
       await fs.writeFile(`sessions/${id}/state.json`, JSON.stringify(state))
     },

     async saveStructure(id: string, structure: SiteStructure) {
       // Nur wenn sich structure ändert
       await fs.writeFile(`sessions/${id}/structure.json`, JSON.stringify(structure))
     },

     async saveMigration(id: string, plan: MigrationPlan) {
       await fs.writeFile(`sessions/${id}/migration.json`, JSON.stringify(plan))
     },

     // ... etc
   }
   ```

2. **Smart Auto-Save Logic**
   ```typescript
   // In page.tsx
   useEffect(() => {
     // Nur state.json updaten
     saveState(sessionId, { view, blueprintTab, mockupViewMode })
   }, [view, blueprintTab, mockupViewMode])

   useEffect(() => {
     // Nur structure.json updaten
     saveStructure(sessionId, structure)
   }, [structure])
   ```

### **Phase 2: Compression** (1h)

```typescript
import { gzip, gunzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

async function saveCompressed(path: string, data: any) {
  const json = JSON.stringify(data)
  const compressed = await gzipAsync(Buffer.from(json))
  await fs.writeFile(path + '.gz', compressed)
}

// Struktur: 10 MB → 1-2 MB (5-10x kleiner)
```

### **Phase 3: Versioning** (Optional, 2h)

```
data/sessions/[id]/
  ├── current/
  │   └── structure.json
  └── versions/
      ├── structure-v1.json
      ├── structure-v2.json
      └── ...
```

---

## 📈 Erwartete Verbesserungen

### **Durchschnittliche Save-Zeit:**
- **Vorher:** 500ms (20 MB JSON write)
- **Nachher:**
  - UI Change: 5ms (100 bytes)
  - Data Change: 50-100ms (1-5 MB)
  - Full Save: 200ms (parallel)

### **Disk Space:**
- **Vorher:** ~100-200 MB für 5 Sessions
- **Nachher:** ~20-40 MB (mit Compression)

### **Load Time:**
- **Vorher:** 500ms (parse 20 MB)
- **Nachher:**
  - Meta only: <1ms
  - Full load: 200ms (parallel)

---

## ⚠️ Migration Strategy

1. **Backwards Compatible**
   - Alte `session.json` weiterhin lesen
   - Beim ersten Save auf neue Struktur migrieren
   - Legacy-Dateien löschen nach erfolgreicher Migration

2. **Gradual Rollout**
   - Phase 1: Nur neue Sessions
   - Phase 2: Auto-Migration beim Laden
   - Phase 3: Cleanup alte Dateien

---

## 🎯 Quick Win: Nur Phase 1 implementieren

**Aufwand:** 2-3 Stunden
**Gewinn:** 10-100x schnellere Saves für UI-Änderungen

```typescript
// Minimal Change in persistence.ts
export const PersistenceService = {
  async saveSessionPartial(id: string, partial: {
    state?: UIState,
    structure?: SiteStructure,
    migration?: MigrationPlan,
    // ...
  }) {
    const dir = path.join(SESSIONS_DIR, id)
    await initDir(dir)

    if (partial.state) {
      await fs.writeFile(
        path.join(dir, 'state.json'),
        JSON.stringify(partial.state)
      )
    }

    if (partial.structure) {
      await fs.writeFile(
        path.join(dir, 'structure.json'),
        JSON.stringify(partial.structure)
      )
    }

    // ... etc
  }
}
```

---

## 💡 Bonus: IndexedDB für Browser State

Für Ultra-Performance: Browser-seitige State in IndexedDB cachen.

```typescript
// Keine Server-Requests für UI-Änderungen
await db.put('state', { view, blueprintTab })

// Nur alle 30s mit Server syncen
setInterval(() => syncWithServer(), 30000)
```

**Gewinn:** Instant UI, keine Latenz.
