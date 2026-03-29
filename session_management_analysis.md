# Technical Analysis: Session Consistency and State Recovery in SyncBoard

This document outlines the mechanisms used to maintain a consistent state across collaborative whiteboard sessions and evaluates the impact of data serialization and buffering on real-time performance.

---

## 1. Session Consistency and State Recovery Mechanism

To ensure that new users joining a session see the same drawing state as existing participants, SyncBoard implements a **Centralized Event-Log Pattern**.

### Architectural Flow
1.  **State Persistence**: The backend server maintains an in-memory `Room` object for each active session. This object contains a `history` array—a sequential log of every drawing event (`draw`, `clear`) that has occurred since the room was created.
2.  **Joining Process**: When a new client initiates a WebSocket connection and joins a room, it receives an immediate `init` payload from the server.
3.  **State Recovery (Replay)**:
    *   The `init` message contains the entire `history` array.
    *   The client-side `Whiteboard` component iterates through this array.
    *   For each event, it invokes the local drawing logic (`drawOnCanvas`) with the `emit` flag set to `false` (to prevent infinite loops).
    *   This effectively "replays" the entire session history in milliseconds, synchronizing the new client's canvas with the current global state.

### Consistency Guarantee
Synchronization is achieved through **Ordered Reliable Delivery**. Since WebSockets use TCP, the order of events is guaranteed. Every client processes the exact same sequence of events, ensuring a consistent visual state across all devices.

---

## 2. Performance Analysis: Data Serialization and Buffering

Real-time collaboration requires high responsiveness. Our analysis identifies how data handling affects latency and throughput.

### Data Serialization: JSON vs. Binary
Currently, SyncBoard uses **JSON Serialization** for all messages.

| Feature | JSON (Current) | Binary (Optimized - e.g., Protobuf/MsgPack) |
| :--- | :--- | :--- |
| **Payload Size** | High (Verbose keys like `"color"`, `"size"`) | Low (Compact, no redundant keys) |
| **Processing Power** | Moderate (Native `JSON.parse` is fast) | Low (Bit-level operations) |
| **Readability** | High (Easy to debug in Network tab) | Low (Requires decoding tools) |

**Impact**: Using JSON at 60Hz drawing frequencies increases bandwidth consumption. On high-latency or restricted networks, this can lead to "drawing lag" where strokes appear seconds after they were made.

### Buffering and Throttling
1.  **Client-Side Throttling**:
    *   *Issue*: Modern mice and touchscreens produce events at 125Hz to 1000Hz. Sending a WebSocket packet for every pixel change is inefficient.
    *   *Observation*: The current implementation sends events immediately on `mousemove`. This results in high packet overhead.
    *   *Optimization*: Implementing a **16ms (60FPS) throttle** or **Path Batching** (sending a sequence of points in one message) would significantly reduce the number of TCP segments sent.

2.  **Network Buffering (TCP/IP Level)**:
    *   **Nagle’s Algorithm**: By default, many TCP stacks buffer small packets to combine them (Nagle's Algorithm). While this improves throughput, it introduces **latency**, which is detrimental to whiteboard "feel." 
    *   **State Recovery Scalability**: As the session duration increases, the `history` array grows. For extremely long sessions, sending the entire history in one `init` message may cause a noticeable hang upon joining. 
    *   *Mitigation*: Implement **Canvas Snapshots** (storing a base64 image of the current state) and only sending the history *since* the last snapshot.

### Summary of Performance Findings
- **Real-Time Performance**: Dominated by packet frequency. Throttling is the most effective way to reduce server load.
- **Join Speed**: Dominated by serialization efficiency and array size. For large sessions, JSON overhead becomes a bottleneck for the initial sync.
- **Reliability**: TCP ensures no "holes" in the drawing strokes, but at the cost of potential "head-of-line blocking" if a single packet is lost.

---
