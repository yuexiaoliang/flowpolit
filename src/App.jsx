import {useEffect,useRef,useState} from 'react';
import {ArrowClockwise,ArrowLeft,ArrowRight,ArrowUp,Brain,CaretDown,CaretRight,Check,CheckCircle,CircleNotch,ChatCircleText,Clock,DotsThree,Globe,Link,List,Minus,Pause,Play,Plus,PuzzlePiece,Sparkle,TerminalWindow,TextB,TextItalic,TextUnderline,X} from '@phosphor-icons/react';
import {localDate,nextOccurrence,nextLabel,parseSchedule,scheduleLabel,stripSchedulePrefix} from './schedule.mjs';
import {advanceTask,applyGoalCommand,confirmLogin,createTask,needsLogin as requiresLogin,pauseTask,resumeTask,setTaskSchedule,startRun,stopTask,taskStatus,tickTasks} from './task-model.mjs';

function restoreTask(item){
  if(item.events)return item;
  const desired=item.stage??(item.status==='已完成'?4:item.id.startsWith('task-')?0:2);
  let task=createTask(item.goal,null,new Date(),{...item,stage:0,status:'进行中',hasRun:true});
  for(let stage=1;stage<=desired;stage++)task=advanceTask(task,stage);
  if(item.history?.length)task.events=[...item.history.map((e,i)=>({...e,id:e.id+'-old-'+i})),...task.events];
  return {...task,status:item.status,paused:item.status==='已暂停'};
}
function seedTasks(){
  const schedule={repeat:'weekly',day:1,time:'09:00',enabled:true,skipDates:[]};schedule.nextAt=nextOccurrence(schedule);
  return [restoreTask({id:'article',name:'发布文章',goal:'把文章发布到创作中心',site:'创作中心',status:'进行中',updated:'刚刚',aiTrace:true}),restoreTask({id:'report',name:'整理本周行业动态',goal:'收集行业动态并整理为摘要',site:'资讯网站',status:'已完成',updated:'昨天',aiTrace:true,schedule}),restoreTask({id:'format',name:'检查文章格式',goal:'按已保存的步骤核对文章格式',site:'创作中心',status:'进行中',updated:'周一',aiTrace:false})];
}
const phaseLabels=['查找目标平台','打开平台并检查登录','识别字段并填写','核对结果','任务完成'];
function Brand({compact=false}){return <span className={'brand '+(compact?'compact':'')}><span className="brand-mark"><Sparkle size={16} weight="fill"/></span><span>Flow Pilot</span></span>}

function ScheduleEditor({schedule,onSave,onClose}){
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
  const [draft,setDraft]=useState(schedule||{repeat:'daily',time:'09:00',day:1,date:localDate(tomorrow),enabled:true,skipDates:[]});
  const ref=useRef(null);const next=nextOccurrence(draft);const change=(key,value)=>setDraft(d=>({...d,[key]:value,skipDates:[]}));
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
  return <dialog className="schedule-dialog" ref={ref} onCancel={e=>{e.preventDefault();onClose()}} aria-labelledby="schedule-title"><form onSubmit={e=>{e.preventDefault();if(draft.enabled&&!next)return;onSave({...draft,nextAt:next});onClose()}}>
    <div className="schedule-dialog-head"><span><Clock size={18}/> <strong id="schedule-title">定时任务</strong></span><button type="button" aria-label="关闭定时设置" onClick={onClose}><X size={18}/></button></div>
    <label className="schedule-field">重复规则<select value={draft.repeat} onChange={e=>change('repeat',e.target.value)}><option value="once">仅一次</option><option value="daily">每天</option><option value="workdays">工作日</option><option value="weekly">每周</option></select></label>
    <div className="schedule-field-row"><label className="schedule-field">运行时间<input type="time" required value={draft.time} onInput={e=>change('time',e.currentTarget.value)} onChange={e=>change('time',e.target.value)}/></label>{draft.repeat==='once'&&<label className="schedule-field">日期<input type="date" required min={localDate()} value={draft.date} onInput={e=>change('date',e.currentTarget.value)} onChange={e=>change('date',e.target.value)}/></label>}{draft.repeat==='weekly'&&<label className="schedule-field">星期<select value={draft.day} onChange={e=>change('day',Number(e.target.value))}>{['日','一','二','三','四','五','六'].map((d,i)=><option value={i} key={i}>周{d}</option>)}</select></label>}</div>
    <label className="schedule-enabled"><input type="checkbox" checked={draft.enabled} onChange={e=>change('enabled',e.target.checked)}/><span>启用后续定时</span></label>
    <div className="schedule-preview"><strong>{draft.enabled&&next?nextLabel({...draft,nextAt:next}):draft.enabled?'请选择未来的运行时间':'后续定时已停用'}</strong><small>按本机时区运行；应用窗口打开时触发。关闭或休眠期间错过的运行会跳过。</small></div>
    <div className="schedule-dialog-actions"><button className="outline" type="button" onClick={onClose}>取消</button><button className="publish" type="submit" disabled={draft.enabled&&!next}>保存定时</button></div>
  </form></dialog>;
}

