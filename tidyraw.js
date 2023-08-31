export const tidyraw=(content)=>{
    //避免被誤判為註釋
    content=content.replace(/\n1 ，你為比丘尼說法語吧。/,'1，你為比丘尼說法語吧。');

    //只有經號
    //content=content.replace(/\n([一二三四五六七八九十]+) *\n+ */g,"$1．");
    content=content.replace(/\n七十([一二]) *\n/g,'\n七十$1．');
    content=content.replace(/九十  二 ．羅睺邏之二/,'九十二 ．羅睺邏之二');
    content=content.replace(/九十  五．不動搖/,'九十五．不動搖');

    return content;
}