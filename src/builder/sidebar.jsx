/* ============================================================
   Course Builder — Sidebar navigation
   ============================================================ */

function Sidebar({ course, currentView, completed, editing, onNavigate,
                   onAddLesson, onAddSection, onRename, onDelete, onReorder,
                   progressPct, doneCount, totalLessons, onToggleEdit, onImport }) {
  const [renaming, setRenaming] = useState(null);
  const [tmp, setTmp] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  function startRename(item) { setRenaming(item.id); setTmp(item.title); }
  function commitRename() {
    if (renaming) onRename(renaming, tmp.trim() || 'Untitled');
    setRenaming(null);
  }

  function onDrop(targetId) {
    if (dragId && dragId !== targetId) onReorder(dragId, targetId);
    setDragId(null); setOverId(null);
  }

  let lessonNum = 0;
  return (
    <React.Fragment>
      <aside className="sidebar">
        <div className="sidebar__head">
          {course.meta.logo
            ? <img className="sidebar__logo" src={course.meta.logo} alt="" />
            : <img className="sidebar__logo" src="brand/sutherland-mark-white.png" alt="Sutherland" />}
          <button className="sidebar__home" onClick={() => onNavigate({ type: 'cover' })}>
            <span className="sidebar__title" dangerouslySetInnerHTML={{ __html: course.meta.title }}></span>
            <span className="sidebar__sub">Course home</span>
          </button>
        </div>

        <div className="sidebar__progress">
          <div className="sidebar__ptrack"><div className="sidebar__pfill" style={{ width: progressPct + '%' }}></div></div>
          <div className="sidebar__pmeta"><span>{progressPct}% complete</span><span>{doneCount} / {totalLessons} lessons</span></div>
        </div>

        <nav className="lessonlist">
          {course.lessons.map((item) => {
            if (item.kind === 'section') {
              return (
                <div className="navsection" key={item.id}
                  draggable={editing} onDragStart={() => setDragId(item.id)}
                  onDragOver={(e) => { e.preventDefault(); setOverId(item.id); }}
                  onDrop={() => onDrop(item.id)}>
                  {renaming === item.id ? (
                    <input className="nav-rename" autoFocus value={tmp}
                      onChange={(e) => setTmp(e.target.value)} onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); }} />
                  ) : (
                    <React.Fragment>
                      <span style={{ flex: 1 }}>{item.title}</span>
                      {editing && (
                        <span className="navsection__edit">
                          <button className="navitem__drag" style={{ opacity: .7, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }} onClick={() => startRename(item)} aria-label="Rename"><Icon name="edit" size={13} /></button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, opacity: .7 }} onClick={() => onDelete(item.id)} aria-label="Delete"><Icon name="trash" size={13} /></button>
                        </span>
                      )}
                    </React.Fragment>
                  )}
                </div>
              );
            }
            lessonNum++;
            const isActive = currentView.type === 'lesson' && currentView.id === item.id;
            const isDone = completed[item.id];
            return (
              <div key={item.id}
                draggable={editing && renaming !== item.id}
                onDragStart={() => setDragId(item.id)}
                onDragOver={(e) => { e.preventDefault(); setOverId(item.id); }}
                onDrop={() => onDrop(item.id)}
                className={overId === item.id && dragId !== item.id ? 'dragover' : ''}>
                <div className={'navitem' + (isActive ? ' is-active' : '') + (isDone ? ' is-done' : '') + (dragId === item.id ? ' dragging' : '')}
                  role="button" tabIndex={0}
                  onClick={() => renaming !== item.id && onNavigate({ type: 'lesson', id: item.id })}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && renaming !== item.id) { e.preventDefault(); onNavigate({ type: 'lesson', id: item.id }); } }}>
                  <span className="navitem__check">{isDone && <Icon name="check" size={13} />}</span>
                  {renaming === item.id ? (
                    <input className="nav-rename" autoFocus value={tmp}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setTmp(e.target.value)} onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); }} />
                  ) : (
                    <span className="navitem__label">{item.title}</span>
                  )}
                  {editing && renaming !== item.id && (
                    <React.Fragment>
                      <button className="navitem__drag" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }} onClick={(e) => { e.stopPropagation(); startRename(item); }} aria-label="Rename"><Icon name="edit" size={14} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: .6 }} onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} aria-label="Delete"><Icon name="trash" size={14} /></button>
                    </React.Fragment>
                  )}
                </div>
              </div>
            );
          })}

          {editing && (
            <div className="sidebar__addrow">
              <button className="sidebar__addbtn" onClick={onAddLesson}><Icon name="plus" size={14} /> Lesson</button>
              <button className="sidebar__addbtn" onClick={onAddSection}><Icon name="section" size={14} /> Section</button>
            </div>
          )}
          {editing && (
            <div className="sidebar__importrow">
              <button className="sidebar__importbtn" onClick={onImport}>
                <Icon name="upload" size={14} /> Import outline
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar__foot">
          <button className={'edittoggle' + (editing ? ' on' : '')} onClick={onToggleEdit}>
            <span className="edittoggle__left"><Icon name={editing ? 'edit' : 'eye'} size={16} /> {editing ? 'Editing' : 'Author mode'}</span>
            <span className="edittoggle__sw"></span>
          </button>
        </div>
      </aside>
      <div className="sidebar__scrim" onClick={() => document.body.classList.remove('nav-open')}></div>
    </React.Fragment>
  );
}

Object.assign(window, { Sidebar });


export {}; // marks this file as an ES module for Vite