function Home({tasks,onOpen,onCreate,onSchedule}){
  const [goal,setGoal]=useState(''),[draft,setDraft]=useState(null),[editing,setEditing]=useState(null),[filter,setFilter]=useState('all'),[error,setError]=useState(''); const ref=useRef(null);
  const inferred=parseSchedule(goal)?.schedule, schedule=draft||inferred;
  const shown=tasks.filter(t=>filter==='all'||t.schedule);
  const submit=e=>{e.preventDefault();if(!goal.trim())return ref.current?.focus();if(schedule?.enabled&&!nextOccurrence(schedule)){setError('请选择未来的运行时间');return}onCreate(schedule?stripSchedulePrefix(goal.trim()):goal.trim(),schedule);setGoal('');setDraft(null)};
  return <div className="home"><header className="home-head"><Brand/><span>让网页任务顺畅完成</span></header><main className="home-main">
    <div className="home-intro"><span className="intro-icon"><Sparkle size={18} weight="fill"/></span><h1>你想让网页帮你做什么？</h1><p>描述目标，Flow Pilot 会打开网页，边分析边执行。</p></div>
    <form className="composer" onSubmit={submit}><label className="sr-only" htmlFor="goal">输入任务目标</label><textarea id="goal" ref={ref} value={goal} onChange={e=>{setGoal(e.target.value);setError('')}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(e)}}} placeholder="例如：每天早上9点整理行业动态…" rows="2"/><div className="composer-foot"><button className={'composer-clock '+(schedule?'selected':'')} type="button" onClick={()=>setEditing('draft')}><Clock size={16}/>{schedule?scheduleLabel(schedule):'设置定时'}</button><span>{schedule?nextLabel(schedule):'用一句话开始，之后可以随时调整'}</span><button className="composer-send" type="submit" aria-label={schedule?'创建定时任务':'创建任务'}><ArrowUp size={18} weight="bold"/></button></div>{error&&<p className="schedule-error" role="alert">{error}</p>}</form>
    <section className="tasks"><div className="tasks-head"><h2>我的任务</h2><div className="task-filters"><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>全部</button><button aria-pressed={filter==='scheduled'} onClick={()=>setFilter('scheduled')}>定时</button><span>{shown.length} 个任务</span></div></div><div className="task-list">{shown.map(t=><div className="task-row" key={t.id}><button className="task-main" onClick={()=>onOpen(t.id)}><span className="task-icon">{t.schedule?<Clock size={19}/>:t.status==='已完成'?<Check size={18}/>:<Globe size={19}/>}</span><span className="task-text"><strong>{t.name}</strong><small>{t.goal}</small></span><span className={'task-status '+(t.status==='进行中'?'active':'')}><i/>{taskStatus(t)}</span>{!t.schedule&&<span className="task-time">{t.updated}</span>}<CaretRight size={16}/></button>{t.schedule&&<button className="list-schedule" aria-label={`修改 ${t.name} 的定时`} onClick={()=>setEditing(t.id)}><span><Clock size={13}/>{scheduleLabel(t.schedule)}</span><small>{nextLabel(t.schedule)}</small></button>}</div>)}{!shown.length&&<p className="task-empty">还没有定时任务，在上方描述目标和时间即可创建。</p>}</div></section>
  </main>{editing&&<ScheduleEditor schedule={editing==='draft'?schedule:tasks.find(t=>t.id===editing)?.schedule} onClose={()=>setEditing(null)} onSave={value=>editing==='draft'?setDraft(value):onSchedule(editing,value)}/>}</div>;
}

