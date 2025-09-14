import React, { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Legend, Tooltip,
} from "recharts";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./styles.css";

export default function App() {
  const STORAGE_KEY = "tm_premium_v4";
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");
  const [theme, setTheme] = useState(localStorage.getItem("tm_theme") || "light");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("tm_theme", theme);
    document.body.className = theme === "dark" ? "dark" : "";
  }, [theme]);

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function isOverdue(d) {
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt < today;
  }

  function addTask() {
    if (!text.trim()) return;
    setTasks([
      {
        id: uid(),
        text,
        due: due || null,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...tasks,
    ]);
    setText(""); setDue(""); setPriority("medium");
  }

  function toggleComplete(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function removeTask(id) {
    if (window.confirm("Delete this task?")) setTasks(tasks.filter(t => t.id !== id));
  }

  function startEdit(task) {
    setEditing(task);
    setText(task.text);
    setDue(task.due || "");
    setPriority(task.priority);
  }

  function saveEdit() {
    if (!editing) return;
    setTasks(tasks.map(t => t.id === editing.id ? { ...t, text, due, priority } : t));
    setEditing(null);
    setText(""); setDue(""); setPriority("medium");
  }

  function clearAll() { if (window.confirm("Clear all tasks?")) setTasks([]); }

  // Drag & Drop for tasks
  function onDragEnd(result) {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setTasks(items);
  }

  // Filters
  let list = tasks.filter(t => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    if (filter === "overdue") return t.due && isOverdue(t.due) && !t.completed;
    return true;
  });

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t => t.text.toLowerCase().includes(q) || (t.due || "").includes(q) || (t.priority || "").includes(q));
  }

  // Sorting
  if (sort === "priority") {
    const order = { high: 1, medium: 2, low: 3 };
    list.sort((a,b) => order[a.priority]-order[b.priority] || new Date(a.createdAt)-new Date(b.createdAt));
  } else if (sort === "due") {
    list.sort((a,b) => (a.due||"9999-12-31").localeCompare(b.due||"9999-12-31"));
  } else {
    list.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  }

  const total = tasks.length;
  const completed = tasks.filter(t=>t.completed).length;
  const overdue = tasks.filter(t=>t.due && isOverdue(t.due) && !t.completed).length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  // Pie chart data
  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: total - completed - overdue },
    { name: "Overdue", value: overdue }
  ];

  const COLORS_LIGHT = ["#60a5fa", "#fbbf24", "#ef4444"];
  const COLORS_DARK = ["#3b82f6", "#f59e0b", "#dc2626"];
  const chartColors = theme === "dark" ? COLORS_DARK : COLORS_LIGHT;
  const textColor = theme === "dark" ? "#f3f4f6" : "#1f2937";

  // Upcoming 7 days
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const [upcomingOrder, setUpcomingOrder] = useState(next7Days);

  function onUpcomingDragEnd(result) {
    if (!result.destination) return;
    const items = Array.from(upcomingOrder);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setUpcomingOrder(items);
  }

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <div className="logo">TM</div>
          <div>
            <div className="title">Task Manager — Premium</div>
            <div className="subtitle">React + Vite Version</div>
          </div>
        </div>

        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰ Menu</button>

        <div className="controls">
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(editing?saveEdit():addTask())} placeholder="Add a task..." className="input"/>
          <input type="date" value={due} onChange={e=>setDue(e.target.value)} />
          <select value={priority} onChange={e=>setPriority(e.target.value)}>
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          {editing?<button className="accent-btn" onClick={saveEdit}>Save</button>:<button className="accent-btn" onClick={addTask}>Add</button>}
          <select value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="default">Sort: Default</option>
            <option value="priority">Priority</option>
            <option value="due">Due date</option>
          </select>
        </div>
      </header>

      <main>
        <div className="panel">
          <div className="stats">
            <div className="stat-card"><div className="stat-title">Total</div><div className="stat-num">{total}</div></div>
            <div className="stat-card"><div className="stat-title">Completed</div><div className="stat-num">{completed}</div></div>
            <div className="stat-card"><div className="stat-title">Overdue</div><div className="stat-num">{overdue}</div></div>
          </div>

          <div className="task-controls">
            <div className="filters">
              {["all","pending","completed","overdue"].map(f=>(
                <button key={f} className={`filter-btn ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f[0].toUpperCase()+f.slice(1)}</button>
              ))}
            </div>
            <div className="search center">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..." />
            </div>
          </div>

          <div className="panel" style={{padding:"10px 12px"}}>
            <div className="progress" style={{height:"18px", borderRadius:"12px"}}>
              <div style={{height:"100%", width:progress+"%", background:"linear-gradient(90deg,#60a5fa,#7c3aed)", transition:"width 0.8s ease-in-out"}}></div>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
              <small className="muted">Progress</small><small className="muted">{progress}%</small>
            </div>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tasks">
              {(provided)=>(
                <div className="task-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {list.map((t,index)=>(
                    <Draggable key={t.id} draggableId={t.id} index={index}>
                      {(provided)=>(
                        <article className="task-card" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <div className="left-check"><input type="checkbox" checked={t.completed} onChange={()=>toggleComplete(t.id)} /></div>
                          <div className="task-main">
                            <div className="task-title">
                              <span style={{textDecoration:t.completed?"line-through":""}}>{t.text}</span>
                              <span className={`badge ${t.priority==="high"?"priority-high":t.priority==="medium"?"priority-medium":"priority-low"}`}>{t.priority.toUpperCase()}</span>
                            </div>
                            <div className="meta">
                              {t.due && <span className={`task-due ${isOverdue(t.due)&&!t.completed?"overdue":""}`}>📅 {t.due}</span>}
                              <small>Added: {new Date(t.createdAt).toLocaleString()}</small>
                            </div>
                          </div>
                          <div className="task-actions">
                            <button className="icon-btn" onClick={()=>startEdit(t)}>✏️</button>
                            <button className="icon-btn" onClick={()=>removeTask(t.id)}>🗑️</button>
                          </div>
                        </article>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Pie Chart */}
          <div className="panel" style={{marginTop:20}}>
            <h4 style={{marginBottom:10}}>Task Overview</h4>
            <PieChart width={250} height={250}>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{fill:textColor}} isAnimationActive={true} animationDuration={800}>
                {pieData.map((entry,index)=><Cell key={`cell-${index}`} fill={chartColors[index%chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{backgroundColor:theme==="dark"?"#1f2937":"#fff", color:textColor}} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{color:textColor}}/>
            </PieChart>
          </div>

          {/* Upcoming Tasks Interactive Chart */}
          <div className="panel" style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Upcoming Tasks (Next 7 Days)</h4>
            <DragDropContext onDragEnd={onUpcomingDragEnd}>
              <Droppable droppableId="upcomingChart" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ display: "flex", justifyContent: "space-between", overflowX:"auto" }}
                  >
                    {upcomingOrder.map((date, index) => {
                      const count = tasks.filter(t => t.due === date && !t.completed).length;
                      return (
                        <Draggable key={date} draggableId={date} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                textAlign: "center",
                                margin: "0 4px",
                                cursor: "grab",
                                minWidth: 40,
                                ...provided.draggableProps.style
                              }}
                            >
                              <div style={{
                                backgroundColor: theme==="dark"?"#60a5fa":"#3b82f6",
                                width: 30,
                                height: count*25 || 10,
                                borderRadius:6,
                                transition:"height 0.3s"
                              }}></div>
                              <small style={{color:textColor}}>{date.slice(5)}</small>
                              <div style={{color:textColor}}>{count}</div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

        </div>
      </main>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>Theme</div>
          <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="filter-btn">
            {theme==="dark"?"☀️ Light":"🌙 Dark"}
          </button>
          <button onClick={clearAll} className="filter-btn">Clear all</button>
          <button onClick={()=>setSidebarOpen(false)} className="filter-btn" style={{marginTop:10}}>Close</button>
        </div>
      </aside>
    </div>
  );
}
