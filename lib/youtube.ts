export function getYoutubeId(url:string){
  if(!url) return null;
  try{
    if(url.indexOf('youtu.be/')>-1){
      var a=url.split('youtu.be/')[1];
      if(a) return a.split('&')[0].split('?')[0].slice(0,11);
    }
    if(url.indexOf('v=')>-1){
      var b=url.split('v=')[1];
      if(b) return b.split('&')[0].split('?')[0].slice(0,11);
    }
    return null;
  }catch(e){ return null }
}