function Editor({stage,stopped,paused,onPublish,title,setTitle,siteName}){
  const [summary,setSummary]=useState(''); const [preview,setPreview]=useState(false); const bodyRef=useRef(null);
  const [body,setBody]=useState('过去一年，AI 已经从一个新鲜的概念，快速走进了我们的工作与生活。无论是写作、编程，还是数据分析、创意设计，AI 工具都在帮助越来越多的人省下时间。\n\n我认为，与其把注意力放在“被取代的风险”上，不如思考如何借助 AI 放大自己的能力。AI 的真正价值，不是替代人，而是让普通人拥有以前只有专业人才才具备的能力。关键在于，我们是否愿意持续学习、积极尝试，并在实践中找到适合自己的方法。\n\n一、理解 AI 的能力边界\n\nAI 很强大，但并不是万能的。它擅长处理信息、生成内容、提高效率，但在复杂判断、情感理解和长期规划等方面，仍然需要人的参与。\n\n二、培养不可替代的能力\n\n在 AI 时代，以下几种能力将变得更加重要：\n1. 批判性思维：能够独立思考，辨别信息的真伪。\n2. 跨领域学习能力：快速掌握新工具、新知识。\n3. 沟通与协作能力：与 AI 和他人高效合作。\n4. 创造力：提出独特的观点和解决方案。');
  useEffect(()=>{if(bodyRef.current){bodyRef.current.style.height='auto';bodyRef.current.style.height=Math.max(570,bodyRef.current.scrollHeight+8)+'px'}},[body,preview]);
  return <div className="site"><nav className="site-nav"><div><span className="demo-logo">{siteName==='创作中心'?'知间':siteName}</span><a className="sel" href="#editor" onClick={e=>e.preventDefault()}>创作中心</a><a href="#editor" onClick={e=>e.preventDefault()}>文章管理</a><a href="#editor" onClick={e=>e.preventDefault()}>数据分析</a><a href="#editor" onClick={e=>e.preventDefault()}>收益管理</a></div><span className="avatar">林</span></nav><div className="site-page"><div className="sheet"><textarea className="article-title" aria-label="文章标题" value={title} onChange={e=>setTitle(e.target.value)} rows={1}/><input className="article-summary" aria-label="文章摘要" placeholder="添加摘要（选填）" value={summary} onChange={e=>setSummary(e.target.value)}/><div className="toolbar"><span>正文 <CaretDown size={13}/></span><i/><button aria-label="加粗"><TextB size={18}/></button><button aria-label="斜体"><TextItalic size={18}/></button><button aria-label="下划线"><TextUnderline size={18}/></button><i/><button aria-label="列表"><List size={18}/></button><button aria-label="插入链接"><Link size={18}/></button><i/><button aria-label="更多排版"><DotsThree size={19}/></button></div>{preview?<div className="article-preview"><h2>{title}</h2>{body.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}</div>:<textarea ref={bodyRef} className="article-body" value={body} onChange={e=>setBody(e.target.value)} aria-label="文章正文" spellCheck="false"/>}<div className="sheet-foot"><span>● 已自动保存</span><div><button className="outline" onClick={()=>setPreview(!preview)}>{preview?'返回编辑':'预览'}</button><button className="publish" disabled={stopped||paused||stage===4} onClick={onPublish}>{stage===4?'已发布':stopped?'已终止':paused?'已暂停':'发布文章'}</button></div></div></div></div></div>;
}

function DiscoverySurface({stage,goal,site,onContinue,stopped,paused,needsLogin}){
  return <div className="discovery-surface">
    <div className="discovery-sitebar"><span className="demo-logo">{stage===0?'网页探索':site}</span><span>{stage===0?'平台查找':'任务入口'}</span></div>
    <main className="discovery-main">
      <div className="discovery-symbol"><Globe size={26}/></div>
      <small>{stopped?'任务已终止':stage===0?'正在探索平台':'已打开目标平台'}</small>
      <h1>{stopped?'已停止执行当前任务':paused?'任务已暂停，进度已保留':stage===0?`正在寻找 ${site} 的任务入口`:needsLogin?'等待你完成平台登录':'正在检查页面和登录状态'}</h1>
      <p>{stage===0?`目标：${goal}`:needsLogin?'已定位登录入口。请在平台完成登录，然后返回 Flow Pilot 继续任务。':'已找到创作入口。当前示例会话已登录，可以继续识别页面字段。'}</p>
      <div className="discovery-progress"><span className={'live-dot '+(stopped?'stopped':'')}/>{stopped?'后续网页操作已停止':stage===0?'搜索平台、比对入口与页面结构':needsLogin?'暂停自动操作，等待登录确认':'检查登录状态与可用操作'}</div>
      {!stopped&&<button disabled={paused} onClick={onContinue}>{stage===0?'查看已找到的平台':needsLogin?'我已完成登录':'进入编辑页面'}<ArrowRight size={16}/></button>}
    </main>
  </div>;
}

