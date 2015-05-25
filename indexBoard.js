/**
 * Created by Tang on 2014/6/5.
 */
var list;

var IndexBoard=function(dom,opt){
    list=this;
    this.navOff=0;
    if(opt)
    {
        if ('navOff' in opt) this.navOff=opt.navOff;
        if ('disableAnimation' in opt) this.disableAnimation=true
        
    }
    this.dom=dom;
    this.con=[];
    this.curBackground=null;
    this.sec=[];
    this.backgroundDom=$(this.dom).children('.background-board')[0];
    this.backgroundCtx=this.backgroundDom.getContext('2d');
    this.lastTop=this.topY();
    this.lastBot=this.botY();
    this.globalWidth=window.screen.availWidth;
    this.globalHeight=window.screen.availHeight-this.navOff;
    this.down=true;
    this.init();
    window.onscroll=mainLoop;
    //Plug-in setting
    $('.least-gallery').least({'scrollToGallery': false,'HiDPI': false,'random': false});
};

IndexBoard.prototype.scrPos=function(){
    var pos;
    try{
        pos=window.pageYOffset;
    }
    catch(e){
        pos=(document.documentElement && document.documentElement.scrollTop) ||
            document.body.scrollTop;
    }
    return pos;
};

IndexBoard.prototype.topY=function(){
    return this.scrPos()+this.navOff;
};

IndexBoard.prototype.botY=function(){
    return this.scrPos()+$(window).height();
};

IndexBoard.prototype.init=function(){
    this.setSize();
    this.getCon();
    mainLoop();
};

IndexBoard.prototype.getCon= function () {
    var cur=this;
    $(this.dom).children('section').each(function(){
        cur.con.push(new section(this,cur));
    })
};

IndexBoard.prototype.setSize=function(){
    $(this.dom).css({
        'width':window.screen.availWidth,
        'margin-top':this.navOff
    });
    $(this.dom).children('.background-board').css({
        'width':window.screen.availWidth,
        'height':window.screen.availHeight-this.navOff,
        'top':this.navOff
    }).attr({
        width:window.screen.availWidth,
        height:window.screen.availHeight-this.navOff
    })
};

IndexBoard.prototype.getSec=function(top,bot) {
    var rtVal = [];
    for (var i = 0; i < this.con.length; i++) {
        if (this.con[i].top <= top && this.con[i].actBot > top) {
            while(true){
                rtVal.push(i);
                i++;
                if(i>=this.con.length||this.con[i].top>=bot) return(rtVal);
            }
        }
    }
};

IndexBoard.prototype.setBackground=function(force){
    if(this.curBackground==null || this.sec[0]>this.curBackground || this.sec[this.sec.length-1]<this.curBackground || force==true)
    {
        var img;
        var ctx=this.backgroundCtx;
        var background=null;

        for(var i=this.sec[0]; i<=this.sec[this.sec.length-1]; i++){
            if(this.con[i].backgroundImg) {
                if(!this.con[i].backgroundImg.complete)
                {
                    setTimeout(function(){list.setBackground()},200);
                    return;
                }
                background = i;
                img=this.con[i].backgroundImg;
                break;
            }
        }
        this.curBackground=background;
        if(background==null)
        {
            var guess=this.down?this.sec[this.sec.length-1]+1:this.sec[0]-1;
            if(guess>=0 && guess<this.con.length) img=this.con[guess].backgroundImg;
            background=img?guess:null;
            this.curBackground=background;
            if(background==null) return;
        }
        ctx.drawImage(img,0,0,this.backgroundDom.width,this.backgroundDom.height);
    }
};


IndexBoard.prototype.traverse=function(f){
    for(var i=0; i<this.con.length; i++)
    {
        for(var j=0; j<this.con[i].con.length; j++)
        {
            f.apply(this.con[i].con[j]);
        }
    }
};

IndexBoard.prototype.inArea=function(top,bot){
    if(top<=this.lastTop && bot>this.lastTop) return true;
    if(bot>=this.lastBot && top>this.lastBot) return true;
    if(top>=this.lastTop && bot<=this.lastBot) return true;
    return false;
    //Need fix
};

//Section

var section=function(dom,parent){
    this.dom=dom;
    this.parent=parent;
    //noinspection JSValidateTypes
    this.canDom=$(this.dom).children('.section-board')[0];

    this.setSize();
    this.backgroundImg=this.setBackground();

    this.con=[];
    this.getCon();

    this.correctHeight();
    this.setCan();
};

