export class RequestGuard {
 private clients=new Map<string,{start:number;count:number}>();
 private active=0;
 private hour={start:0,count:0};
 constructor(private options:{perMinute:number;concurrent:number;hourly:number;now?:()=>number}){}
 acquire(identity:string):{ok:boolean;retryAfter:number;release:()=>void} {
  const now=this.options.now?.()??Date.now();
  for(const [id,bucket]of this.clients)if(now-bucket.start>=60000)this.clients.delete(id);
  if(now-this.hour.start>=3600000)this.hour={start:now,count:0};
  if(this.hour.count>=this.options.hourly)return {ok:false,retryAfter:Math.max(1,Math.ceil((this.hour.start+3600000-now)/1000)),release:()=>{}};
  if(this.active>=this.options.concurrent)return {ok:false,retryAfter:5,release:()=>{}};
  const client=this.clients.get(identity)??{start:now,count:0};
  if(client.count>=this.options.perMinute)return {ok:false,retryAfter:Math.max(1,Math.ceil((client.start+60000-now)/1000)),release:()=>{}};
  // Keep memory bounded even with an untrusted proxy sending arbitrary identities.
  if(this.clients.size>=10000&&!this.clients.has(identity))return {ok:false,retryAfter:60,release:()=>{}};
  client.count++;this.clients.set(identity,client);this.hour.count++;this.active++;
  let released=false;
  return {ok:true,retryAfter:0,release:()=>{if(!released){released=true;this.active--;}}};
 }
}