const eventIcons={user:ChatCircleText,execution:Globe,thought:Brain,tool:TerminalWindow,skill:PuzzlePiece};
function Activity({events}){
  const [open,setOpen]=useState(null);
  return events.map(event=>{const Icon=eventIcons[event.type]||CircleNotch;return <div className={'activity-event '+event.type} key={event.id}><button className="activity-row" aria-expanded={open===event.id} onClick={()=>setOpen(open===event.id?null:event.id)}><span className={'activity-icon '+event.type}><Icon size={16}/></span><span className="activity-text"><strong>{event.label}</strong><small>{event.summary}</small></span><span className="activity-status">{event.status}</span><CaretRight size={13} className={open===event.id?'open':''}/></button>{open===event.id&&<p className="activity-detail">{event.detail||event.summary}</p>}</div>});
}
const runTime=value=>value?new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'等待开始';
function Panel({task,onChange,onAdvance,onClose,onCommand}){
  const [collapsed,setCollapsed]=useState(false),[showActivity,setShowActivity]=useState(true),[reply,setReply]=useState(''),[editing,setEditing]=useState(false),[offset,setOffset]=useState({x:0,y:0});
  const drag=useRef(null),listRef=useRef(null);
  const active=['进行中','已暂停'].includes(task.status)&&task.hasRun, paused=task.status==='已暂停', stopped=task.status==='已终止', login=requiresLogin(task);
  const label=!task.hasRun?(task.schedule?.enabled?'等待定时执行':'定时已停用'):stopped?'本次执行已终止':paused?'本次执行已暂停':login?'等待用户登录':phaseLabels[task.stage];
  useEffect(()=>{if(showActivity&&listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight},[task.events?.length,task.runId,showActivity]);
  const submit=e=>{e.preventDefault();if(!reply.trim())return;onCommand(reply.trim());setShowActivity(true);setReply('')};
  const toggleSchedule=()=>{const next={...task.schedule,enabled:!task.schedule.enabled};if(next.enabled&&!nextOccurrence(next)){setEditing('reschedule');return}onChange(setTaskSchedule(task,next,task.schedule.enabled?'停止后续定时':'恢复后续定时'))};
  return <aside className={'panel '+(collapsed?'collapsed':'')+(stopped?' stopped':'')+(paused?' paused':'')} style={{transform:`translate(${offset.x}px,${offset.y}px)`}} aria-label="Flow Pilot 任务浮窗">
    <div className="panel-head" onPointerDown={e=>{if(e.target.closest('button'))return;drag.current={x:e.clientX,y:e.clientY,at:offset};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current)setOffset({x:drag.current.at.x+e.clientX-drag.current.x,y:drag.current.at.y+e.clientY-drag.current.y})}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
      <span className={'live-dot '+(!active||paused?'stopped':'')}/><strong>{!task.hasRun?'已安排：':stopped?'已终止：':paused?'已暂停：':task.stage===4?'已完成：':'正在完成：'}{task.name}</strong>
      <div className="panel-actions"><button aria-label={collapsed?'展开浮窗':'收起浮窗'} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<Plus size={18}/>:<Minus size={18}/>}</button><button aria-label="关闭浮窗" onClick={onClose}><X size={18}/></button></div>
    </div>
    {!collapsed&&<div className="panel-inside">
      <div className="goal-line"><span>当前目标</span><strong title={task.goal}>{task.goal}</strong></div>
      <div className="panel-schedule"><button className="schedule-link" onClick={()=>setEditing(true)}><Clock size={14}/><span>{scheduleLabel(task.schedule)}</span><CaretDown size={12}/></button>{task.schedule&&<button className="schedule-stop" onClick={toggleSchedule}>{task.schedule.enabled?'停止定时':'恢复定时'}</button>}{task.schedule&&<small>{nextLabel(task.schedule)}</small>}</div>
      <div className="current">{!task.hasRun?<Clock size={23}/>:stopped?<X size={23}/>:paused?<Pause size={23}/>:task.stage===4?<CheckCircle size={23} weight="fill"/>:<CircleNotch size={23} className={!login?'spin':''}/>}<div><small>当前状态</small><strong>{label}</strong></div></div>
      <section className="activity-section" aria-label="活动记录"><button className="section-toggle" aria-expanded={showActivity} onClick={()=>setShowActivity(!showActivity)}><span>活动记录 <small>{task.events?.length||0} 条</small></span><CaretDown size={16} className={showActivity?'':'turned'}/></button>
        {showActivity&&<div className="activity-list" ref={listRef}>{(task.pastRuns||[]).map(run=><details className="past-run" key={run.id}><summary><span>{runTime(run.startedAt)}</span><small>{run.status} · {run.events.length} 条</small></summary><Activity events={run.events}/></details>)}<div className="current-run"><strong>{task.hasRun?'本次运行':'定时安排'}</strong><small>{runTime(task.startedAt)}</small></div><Activity events={task.events||[]}/></div>}
      </section>
      <form className="panel-input" onSubmit={submit}><input value={reply} onChange={e=>setReply(e.target.value)} placeholder="改需求、暂停、继续或修改定时…" aria-label="向 Flow Pilot 发送调整"/><button aria-label="发送调整"><ArrowUp size={17} weight="bold"/></button></form>
      <div className="panel-foot"><div className="panel-left-actions"><button disabled={!active} title={paused?'从当前步骤继续':'保留进度并暂停当前运行'} onClick={()=>onChange(paused?resumeTask(task):pauseTask(task))}>{paused?<Play size={15} weight="fill"/>:<Pause size={15} weight="fill"/>}{paused?'继续':'暂停'}</button><button className="stop-action" disabled={!active} title="结束本次执行；定时规则保持原设置" onClick={()=>onChange(stopTask(task))}><X size={14}/>终止本次</button></div><button className="next" disabled={active&&(paused||login)} onClick={()=>active?onAdvance():onChange(startRun(task,task.hasRun?'manual':'trial'))}>{active?(login?'等待登录':'模拟下一步'):task.hasRun?'重新运行':'试运行一次'}<ArrowRight size={15}/></button></div>
      <small className="control-hint">{active?'暂停保留进度；终止本次不影响后续定时。':'定时仅在应用窗口打开时触发；页面操作为模拟。'}</small>
    </div>}{editing&&<ScheduleEditor schedule={editing==='reschedule'?{...task.schedule,enabled:true}:task.schedule} onClose={()=>setEditing(false)} onSave={value=>onChange(setTaskSchedule(task,value))}/>}
  </aside>;
}

