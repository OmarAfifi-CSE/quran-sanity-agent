"""Render genuine captured UI screenshots as a captioned walkthrough, not a live recording."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, textwrap
root=Path(__file__).resolve().parents[1]
folder=root/'docs/demo'; frames=folder/'frames';frames.mkdir(exist_ok=True)
fontpath=Path('C:/Windows/Fonts/segoeui.ttf')
regular=ImageFont.truetype(str(fontpath),36);titlefont=ImageFont.truetype(str(fontpath),64);small=ImageFont.truetype(str(fontpath),25)
story=[
 ('welcome.png','Understanding, with evidence','A bilingual Quran research workspace. Scripture comes from stored records; AI reading notes stay separate.'),
 ('justice.png','Ask a deeper question','A question about justice retrieves 4:135, with commentary and inspectable supporting quotations.'),
 ('provenance.png','Follow the evidence','Open the original Sanity record. See the document ID, selected passage and Context MCP retrieval trace.'),
 ('arabic-mobile.png','Arabic, on mobile','Explore reliance on Allah and taking practical means. The tested query retrieved 12:67 and 3:159.'),
 ('unsupported.png','Acknowledge missing evidence','An invalid reference is rejected. Automated checks support research; they do not replace qualified scholarly review.')]
for i,(source,title,caption) in enumerate(story):
 image=Image.new('RGB',(1920,1080),'#f6f5ef');draw=ImageDraw.Draw(image)
 draw.text((110,100),'QURAN SANITY AGENT',font=small,fill='#285c4b')
 y=230
 for line in textwrap.wrap(title,22):draw.text((110,y),line,font=titlefont,fill='#193b31');y+=83
 y+=50
 for line in textwrap.wrap(caption,37):draw.text((110,y),line,font=regular,fill='#364c44');y+=55
 shot=Image.open(folder/'screens'/source).convert('RGB');shot.thumbnail((840,870))
 image.paste(shot,(1000+(840-shot.width)//2,85+(870-shot.height)//2))
 draw.text((110,920),'Captured UI walkthrough | Original text: Tanzil / cited providers',font=small,fill='#476459')
 draw.text((110,965),'AI notes are not specialist-reviewed. Source permissions remain separate.',font=small,fill='#476459')
 image.save(frames/f'{i:02}.png')
manifest=frames/'concat.txt'
manifest.write_text(''.join(f"file '{i:02}.png'\nduration 18\n" for i in range(len(story)))+f"file '{len(story)-1:02}.png'\n",encoding='utf8')
ffmpeg='C:/Users/Omar/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'
subprocess.run([ffmpeg,'-y','-f','concat','-safe','0','-i',str(manifest),'-t','90','-r','24','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(folder/'quran-evidence-walkthrough.mp4')],check=True)
def timestamp(s):return f'{s//3600:02}:{(s//60)%60:02}:{s%60:02},000'
(folder/'walkthrough.srt').write_text('\n\n'.join(f'{i+1}\n{timestamp(i*18)} --> {timestamp((i+1)*18)}\n{title}. {caption}' for i,(_,title,caption) in enumerate(story)),encoding='utf8')
(folder/'WALKTHROUGH.md').write_text('# Captured UI walkthrough\n\n90-second, captioned MP4 generated from real local production-interface screenshots. This is a screenshot walkthrough, not a live screen recording. No voiceover or audio was recorded. Captions and optional narration text are in walkthrough.srt. Do not submit until source/demo permissions and contest requirements are checked.\n\n'+'\n\n'.join(f'## {title}\n\n{caption}\n\nFrame: screens/{source}' for source,title,caption in story),encoding='utf8')
print(json.dumps({'output':str(folder/'quran-evidence-walkthrough.mp4'),'durationSeconds':90,'frames':len(story),'liveRecording':False,'audio':False}))
