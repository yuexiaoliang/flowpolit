export const localDate = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const localTime = (date=new Date()) => `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
const weekdays=['日','一','二','三','四','五','六'];

export function nextOccurrence(schedule, after=new Date()) {
  if(!schedule?.enabled) return null;
  const [hour,minute]=(schedule.time||'09:00').split(':').map(Number);
  if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)return null;
  const start=new Date(after);
  if(schedule.repeat==='once') {
    const date=new Date(`${schedule.date}T${schedule.time}:00`);
    return Number.isFinite(date.getTime())&&date>start&&!schedule.skipDates?.includes(localDate(date))?date.toISOString():null;
  }
  for(let i=0;i<370;i++){
    const date=new Date(start); date.setDate(start.getDate()+i); date.setHours(hour,minute,0,0);
    if(date<=start||schedule.skipDates?.includes(localDate(date)))continue;
    if(schedule.repeat==='weekly'&&date.getDay()!==Number(schedule.day))continue;
    if(schedule.repeat==='workdays'&&(date.getDay()===0||date.getDay()===6))continue;
    return date.toISOString();
  }
  return null;
}

export function scheduleLabel(schedule) {
  if(!schedule)return '添加定时';
  const base=schedule.repeat==='daily'?'每天':schedule.repeat==='weekly'?`每周${weekdays[Number(schedule.day)]}`:schedule.repeat==='workdays'?'工作日':schedule.date?.slice(5).replace('-','月')+'日';
  return `${base} ${schedule.time}${schedule.enabled?'':' · 已停用'}`;
}

export function nextLabel(schedule,now=new Date()) {
  if(!schedule?.enabled)return '后续定时已停用';
  if(!schedule.nextAt)return '暂无下一次运行';
  const date=new Date(schedule.nextAt),tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1);
  const day=localDate(date)===localDate(now)?'今天':localDate(date)===localDate(tomorrow)?'明天':`${date.getMonth()+1}月${date.getDate()}日`;
  return `下次${day} ${localTime(date)}`;
}

function chineseNumber(value) {
  const map={零:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
  if(/^\d+$/.test(value))return Number(value);
  if(value==='十')return 10;
  if(value.includes('十')){const [a,b]=value.split('十');return (a?map[a]:1)*10+(b?map[b]:0)}
  return map[value];
}

export function parseSchedule(text, previous=null, now=new Date()) {
  if(/停用定时|停止定时|取消定时|取消.*定时任务/.test(text))return {schedule:previous?{...previous,enabled:false,nextAt:null}:null,action:'disable'};
  if(/恢复定时|启用定时/.test(text)&&previous){const schedule={...previous,enabled:true};return {schedule:{...schedule,nextAt:nextOccurrence(schedule,now)},action:'enable'}}
  if(/明天.*(取消|跳过)|(取消|跳过).*明天/.test(text)&&previous){const date=new Date(now);date.setDate(date.getDate()+1);const schedule={...previous,skipDates:[...new Set([...(previous.skipDates||[]),localDate(date)])]};return {schedule:{...schedule,nextAt:nextOccurrence(schedule,now)},action:'skip'}}
  const week=text.match(/每周([一二三四五六日天])/);
  const repeat=week?'weekly':/工作日/.test(text)?'workdays':/每天|每日/.test(text)?'daily':/今天|明天|后天/.test(text)?'once':previous?.repeat;
  const timeMatch=text.match(/(凌晨|早上|上午|中午|下午|晚上|晚间)?\s*([\d一二两三四五六七八九十]+)\s*(?:[:：]([0-5]?\d)|[点时](半|[\d一二三四五六七八九十]+分?)?)/);
  if(!repeat||(!week&&!/每天|每日|工作日|今天|明天|后天|定时/.test(text)&&!(timeMatch&&/改到|改成|改为|以后/.test(text))))return null;
  let time=previous?.time||'09:00';
  if(timeMatch){let hour=chineseNumber(timeMatch[2]);const minute=timeMatch[3]?Number(timeMatch[3]):timeMatch[4]==='半'?30:timeMatch[4]?chineseNumber(timeMatch[4].replace('分','')):0;if(/下午|晚上|晚间/.test(timeMatch[1]||'')&&hour<12)hour+=12;if(timeMatch[1]==='中午'&&hour<11)hour+=12;if(hour>23||minute>59)return null;time=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`}
  const date=new Date(now);if(text.includes('后天'))date.setDate(date.getDate()+2);else if(text.includes('明天'))date.setDate(date.getDate()+1);
  const schedule={repeat,time,day:week?weekdays.indexOf(week[1]==='天'?'日':week[1]):previous?.day??1,date:repeat==='once'?localDate(date):previous?.date||localDate(date),enabled:true,skipDates:[]};
  if(repeat==='once'&&!/今天|明天|后天/.test(text)&&new Date(`${schedule.date}T${time}:00`)<=now){date.setDate(date.getDate()+1);schedule.date=localDate(date)}
  return {schedule:{...schedule,nextAt:nextOccurrence(schedule,now)},action:'set'};
}

export function stripSchedulePrefix(text) {
  return text.replace(/^(?:请|帮我)?(?:以后)?(?:每天|每日|工作日|每周[一二三四五六日天]|今天|明天|后天)(?:(?:凌晨|早上|上午|中午|下午|晚上|晚间)?\s*[\d一二两三四五六七八九十]+\s*(?:[:：][0-5]?\d|[点时](?:半|[\d一二三四五六七八九十]+分?)?))?[，,：: ]*/,'').replace(/^帮我/,'').trim()||text;
}