function Detail({task,onHome,onUpdate}){
  const [visible,setVisible]=useState(true),[toast,setToast]=useState('');
  const stopped=task.status==='已终止', paused=task.status==='已暂停', inactive=!task.hasRun||stopped||paused||task.status==='已完成';
  const label=requiresLogin(task)&&!paused?'等待用户登录':taskStatus(task);
  const update=value=>onUpdate(task.id,value);
  const advance=()=>{if(inactive)return;update(requiresLogin(task)?confirmLogin(task):advanceTask(task,Math.min(task.stage+1,4)))};
  const command=text=>{
    if(/^(全部停止|停止全部|停止所有|终止并停止定时)[。！!]*$/.test(text)){let next=stopTask(task);if(next.schedule)next=setTaskSchedule(next,{...next.schedule,enabled:false},text);update(next);setToast('本次已终止，后续定时已停止');return}
    const parsed=parseSchedule(text,task.schedule);
    if(parsed){if(!parsed.schedule){setToast('当前任务还没有定时规则');return}if(parsed.schedule.enabled&&!parsed.schedule.nextAt){setToast('请选择未来的运行时间');return}update(setTaskSchedule(task,parsed.schedule,text));setToast(parsed.action==='disable'?'后续定时已停止；当前执行不受影响':'定时设置已更新');return}
    if(/^(暂停|暂停一下|暂停任务|暂停本次)[。！!]*$/.test(text)){update(pauseTask(task));return}
    if(/^(继续|继续执行|继续任务|恢复执行)[。！!]*$/.test(text)){update(resumeTask(task));return}
    if(/^(停止|终止|停止任务|终止任务|终止本次|停止本次)[。！!]*$/.test(text)){update(stopTask(task));return}
    if(/^(重新运行|重新执行|再运行一次|试运行一次)[。！!]*$/.test(text)){if(['进行中','已暂停'].includes(task.status)){setToast('请先终止当前这次，再开始新一轮');return}update(startRun(task,'manual'));return}
    update(applyGoalCommand(task,text));
  };
  return <div className="detail">
    <div className="tabs"><button onClick={onHome} className="back-home" title="返回首页"><Brand compact/></button><div className="tab"><Globe size={16}/>{!task.hasRun?'定时任务':task.stage===0?'寻找平台':task.site} · {task.name}<button aria-label="关闭标签页" onClick={onHome}><X size={14}/></button></div><button className="new-tab" aria-label="新任务" onClick={onHome}><Plus size={17}/></button><span className="spacer"/><button className="task-toggle" onClick={()=>setVisible(!visible)}><span className={'live-dot '+(inactive?'stopped':'')}/>{label}</button></div>
    <div className="address"><button aria-label="返回首页" onClick={onHome}><ArrowLeft size={19}/></button><button aria-label="前进" onClick={()=>setToast('正在按任务目标继续')}><ArrowRight size={19}/></button><button aria-label="刷新" onClick={()=>setToast('网页已刷新')}><ArrowClockwise size={17}/></button><div className="url"><Globe size={16}/>{!task.hasRun?'等待计划时间，到时打开目标平台':task.stage===0?'正在查找目标平台…':task.stage===1?'https://create.example.com':'https://create.example.com/write'}</div><button className="pilot-switch" aria-label="切换任务浮窗" onClick={()=>setVisible(!visible)}><Sparkle size={19} weight="fill"/></button><button aria-label="更多" onClick={()=>setToast('这是可交互的设计原型')}><DotsThree size={20}/></button></div>
    {toast&&<div className="toast" role="status" onClick={()=>setToast('')}>{toast}</div>}
    {!task.hasRun?<div className="scheduled-surface"><span className="discovery-symbol"><Clock size={26}/></span><small>{task.schedule?.enabled?'已安排定时任务':'定时已停止'}</small><h1>{scheduleLabel(task.schedule)}</h1><p>{task.goal}</p><span>{nextLabel(task.schedule)}</span><button className="outline" onClick={()=>update(startRun(task,'trial'))}>试运行一次 <Play size={14}/></button><small>本机时区 · 窗口打开时触发 · 不补跑错过的运行</small></div>:task.stage<2?<DiscoverySurface stage={task.stage} goal={task.goal} site={task.site} stopped={stopped} paused={paused} needsLogin={requiresLogin(task)} onContinue={advance}/>:<Editor stage={task.stage} stopped={stopped} paused={paused} siteName={task.site} title={task.title||'AI 时代，普通人如何提升自己的核心竞争力？'} setTitle={title=>update({...task,title})} onPublish={()=>{if(!inactive){update(advanceTask(task,4));setToast('模拟任务结果已确认')}}}/>}
    {visible?<Panel task={task} onChange={update} onAdvance={advance} onCommand={command} onClose={()=>setVisible(false)}/>:<button className="reopen" onClick={()=>setVisible(true)}><Sparkle size={17} weight="fill"/>查看任务过程</button>}
  </div>;
}

