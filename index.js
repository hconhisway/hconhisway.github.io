function randomLinkOver(){
    var randomLinkText = document.getElementById("random-button");
    randomLinkText.innerHTML="Feeling lucky?";
    // randomLinkText.innerHTML.style="font-size: 10;";
}

function randomLinkRestore(){
    var randomLinkText = document.getElementById("random-button");
    randomLinkText.innerHTML="Random Teleport";
}

function blogClick(){
    var blogButton = document.getElementById("blog-button");
    blogButton.style.color = "black";
}

function randomTelePort(){
    var theNumber = randomNum(0,1000);
    if(theNumber>0 && theNumber<100){
        window.location.href="https://seoi.net/petal/";
    }
    else if(theNumber>100 && theNumber<200){
        window.location.href="http://dan-williams.net/portraiture/noam-chomsky";
    }
    else if(theNumber>200 && theNumber<300){
        window.location.href="https://amaliaulman.eu/";
    }
    else if(theNumber>300 && theNumber<400){
        window.location.href="https://theuselessweb.com/";
    }
    else if(theNumber>400 && theNumber<500){
        window.location.href="https://thispersondoesnotexist.com/";
    }
    else if(theNumber>500 && theNumber<600){
        window.location.href="https://nodtotherhythm.com/";
        
    }
    else if(theNumber>600 && theNumber<670){
        window.location.href="https://www.who.int/";
        
    }
    else if(theNumber>670 && theNumber<740){
        window.location.href="https://myweirdhabits.com/";
        
    }
    else if(theNumber>740 && theNumber<800){
        window.location.href="https://clash.me/";
        
    }
    else if(theNumber>800 && theNumber<850){
        window.location.href="http://i-remember.fr/";
        
    }
    else if(theNumber>850 && theNumber<920){
        window.location.href="https://www.animatedknots.com/";
        
    }
    else if(theNumber>920 && theNumber<1000){
        window.location.href="https://aidn.jp/contents/";
    }
    else{
        window.location.href="index.html"
    }
}

function randomNum(minNum,maxNum){ 
    switch(arguments.length){ 
        case 1: 
            return parseInt(Math.random()*minNum+1,10); 
        break; 
        case 2: 
            return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10); 
        break; 
            default: 
                return 0; 
            break; 
    } 
}

// var width = 1080;  //画布的宽度
// var height = 1180;   //画布的高度
// var svg = d3.select("body")
//             .append("svg")          //添加一个svg元素
//             .attr("width", width)       //设定宽度
//             .attr("height", height);    //设定高度
// svg = d3.select("svg");
// var decorateLine = svg.append("rect")
//                     .attr("x",7)
//                     .attr("y",60)
//                     .attr("width",5)
//                     .attr("height",150)
//                     .attr("fill","#960000")
//                     .attr("opacity",0.6)
//                     .attr("rx",5)
//                     .attr("ry",5);

// var decorateLine2 = svg.append("rect")
//                     .attr("x",17.6)
//                     .attr("y",337)
//                     .attr("width",60)
//                     .attr("height",7)
//                     .attr("fill","#960000")
//                     .attr("opacity",0.6)
//                     .attr("rx",1)
//                     .attr("ry",1);