section.prototype={
    setCan:function(){
        var canvas=this.canDom;
        canvas.width=this.parent.globalWidth;
        canvas.height=this.actBot-this.top;
        $(canvas).css({'width':canvas.width,'height':canvas.height});
        var color=$(canvas).attr('color');
        var opacity=$(canvas).attr('opacity');
        var ctx=canvas.getContext('2d');
        //Clear canvas
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.globalAlpha=opacity;
        ctx.fillStyle=color;
        ctx.fillRect(0,0,canvas.width,canvas.height);
    },

    setBackground:function(){
        var backStr=$(this.dom).attr('background');
        if(!backStr)
        {
            return null;
        }
        var img=document.createElement('img');
        $(img).attr('src',backStr);
        return img;
    },

    getCon:function(){
        var cur=this;
        $(this.dom).children('div').each(function(){
           cur.con.push(new div(this,cur));
        })
    },
    setSize:function(){
        var height=$(this.dom).attr('height');
        $(this.dom).css('height',height*this.parent.globalHeight);
        this.top=this.dom.offsetTop;
        this.bot=this.dom.offsetHeight+this.dom.offsetTop;
    },
    correctHeight:function(){
        var maxBot=this.bot;
        for (var i=0; i<this.con.length; i++){
            maxBot=this.con[i].top+this.con[i].actHeight>maxBot?this.con[i].top+this.con[i].actHeight:maxBot;
        }
        this.actBot=parseInt(maxBot);
        $(this.dom).css('height',this.actBot-this.top);
        //When section size changed, Change canvas size and redraw canvas content manually
        this.setCan();
    },
    divControl:function(){
        for(var i=0; i<this.con.length; i++){
            if(this.parent.inArea(this.con[i].top,this.con[i].top+this.con[i].actHeight)){
                for(var j=0; j<this.con[i].animation.length; j++){
                    if(this.con[i].animation[j].shouldPlay()) {
                        this.con[i].animation[j].play();
                    }
                }
                this.con[i].first=false;
            }
        }
    }
};

//Div

var div=function(dom,parent){
    var cur=this;
    this.dom=dom;
    this.parent=parent;
    this.type=$(this.dom).attr('type');
    this.animation=[];
    this.left=null;
    this.width=null;
    this.top=null;
    this.height=null;
    this.layer=$(this.dom).css('z-index')?$(this.dom).css('z-index'):null;
    this.setLeft();
    this.setWidth();
    this.setTop();
    this.setHeight();
    this.setLayer();
    this.setAnimation();
    this.first=true;
};

div.prototype={
    setLeft:function(ext){
        var width=this.parent.parent.globalWidth;
        this.left=ext!=undefined?ext:$(this.dom).attr('left')*width;
        $(this.dom).css({'left':this.left})
    },
    setWidth:function(ext){
        var width=this.parent.parent.globalWidth;
        this.width=ext!=undefined?ext:($(this.dom).attr('right')-$(this.dom).attr('left'))*width;
        $(this.dom).css({'width':this.width})
    },
    setTop:function(ext){
        var height=this.parent.bot-this.parent.top;
        this.top=ext!=undefined?ext:height*$(this.dom).attr('top')+this.parent.top;
        $(this.dom).css({'top':this.top})
    },
    setHeight:function(ext){
        var height=this.parent.bot-this.parent.top;
        this.height=ext!=undefined?ext:($(this.dom).attr('bot')-$(this.dom).attr('top'))*height;
        this.correctSize();
        this.actHeight=this.dom.offsetHeight;
    },
    setLayer:function(){
        this.layer=$(this.dom).attr('layer');
        $(this.dom).css({'z-index':this.layer});
    },
    setAnimation:function(){
        var cur=this;
        cur.animation=[];
        $(this.dom).children('.animation').each(function(){
            cur.animation.push(new animation(this,cur));
        });

    },
    correctSize:function(){
        switch (this.type){
            case undefined:
                return;
            case 'img':
            case 'video':
            case 'iframe':
                $(this.dom).children('img,video,iframe').first().css({
                    'height': this.height,
                    'width': this.width
                });
                return;

            case 'picture-wall':
                $(this.dom).find('.least-gallery').least({'scrollToGallery': false,'HiDPI': false,'random': false});
                break;

            case 'text':
                var left= 1,right=1000, mid=parseInt((left+right)/2);
                var $dom=$(this.dom).children();
                while(left<right){
                    $dom.css('font-size',mid);
                    if(this.dom.offsetHeight>this.height) right=mid-1;
                    else left=mid+1;
                    mid=parseInt((left+right)/2);
                }
                if(this.dom.offsetHeight>this.height) left--;
                $dom.css('font-size',left);
                return;

            case 'bootstrapCarousel':
                $(this.dom).find('.carousel-inner img').css({
                    'width':this.width,
                    'height':this.height
                });
                return;
        }
    }
};

