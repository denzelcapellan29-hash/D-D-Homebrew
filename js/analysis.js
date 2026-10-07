/* MapForge segmentation. Deliberately deterministic and editable: this is
 * heuristic 2.5D geometry extraction, NOT an AI semantic reconstruction. */
export function clamp(x, low, high) { return Math.max(low, Math.min(high, x)); }

export function createAnalysis(image, mode='cave', sensitivity=46, gridPixels=58) {
  const factor = 2.95;
  const width = clamp(Math.round(image.naturalWidth / gridPixels * factor), 20, 150);
  const height = clamp(Math.round(image.naturalHeight / gridPixels * factor), 20, 150);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  ctx.drawImage(image, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const brightness = new Float32Array(width*height);
  for (let i=0;i<brightness.length;i++) {
    const p = i*4;
    brightness[i] = (0.2126*pixels[p] + 0.7152*pixels[p+1] + 0.0722*pixels[p+2]) / 255;
  }
  const result = {width,height,mask:new Uint8Array(width*height),pixels,brightness,mode,gridPixels};
  if (mode==='curated') curatedMask(result);
  else if(mode==='relief') result.mask.fill(1);
  else autoDetect(result,sensitivity,mode);
  return result;
}

// Artist-tuned walkable polygon for the bundled Area 1 image only.
const area1 = [
 [0.00,0.50,0.60],[0.06,0.49,0.615],[0.12,0.49,0.61],
 [0.19,0.455,0.635],[0.25,0.385,0.65],[0.30,0.34,0.68],
 [0.36,0.30,0.694],[0.42,0.282,0.690],[0.49,0.277,0.68],
 [0.56,0.315,0.651],[0.62,0.36,0.635],[0.68,0.375,0.616],
 [0.75,0.405,0.598],[0.82,0.413,0.581],[0.87,0.422,0.59],
 [0.91,0.408,0.614],[0.95,0.40,0.626],[1.00,0.40,0.626]
];
function curatedMask(a) {
  for (let y=0;y<a.height;y++) {
    const py=(y+.5)/a.height;
    let lo=area1[0],hi=area1[area1.length-1];
    for(let i=1;i<area1.length;i++) if(py<=area1[i][0]) {lo=area1[i-1];hi=area1[i];break;}
    const t=clamp((py-lo[0])/(hi[0]-lo[0] || 1),0,1);
    const l=lo[1]+(hi[1]-lo[1])*t, r=lo[2]+(hi[2]-lo[2])*t;
    for(let x=0;x<a.width;x++) {
      const px=(x+.5)/a.width;
      const jitter=.006*Math.sin(y*.59)+.004*Math.cos(y*.24+x*.46);
      a.mask[y*a.width+x]=(px>l+jitter && px<r-jitter) ? 1 : 0;
    }
  }
}

// Single-seed connected bright-floor classifier; user can paint inaccuracies.
export function autoDetect(a, sensitivity=46, mode='cave') {
  const {width:w,height:h,brightness:b}=a, threshold=clamp(sensitivity/100,.2,.85);
  const initial=new Uint8Array(w*h);
  for(let i=0;i<initial.length;i++)initial[i]=(b[i]>=threshold)?1:0;
  // Majority closing: reduce thin dark grid lines or footprints in passages.
  const smooth=new Uint8Array(initial.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let count=0,total=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;
      if(xx>=0 && yy>=0 && xx<w && yy<h){ count+=initial[yy*w+xx]; total++; }
    }
    smooth[y*w+x] = count >= Math.ceil(total*(mode==='dungeon'?.46:.51)) ? 1:0;
  }
  // Select the largest connected floor region; avoids disconnected captions and labels.
  const seen=new Uint8Array(w*h);
  let best=[],largestScore=-1;
  const q=new Int32Array(w*h);
  for(let start=0;start<smooth.length;start++){
    if(!smooth[start]||seen[start])continue;
    seen[start]=1;let head=0,tail=1;q[0]=start;
    let componentScore=0;
    while(head<tail){const p=q[head++],x=p%w,y=(p/w)|0;
      if(x>=w*.28&&x<=w*.72&&y>=h*.2&&y<=h*.83)componentScore+=.3;
      const ns=[x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1];
      for(const n of ns)if(n>=0&&smooth[n]&&!seen[n]){seen[n]=1;q[tail++]=n;}
    }
    // In ambiguous maps favor broad, centrally relevant connected area.
    const score=tail+componentScore;
    if(score>largestScore){largestScore=score;best=Array.from(q.subarray(0,tail));}
  }
  a.mask.fill(0); for(const n of best)a.mask[n]=1;
  // A threshold yielding too little floor is not helpful: use the strongest quarter.
  if(best.length<.035*w*h){ for(let i=0;i<a.mask.length;i++)a.mask[i]=(b[i]>.6)?1:0; }
  a.mode=mode;
}

export function paintMask(a, u, v, radius, value) {
  const x=Math.floor(clamp(u,0,.99999)*a.width),y=Math.floor(clamp(v,0,.99999)*a.height);
  const r=clamp(radius,1,16),r2=r*r;
  for(let yy=Math.max(0,y-r);yy<=Math.min(a.height-1,y+r);yy++)
    for(let xx=Math.max(0,x-r);xx<=Math.min(a.width-1,x+r);xx++)
      if((xx-x)**2+(yy-y)**2<=r2)a.mask[yy*a.width+xx]=value;
}

export function walkableAt(a, u, v) {
  if(u<0||u>=1||v<0||v>=1)return false;
  const x=Math.floor(u*a.width), y=Math.floor(v*a.height);
  return a.mask[y*a.width+x]===1;
}

export function unpackSavedAnalysis(image, saved){
  const a=createAnalysis(image,'relief',saved.sensitivity||46,saved.gridPixels||58);
  if(saved.maskWidth===a.width&&saved.maskHeight===a.height&&typeof saved.mask==='string'){
    for(let i=0;i<a.mask.length;i++)a.mask[i]=saved.mask.charCodeAt(i)===49?1:0;
  } else if(saved.maskWidth && saved.maskHeight && typeof saved.mask==='string') {
    // Existing projects retain painted geometry when source dimensions change.
    for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
      const sx=Math.floor(x/a.width*saved.maskWidth),sy=Math.floor(y/a.height*saved.maskHeight);
      a.mask[y*a.width+x]=saved.mask[sy*saved.maskWidth+sx]==='1'?1:0;
    }
  }
  return a;
}
