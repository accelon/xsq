//可以利用 元亨版的 ^m
import {readTextLines} from 'ptk/nodebundle.cjs'

const build_pts_vri_map=lines=>{
    const out={};
    let ck='';
    //console.log(lines.length)
    for (let i=0;i<lines.length;i++) {
        const line=lines[i];
        const m=line.match(/\^ck#d(\d+)/)
        if (m) ck=m[1]
        else {
            const m2=line.match(/\^n(\d+)\^m(\d+)/);
            if (m2) {
                if (!out[ck+':'+m2[2]])  out[ck+':'+m2[2]]=m2[1]; 
            }
        }
    }
    // console.log(out)
    return out;
}
export const yhptsmap=()=>{
    const out={};
    out.dn1=build_pts_vri_map(readTextLines('../cb-n/off/dn1.yh.off'));
    out.dn2=build_pts_vri_map(readTextLines('../cb-n/off/dn2.yh.off'));
    out.dn3=build_pts_vri_map(readTextLines('../cb-n/off/dn3.yh.off'));

    return out;
}

