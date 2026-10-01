import {nextOccurrence,scheduleLabel} from './schedule.mjs';
let serial=0;
const event=(type,label,summary,status='已记录',detail='')=>({id:`event-${Date.now()}-${serial++}`,type,label,summary,status,detail});
export const inferSite=goal=>goal.includes('公众号')?'公众号平台':goal.includes('知乎')?'知乎':goal.includes('小红书')?'小红书':goal.includes('创作中心')?'创作中心':'目标平台';
export const taskName=goal=>goal.length>18?goal.slice(0,18)+'…':goal;
export const needsLogin=task=>task.stage===1&&/登录|登陆/.test(task.goal)&&!task.loginConfirmed;
const finishPending=(events,status='已完成')=>events.map(e=>['进行中','调用中','检查中','等待用户'].includes(e.status)?{...e,status:e.type==='tool'&&status==='已完成'?'成功':status}:e);

export function phaseEvents(task,stage) {
  const ai=task.aiTrace!==false;
  if(stage===0)return [event('execution','执行步骤',`定位 ${task.site}`,'进行中','搜索目标平台并确认任务入口。'),...(ai?[event('thought','思考摘要','根据目标判断平台与可能的入口。'),event('tool','工具调用','platform.search · 目标平台','调用中',`目标：${task.site}`)]:[])];
  if(stage===1)return [event('execution','执行步骤','打开平台并检查登录','进行中','根据找到的入口访问网页。'),...(ai?[event('tool','工具调用','browser.goto · 创作入口','成功','已打开平台入口。'),event('thought','思考摘要',needsLogin({...task,stage})?'需要先完成平台登录。':'示例会话已登录，可以继续操作。',needsLogin({...task,stage})?'等待用户':'已确认','需要登录时暂停并等待用户。')]:[])];
  if(stage===2)return [event('execution','执行步骤',ai?'识别字段并填写':'按保存步骤检查字段','进行中','定位标题、正文等字段。'),...(ai?[event('skill','Skill 使用','内容发布 Skill','已启用','加载字段识别与结果校验规则。'),event('thought','思考摘要','找到标题和正文，正在确定填写顺序。'),event('tool','工具调用','browser.findElement · 正文输入框','成功','已找到可编辑字段。')]:[])];
  if(stage===3)return [event('execution','执行步骤','核对结果','进行中','核对页面内容与最终结果。'),...(ai?[event('thought','思考摘要','核对必填字段与页面反馈。')]:[])];
  return [event('execution','结果校验','目标结果已确认','成功','本次模拟执行已完成。')];
}

export function advanceTask(task,stage,now=new Date()) {
  if(!task.hasRun||task.paused||task.status!=='进行中')return task;
  return {...task,stage,status:stage===4?'已完成':'进行中',events:[...finishPending(task.events||[]),...phaseEvents(task,stage)],endedAt:stage===4?now.toISOString():null,simulationNextAt:stage===4?null:new Date(now.getTime()+5000).toISOString()};
}

export function createTask(goal,schedule=null,now=new Date(),extra={}) {
  const task={id:`task-${now.getTime()}-${serial++}`,name:taskName(goal),goal,site:inferSite(goal),status:schedule?'待执行':'进行中',updated:'刚刚',aiTrace:true,stage:0,hasRun:!schedule,runId:`run-${now.getTime()}-${serial++}`,startedAt:schedule?null:now.toISOString(),pastRuns:[],schedule:schedule?{...schedule,nextAt:nextOccurrence(schedule,now)}:null,...extra};
  task.events=[event('user','用户目标',goal,'已接收','根据目标开始网页任务。'),...(schedule?[event('execution','定时设置',scheduleLabel(schedule),'已安排','到时间后启动本地模拟。')]:phaseEvents(task,0))];
  return task;
}

export function startRun(task,trigger='manual',now=new Date()) {
  const oldRun=task.hasRun?{id:task.runId,startedAt:task.startedAt,endedAt:task.endedAt||now.toISOString(),status:task.status,events:finishPending(task.events||[],'已结束')}:null;
  const next={...task,hasRun:true,runId:`run-${now.getTime()}-${serial++}`,startedAt:now.toISOString(),endedAt:null,runTrigger:trigger,stage:0,status:'进行中',paused:false,loginConfirmed:false,simulationNextAt:['scheduled','trial'].includes(trigger)?new Date(now.getTime()+5000).toISOString():null,pastRuns:oldRun?[oldRun,...(task.pastRuns||[])].slice(0,12):task.pastRuns||[]};
  next.events=[event('user','用户目标',task.goal,'已接收'),event('execution',trigger==='scheduled'?'定时触发':'用户操作',trigger==='scheduled'?'已到运行时间':trigger==='trial'?'试运行一次':'开始新一轮执行','已开始'),...phaseEvents(next,0)];
  return next;
}