export function App(){
  const [tasks,setTasks]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('flow-pilot-prototype-tasks-v8')||localStorage.getItem('flow-pilot-prototype-tasks-v7')||'null');return Array.isArray(saved)?saved.map(restoreTask):seedTasks()}catch{return seedTasks()}});
  const [active,setActive]=useState(()=>location.pathname.startsWith('/task/')?decodeURIComponent(location.pathname.split('/')[2]||'article'):null);
  useEffect(()=>{localStorage.setItem('flow-pilot-prototype-tasks-v8',JSON.stringify(tasks))},[tasks]);
  useEffect(()=>{const timer=setInterval(()=>setTasks(list=>tickTasks(list)),1000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{const listener=()=>setActive(location.pathname.startsWith('/task/')?decodeURIComponent(location.pathname.split('/')[2]||'article'):null);addEventListener('popstate',listener);return()=>removeEventListener('popstate',listener)},[]);
  const open=id=>{history.pushState({},'',`/task/${encodeURIComponent(id)}`);setActive(id)};
  const home=()=>{history.pushState({},'','/');setActive(null)};
  const create=(goal,schedule)=>{const task=createTask(goal,schedule);setTasks(list=>[task,...list]);open(task.id)};
  const update=(id,value)=>setTasks(list=>list.map(task=>task.id===id?{...value,updated:'刚刚'}:task));
  const schedule=(id,value)=>setTasks(list=>list.map(task=>task.id===id?setTaskSchedule(task,value):task));
  const task=tasks.find(item=>item.id===active);
  return task?<Detail key={task.id} task={task} onHome={home} onUpdate={update}/>:<Home tasks={tasks} onOpen={open} onCreate={create} onSchedule={schedule}/>;
}
