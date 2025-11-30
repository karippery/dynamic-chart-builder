

## **Core Goal**  
Enable non-technical users (safety leads, supervisors) to **define, explore, and act on custom safety KPIs**—not just view static reports.  


## **Dashboard Structure – 3 Preset Tabs + Full Builder Flexibility**

 **Important**: Each tab is a **starting point**, but the user can **modify any parameter** and **save as new preset**.

### **Tab 1: Aggregate – “Operational Baseline”**  
*What’s normal? What’s changing?*

- **Top Cards**:  
  - Active Humans (unique IDs, last 5 min)  
  - Active Vehicles (unique IDs)  
  - Detection Volume (last hour)  
  - **Vest Compliance %** (not just violations)

- **Metric Selector**:  
  `Count` | `Unique IDs` | `Rate per hour`

- **Main Chart**:  
  Line/Area: Humans & Vehicles over time (respects **Time Granularity**)

- **Table**:  
  Latest detections (for data validation)

---

### **Tab 2: Close Calls – “Near-Miss Intelligence”**  
*Where are collisions almost happening?*

- **Top Cards**:  
  - Close Calls (last hour)  
  - **Near-Miss Rate** (close calls per 100 vehicle-minutes) ← **critical normalization**  
  - Worst Zone (by density, not count)  
  - Repeat Offender Asset (ID with most close calls)

- **Dynamic Controls**:  
  - **Distance Threshold Slider** (1.0m – 3.0m)  
  - **Toggle**: Count vs. Density Mode

- **Main Chart**:  
  Bar/Line: Close calls over time (grouped by hour/shift)

- **Table**:  
  Top offenders: Human ID, Vehicle ID, Close Calls, Exposure-Adjusted Rate

---

### **Tab 3: Safety Violations – “Rule Compliance”**  
*Who’s at risk—and why?*

- **Top Cards**:  
  - Vest Violations (count + **unique humans**)  
  - Overspeed Events (count + **unique vehicles**)  
  - Vest Compliance %  
  - Avg. Overspeed Excess

- **Dynamic Controls**:  
  - **Speed Threshold Slider** (1.0–2.5 m/s)  
  - **Metric Selector**: `Count` | `%` | `Unique IDs` | `Rate per hour`

- **Main Chart**:  
  Grouped bar: Violations by zone or hour

- **Table**:  
  Repeat offenders: ID, Type, Total Events, Rate, Avg. Excess

---

## **Global Controls (Always Visible)**

| Control | Options | Business Value |
|--------|--------|----------------|
| **Time Range** | Last 1h / 4h / 8h / 24h / 7d / Custom | Compare shifts, days, incidents |
| **Zones** | Multi-select from `area` + **user-defined rectangles** | Focus on Loading Dock, Aisle 5, etc. |
| **Classes** | `human`, `vehicle`, `pallet_truck`, `agv` (multi-select) | Filter out irrelevant assets |
| **Time Granularity** | 1m / 5m / 15m / 1h / 1d | Match analysis to operational rhythm |
| **Presets** | “Save View” / “Load Preset” | Enable team-wide sharing (“Use Night Shift Template”) |

---

##  **Smart Metrics – Beyond Raw Counts**

| Raw Metric | **Upgraded Metric** | Why It Matters |
|-----------|--------------------|----------------|
| Total close calls | **Close calls per vehicle-minute** | Fair comparison across shifts |
| Vest violations | **Unique humans without vest** | Is it 10 people once, or 1 person 10 times? |
| Overspeed events | **Avg. excess speed** | Severity matters |
| Human detections | **Unique human IDs** | Avoid double-counting same person |