//animations
var aniCollections={};
aniCollections.fade={
    init:function(){
        $(this.parent.dom).css('display','none');
    },
    play:function(){
        this.init();
        $(this.parent.dom).fadeIn(this.speed);
    }
};
aniCollections.move={
    init:function(){
        var oriLeft=$(this.dom).attr('oriLeft')*list.globalWidth;
        var oriTop=this.parent.parent.top+$(this.dom).attr('oriTop')*(this.parent.parent.bot-this.parent.parent.top);
        if (oriLeft){
            this.parent.setLeft(oriLeft);
        }
        if (oriTop){
            this.parent.setTop(oriTop);
        }
    },
    play:function(){
        var cur=this;
        this.init();
        var dstLeft=parseInt($(this.dom).attr('dstLeft'))*list.globalWidth;
        var dstTop=this.parent.parent.top+parseInt($(this.dom).attr('dstTop'))*(this.parent.parent.bot-this.parent.parent.top);
        if (dstLeft==undefined || dstTop==undefined) throw "Undefined destination";
        $(this.parent.dom).animate({
                'left':dstLeft,
                'top':dstTop

            },{
                'speed':this.speed,
                'complete':function(){
                    cur.parent.setLeft(dstLeft);
                    cur.parent.setTop(dstTop);
                }
            }
        );
    }
};

aniCollections.resize={
    init:function(){
        var oriHeight=$(this.dom).attr('oriHeight')*list.globalWidth;
        var oriWidth=$(this.dom).attr('oriWidth')*(this.parent.parent.bot-this.parent.parent.top);
        if (oriWidth){
            this.parent.setWidth(oriWidth);
        }
        if (oriHeight){
            this.parent.setHeight(oriHeight);
        }
    },
    play:function(){
        var cur=this;
        this.init();
        var dstHeight=$(this.dom).attr('dstHeight')*list.globalWidth;
        var dstWidth=$(this.dom).attr('dstWidth')*(this.parent.parent.bot-this.parent.parent.top);
        if (dstWidth==undefined || dstHeight==undefined) throw "Undefined destination";
        $(this.parent.dom).animate({
                'width':dstWidth,
                'height':dstHeight
            },{
                'speed':this.speed,
                'step':function(){
                    cur.parent.setWidth(parseInt($(cur.parent.dom).css('width')));
                    cur.parent.setHeight(parseInt($(cur.parent.dom).css('height')));
                },
                'complete':function(){
                    cur.parent.setWidth(dstWidth);
                    cur.parent.setHeight(dstHeight);
                }
            }
        )


    }
};

var animation=function(dom,parent){
    this.dom=dom;
    this.parent=parent;
    this.type=$(this.dom).attr('type');
    this.trigger=$(this.dom).attr('trigger');
    this.speed=$(this.dom).attr('speed')?parseInt($(this.dom).attr('speed')):1000;
    if (!aniCollections[this.type]){
        throw "Undefined animation type: "+this.type;
    }
    this.init=function(){aniCollections[this.type].init.call(this)};
    this.play=function(){aniCollections[this.type].play.call(this)};
};
animation.prototype={
    shouldPlay:function(){
        return(
            (this.parent.first && this.trigger=='first')
            );
    }
};
//tools
var secComp=function(sec1,sec2){
    if(sec1.length!=sec2.length) return false;
    for(var i=0; i<sec1.length; i++) if(sec1[i]!=sec2[i]) return false;
    return true;
};


//main loop
var mainLoop=function(){
    var top=list.topY();
    var bot=list.botY();
    //if (list.lastTop-top<15 && list.lastTop-top>-15 && list.lastBot-bot<15 && list.lastBot-bot>-15) return;
    list.down=(list.lastTop<top);
    list.lastBot=bot;
    list.lastTop=top;
    var curSec=list.getSec(top,bot);
    if(!secComp(curSec,list.sec))
    {
        list.sec=curSec;
        list.setBackground();
    }
    if (!list.disableAnimation){
        for (var i = curSec[0]; i <= curSec[curSec.length - 1]; i++)
            list.con[i].divControl();
    }
};