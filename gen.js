import {nodefs,writeChanged,readTextContent, fromChineseNumber, toBase26} from 'ptk/nodebundle.cjs'; 
await nodefs; //export fs to global
import {tidyraw} from './tidyraw.js'

const lines=tidyraw(readTextContent('xsq-raw.txt')).replace(/\n\n/g,'\n').split(/\n/);
const prefix=process.argv[2]||'dn'
import {yhptsmap} from './yhpts.js'
const dnmap=yhptsmap();

const cnumbertitle=/^ *([一二三四五六七八九十零]+ *)．/
let prevpage=0,page=0,vol='',ck='',samyutta='',anguttara='', 
fnpage='';

let nikayahandler;
const volumnstarts={
    1:'dn1',116:'dn2',271:'dn3',    
    398:'mn1', 597:'mn2',  830:'mn3',
    1013:'sn1',1207:'sn2', 1370:'sn3', 1555:'sn4', 1785:'sn5',    
    2065:'an1',2132:'an2', 2181:'an3', 2298:'an4',
    2454:'an5',2594:'an6', 2672:'an7', 2736:'an8',
    2815:'an9',2866:'an10',2993:'an11',
}

const out=[];
const tidy=text=>{
    return text.replace(/ *([“”]) */g,'$1').replace(/ *([‘’]) */g,'$1')
    .replace(/ +([、，])/g,'$1')
    
    .replace(/☉\n/g,'')//join next line
}
const tidybody=lines=>{
    return tidy(lines.join('\n')
    .replace(/ *([^a-z\-\d])(\d+) */g,(m,m1,m2)=>m1.trim()+'^f'+m2.trim())
    .replace(/ +/g,'')
     .replace(/。([”’]*)(.{5})/g,'。$1\n$2')
     .replace(/：‘/g,'：\n‘')
     .replace(/([^：]{10})：“/g,'$1：\n“')
     
    )
}
const tidyfootnote=lines=>{
    return tidy(lines.join('\n')
    .replace(/([hp]) ([āū])/g,'$1$2')
    .replace(/a ṭ/g,'aṭ')); //strange, excessive space added by foxit pdf to text
}
const writeVolumn=(v)=>{
    emitNote();
    out.push(paragraph);
    paragraph='';
    if (v.startsWith(prefix)) {
        while(out.length && !out[0].trim()) out.shift();
        out[0]='^bk#'+v+out[0];
        writeChanged('off-ori/'+v+'.xsq.off',tidybody(out),true);
        const footnoteheader=':<name='+v+'-fn preload=true>\tnote'
        writeChanged('off-ori/'+v+'.xsq.tsv', footnoteheader+'\n'+tidyfootnote(footnotes),true); 
    }
    footnotes.length=0;
    out.length=0;
}

const footnotes=[];
let paragraph='',noteparagraph='',notesection=false,fn='';
const emitNote=()=>{
    if (fnpage && noteparagraph) {
        const f=parseInt(noteparagraph);
        if (!f) {
            console.log('wrong foot note',noteparagraph)
        }
        //footnotes.push([page,ck,noteparagraph]);
        footnotes.push(page+'\t'+ck+'\t'+f+'\t'+noteparagraph.replace(f,'').trim())
        noteparagraph='';    
    }
}
const emitParagraph=line=>{
    out.push(paragraph);
    paragraph=line.trim();
}
const addline=(line)=>{
    if (notesection) {
        noteparagraph+=line.trim();
    } else {
        if (line.startsWith('  ')) {
            emitParagraph(line);
        } else {
            paragraph+=line.trim();
        }
    }
}
let snnumcount=0;
const handler=(line,nikaya)=>{
    const trimmed=line.trim();
    if (!trimmed || trimmed=='◆') return;
    const m=line.match(cnumbertitle);
    if (m) {
        const n=fromChineseNumber(m[1]);
        if (n) {
            emitParagraph('')
            let sutta='',vagga='';
            if (samyutta) {
                vagga=Math.floor(n/10);
                sutta=n-vagga*10;
                ck=vol[0]+ (samyutta?samyutta+toBase26(vagga)+sutta: n) ;
            } else if (anguttara){
                vagga='x';//need to resolve vagga from sutta number
                ck=vol[0]+anguttara+vagga+n
            } else {
                ck=vol[0]+n;               
            }
            let extra='';
            if (nikaya=='s' || nikaya=='a') {
                snnumcount++;
                extra='^n'+snnumcount;
            }
            line=trimmed.replace(m[1],'\n^ck#'+ck+'【'+m[1]).replace(/ /g,'')+'】'+extra;
        }
    } 
    const m2=line.match(/\d+\./);
    const n=parseInt(line);
    if (n) { //paranum or foot note
        if (trimmed==n.toString()) {//pure end page marker ,ignore
            line=''
        } else {
            if (m2) {
                line=line.replace(/(\d+) *－ *(\d+)\./,'^m$1-$2').replace(/(\d+)\./,'^m$1').replace(/\^m(\d+)/g,(m0,m)=>{
                    const map=dnmap[prevvol];
                    //console.log(ck+':'+m)
                    if (map&&map[ck.slice(1)+':'+m]) {
                        //console.log(map[m],m0)
                        return '^n'+map[ck.slice(1)+':'+m]+m0;
                    }
                    
                    return m0
                })

            } else if (~line.indexOf(n+' ')){//footnote marker
                notesection=true;
                emitNote();
                fnpage=page;
                fn=n;
            }
        }
    }
    
    addline(line);
}

const snhandler=(line)=>{
    const m=line.match(/^相應部．/);
    if (m) {
        const till=line.lastIndexOf('．');
        samyutta=fromChineseNumber(line.slice(4,till));
        line='^ck#s'+samyutta+line.slice(till+1).replace(/ +蕭式球譯 */,'')+'☉'
    }
    return handler(line,'s')
}
const anhandler=(line)=>{
    const m=line.match(/^增支部．/);
    if (m) {
        const till=line.lastIndexOf('集');
        anguttara=fromChineseNumber(line.slice(5,till));
        line='^ck#a'+anguttara+line.slice(till+1).replace(/ +蕭式球譯 */,'')+'☉'
    }
    return handler(line,'a')
}


const nikayaHandlers={
    's':snhandler,
    'd':handler,
    'm':handler,
    'a':anhandler,
}
let prevvol='',i=0;

while (i<lines.length) {
    const line=lines[i];
    const mpage=(line.match(/Page (\d+)/));
    if (mpage) {
        page=parseInt(mpage[1]);
        if(prevpage+1!==page) {
            console.log('page gap',i,page)
        }
        if (volumnstarts[page]) {
            vol=volumnstarts[page];
            nikayahandler=nikayaHandlers[vol[0]];
            if (vol[0]!=='s') samyutta='';
            if (vol[0]!=='a') anguttara='';
            if (prevvol!==vol && prevvol) writeVolumn(prevvol);
            prevvol=vol;
            if (vol=='sn1' || vol=='an1'||vol.slice(2,3)!=='1') {
                //sn1 相應部 marker 和 作者放一起，不能跳過
            } else {
                i++;//skip the author signature
            }
            snnumcount=0;
            emitNote();
        }
        notesection=false;
        prevpage=page;
    } else {
        nikayahandler(line);
    }
    i++;
}

writeVolumn(prevvol)