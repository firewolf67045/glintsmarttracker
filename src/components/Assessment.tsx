import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Flame, Leaf, Sparkles, Target, UserRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate, type Language } from "@/lib/i18n";

export type AssessmentProfile = { name: string; goal: string; activity: string; diet: string; focus: string };
export const ASSESSMENT_KEY = "glint.assessment.v1";

const goals = [{ id:"balanced", icon:Sparkles, key:"balanced" },{ id:"muscle gain", icon:Dumbbell, key:"muscle" },{ id:"fat loss", icon:Flame, key:"fatLoss" },{ id:"energy", icon:Zap, key:"energy" }];
const activities = [{id:"sedentary",key:"sedentary"},{id:"lightly active",key:"light"},{id:"moderately active",key:"moderate"},{id:"very active",key:"very"},{id:"athlete",key:"athlete"}];
const diets = [{id:"everything",key:"everything"},{id:"vegetarian",key:"vegetarian"},{id:"vegan",key:"vegan"},{id:"pescatarian",key:"pescatarian"},{id:"high protein",key:"highProtein"}];
const focuses = [{id:"consistency",key:"consistency"},{id:"portions",key:"portions"},{id:"macros",key:"macros"},{id:"better choices",key:"betterChoices"}];

export function Assessment({ language, initial, onComplete }: { language: Language; initial?: AssessmentProfile | null; onComplete: (profile: AssessmentProfile) => void }) {
  const t = (key:string) => translate(language,key);
  const [step,setStep] = useState(0);
  const [profile,setProfile] = useState<AssessmentProfile>(initial ?? {name:"",goal:"balanced",activity:"moderately active",diet:"everything",focus:"consistency"});
  const questions = [
    <div className="space-y-4" key="name"><div className="assessment-icon"><UserRound /></div><h2>{t("nameQ")}</h2><input autoFocus value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} placeholder={t("nameP")} className="assessment-input" /></div>,
    <ChoiceGrid key="goal" title={t("goalQ")} items={goals} value={profile.goal} onPick={goal=>setProfile({...profile,goal})} t={t} />,
    <ChoiceGrid key="activity" title={t("activityQ")} items={activities} value={profile.activity} onPick={activity=>setProfile({...profile,activity})} t={t} />,
    <ChoiceGrid key="diet" title={t("dietQ")} items={diets} value={profile.diet} onPick={diet=>setProfile({...profile,diet})} t={t} />,
    <ChoiceGrid key="focus" title={t("focusQ")} items={focuses} value={profile.focus} onPick={focus=>setProfile({...profile,focus})} t={t} />,
  ];
  const canContinue = step !== 0 || profile.name.trim().length > 0;
  return <div className="fixed inset-0 z-[60] overflow-y-auto bg-background/95 backdrop-blur-xl">
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-6">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-display text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></span>glint</div><span className="text-xs font-bold text-muted-foreground">{t("step")} {step+1} {t("of")} 5</span></div>
      <div className="mt-6 grid grid-cols-5 gap-2">{questions.map((_,i)=><div key={i} className={`h-1.5 rounded-full transition-colors ${i<=step?"bg-primary":"bg-muted"}`} />)}</div>
      <div className="flex flex-1 flex-col justify-center py-10"><div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase text-primary"><Target className="h-4 w-4" />{t("assessmentTitle")}</div><p className="mb-8 text-sm text-muted-foreground">{t("assessmentSub")}</p><div className="assessment-panel">{questions[step]}</div></div>
      <div className="flex gap-3"><Button variant="outline" size="lg" className="h-13 w-13 px-0" disabled={step===0} onClick={()=>setStep(step-1)}><ArrowLeft /></Button><Button size="lg" className="h-13 flex-1 font-bold" disabled={!canContinue} onClick={()=>step===4?onComplete({...profile,name:profile.name.trim()}):setStep(step+1)}>{step===4?<><Check />{t("finish")}</>:<>{t("continue")}<ArrowRight /></>}</Button></div>
    </div>
  </div>;
}

function ChoiceGrid({title,items,value,onPick,t}:{title:string;items:Array<{id:string;key:string;icon?:typeof Sparkles}>;value:string;onPick:(v:string)=>void;t:(k:string)=>string}) {
  return <div><h2>{title}</h2><div className="mt-5 grid grid-cols-2 gap-3">{items.map(item=>{const Icon=item.icon??Leaf;const active=value===item.id;return <Button type="button" variant="outline" key={item.id} onClick={()=>onPick(item.id)} className={`h-auto min-h-24 flex-col whitespace-normal p-4 text-center ${active?"border-primary bg-primary/10 text-foreground ring-1 ring-primary":"bg-card"}`}><Icon className={`h-5 w-5 ${active?"text-primary":"text-muted-foreground"}`} /><span className="text-sm font-bold">{t(item.key)}</span>{active&&<Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}</Button>})}</div></div>;
}