export function stopTask(task,now=new Date()) {
  if(!task.hasRun||!['进行中','已暂停'].includes(task.status))return task;
  return {...task,status:'已终止',endedAt:now.toISOString(),simulationNextAt:null,paused:false,events:[...finishPending(task.events||[],'已停止'),event('user','用户操作','结束本次执行','已停止','当前执行已结束，后续定时按已有规则运行。')]};
}

export function confirmLogin(task,now=new Date()) {
  return advanceTask({...task,loginConfirmed:true,events:[...(task.events||[]),event('user','用户操作','确认已完成平台登录','已接收')]},2,now);
}

export function pauseTask(task,now=new Date()) {
  if(!task.hasRun||task.status!=='进行中')return task;
  return {...task,paused:true,status:'已暂停',simulationNextAt:null,events:[...(task.events||[]),event('user','用户操作','暂停本次执行','已暂停','保留当前步骤与进度；继续后从这里执行。')]};
}

export function resumeTask(task,now=new Date()) {
  if(!task.hasRun||task.status!=='已暂停')return task;
  return {...task,paused:false,status:'进行中',simulationNextAt:['scheduled','trial'].includes(task.runTrigger)?new Date(now.getTime()+5000).toISOString():null,events:[...(task.events||[]),event('user','用户操作','继续本次执行','已继续','从保留的步骤继续，不重新开始。')]};
}

export function setTaskSchedule(task,schedule,text='修改定时设置',now=new Date()) {
  const next=schedule?{...schedule,nextAt:nextOccurrence(schedule,now)}:null;
  return {...task,schedule:next,events:[...(task.events||[]),event('user','用户操作',text,'已接收'),event('execution','定时设置',next?scheduleLabel(next):'已移除定时','已更新','定时设置作用于后续运行，不中断当前执行。')]};
}

export function applyGoalCommand(task,text,now=new Date()) {
  let next={...task,events:[...(task.events||[]),event('user','用户修正',text,'已接收'),event('thought','思考摘要','根据你的修正调整后续步骤。')]};
  const title=text.match(/标题(?:改成|改为|换成|设为)[：: ]?[“"「]?(.+?)[”"」]?$/);
  if(title||text.includes('标题')&&text.includes('简洁'))return {...next,title:title?title[1].replace(/[”"」]$/,''):'AI 时代，如何提升核心竞争力？',events:[...next.events,event('tool','工具调用','browser.fill · 文章标题','成功','标题已更新。')]};
  const goal=text.replace(/^(改成|改为|换成)[：: ]*/,'');
  const changed=/公众号|知乎|小红书|平台|改成|换成|发布到/.test(text);
  const active=task.hasRun&&['进行中','已暂停'].includes(task.status);
  next={...next,goal,name:task.id.startsWith('task-')?taskName(goal):task.name};
  if(changed){next={...next,site:inferSite(goal)==='目标平台'?task.site:inferSite(goal),stage:0,loginConfirmed:false,status:task.status,events:finishPending(next.events,'已调整')};if(active)next.events.push(...phaseEvents(next,0));}
  return next;
}

export function tickTasks(tasks,now=new Date()) {
  let changed=false;
  const result=tasks.map(task=>{
    let next=task;
    if(task.schedule?.enabled&&task.schedule.nextAt&&new Date(task.schedule.nextAt)<=now){
      const late=now-new Date(task.schedule.nextAt)>60000;
      const busy=task.hasRun&&['进行中','已暂停'].includes(task.status);
      const schedule={...task.schedule,nextAt:nextOccurrence(task.schedule,now),enabled:task.schedule.repeat!=='once'};
      if(late||busy)next={...task,schedule,events:[...(task.events||[]),event('execution','定时触发',late?'错过的运行已跳过':'上一轮仍在运行，本次触发已跳过','已跳过','避免补跑或重复启动任务。')]};
      else next={...startRun(task,'scheduled',now),schedule};
    }
    if(next.status==='进行中'&&['scheduled','trial'].includes(next.runTrigger)&&!next.paused&&!needsLogin(next)&&next.simulationNextAt&&new Date(next.simulationNextAt)<=now)next=advanceTask(next,Math.min(next.stage+1,4),now);
    if(next!==task)changed=true;
    return next;
  });
  return changed?result:tasks;
}

export function taskStatus(task){return !task.hasRun?(task.schedule?.enabled?'待定时执行':'定时已停用'):task.schedule?.enabled&&['已完成','已终止'].includes(task.status)?'等待下次':task.status}
