// ==UserScript==
// @name         Instagram - Upload to Imgur and Save to Reddit
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/Instragram-Reddit/raw/master/instagram-reddit.user.js
// @version      0.16
// @description  Instagram -> Imgur -> Reddit
// @author       LenAnderson
// @match        https://www.instagram.com
// @match        https://www.instagram.com/*
// @match        https://imgur.com/*
// @match        https://gfycat.com/*
// @match        https://www.reddit.com/r/*/submit?url=*
// @match        https://www.reddit.com/r/*/comments/*
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    let sr = 'FrankBank';
    let popup;





    let getQueue = () => {
        let queue = GM_getValue('uti_queue');
        if (!queue || !(queue instanceof Array)) {
            return [];
        }
        return queue;
    };
    let setQueue = (q) => {
        GM_setValue('uti_queue', q);
    };

    let makeImgurl = (type, url) => {
        console.log('makeImgurl', url);
        switch (type) {
            case 'img':
                return 'https://imgur.com/upload?url=' + encodeURIComponent(url);
            case 'vid':
                return 'https://gfycat.com/upload?url=' + encodeURIComponent(url);
        }
    };


    let addUpload = (type, title, url) => {
        if (popup && !popup.closed) {
            console.log('adding to queue', type, title, url);
            let queue = getQueue();
            queue.push({type:type, title:title, url:url});
            setQueue(queue);
        } else {
            console.log('starting upload', type, title, url);
            startUpload(type, title, url);
        }
    };
    let startUpload = (type, title, url) => {
        let imgurl = makeImgurl(type, url);
        GM_setValue('uti_title', title);
        popup = open(imgurl, 'uti', 'resizable,innerHeight=200,innerWidth=200,centerscreen,menubar=no,toolbar=no,location=no');
    };
    let continueUpload = () => {
        let queue = getQueue();
        console.log('QUEUE', queue);
        if (queue.length > 0) {
            console.log('NEXT');
            let item = queue.shift();
            setQueue(queue);
            if (item.type == 'vid') return continueUpload();
            let imgurl = makeImgurl(item.type, item.url);
            GM_setValue('uti_title', item.title);
            location.href = imgurl;
        } else {
            console.log('CLOSING');
            window.close();
        }
    };



    if (location.href.search(/^https:\/\/www\.instagram\.com/i) == 0) {
        let btns = [];
        let addSaveButtons = () => {
            // feed / profile (images)
            //[].forEach.call(document.querySelectorAll('article._8Rm4L img[srcset], article._622au img[srcset]'), img => {
            [].forEach.call(document.querySelectorAll('article._8Rm4L img[srcset], article.M9sTE img[srcset]'), img => {
                if (img.getAttribute('data-uti')) return;
                let thing = img.closest('article');
                if (img && thing) {
                    let srcset = img.getAttribute('srcset').split(',').pop().split(' ')[0];
                    let header = thing.querySelector('header');
                    //[].forEach.call(header.querySelectorAll('.uti-btn'), oldBtn => oldBtn.remove());
                    let btn = document.createElement('button');
                    btns.push(btn);
                    btn.img = img;
                    btn.classList.add('uti-btn');
                    btn.textContent = 'imgur';
                    btn.addEventListener('click', () => {
                        addUpload('img', header.querySelector('a.ZIAjV').textContent.trim(), srcset);
                    });
                    btn.style.position = 'absolute';
                    btn.style.top = '10px';
                    let li = img.closest('.ZyFrc');
                    btn.style.right = `${10 - (li ? li.offsetLeft : 0)}px`;
                    li.appendChild(btn);
                    img.setAttribute('data-uti', '1');
                }
            });
            // feed / profile (videos)
            [].forEach.call(document.querySelectorAll('article._8Rm4L video[src], article.M9sTE video[src]'), img => {
                if (img.getAttribute('data-uti')) return;
                let thing = img.closest('article');
                if (img && thing){
                    let srcset = thing.querySelector('.c-Yi7').href;
                    let header = thing.querySelector('header');
                    [].forEach.call(header.querySelectorAll('.uti-btn'), oldBtn => oldBtn.remove());
                    let btn = document.createElement('button');
                    btn.classList.add('uti-btn');
                    btn.textContent = 'imgur';
                    btn.addEventListener('click', () => {
                        addUpload('vid', header.querySelector('a.ZIAjV').textContent.trim(), srcset);
                    });
                    btn.style.position = 'absolute';
                    btn.style.top = '10px';
                    let li = img.closest('.kPFhm');
                    btn.style.right = `${10 - (li ? li.offsetLeft : 0)}px`;
                    li.appendChild(btn);
                    img.setAttribute('data-uti', '1');
                }
            });
            // stories
            [].forEach.call(document.querySelectorAll('img.i1HvM[srcset]  , video.OFkrO'), img => {
                if (img.getAttribute('data-uti') == '1') return;
                let srcset;
                let type;
                switch (img.tagName) {
                    case 'IMG':
                        srcset = img.getAttribute('srcset').split(',').pop().split(' ')[0];
                        type = 'img';
                        break;
                    case 'VIDEO':
                        srcset = img.querySelector('source').src;
                        type = 'vid';
                        break;
                }
                let obtn = document.querySelector('.-jHC6');
                let btn = document.createElement('button');
                btn.textContent = 'imgur';
                btn.addEventListener('click', ()=>{
                    addUpload(type, document.querySelector('.FPmhX.notranslate').textContent.trim(), srcset);
                });
                btn.style.position = 'absolute';
                btn.style.top = '30px';
                btn.style.right = '-56px';
                obtn.parentElement.appendChild(btn);
                img.setAttribute('data-uti', '1');
            });
        };
        var mo = new MutationObserver(function(muts) {
            addSaveButtons();
            btns.forEach(btn=>{
                let li = btn.img.closest('li');
                let slide = btn.img.closest('.MreMs');
                let offset = Number(slide ? slide.style.transform.replace(/^.*translateX\(([\-\d]+)px\).*$/, '$1') : 0);
                btn.style.right = `${10 - offset - (li ? li.offsetLeft : 0)}px`;
            });
        });
        mo.observe(document.body, {childList: true, subtree: true, attributes:true});
    }

    else if (location.href.search(/^https:\/\/twitter.com\//i) == 0) {
        console.log('[UTI]', 'twitter');
        const btns = [];
        let adding = false;
        let twitterCount = 0;
        function addSaveButtons() {
            if (adding) return;
            adding = true;
            console.log('addSvBtn');
            Array.from(document.querySelectorAll('[aria-modal] [aria-label="Image"] > img')).forEach(img=>{
                if (img.getAttribute('data-uti') == '1') return;
                img.setAttribute('data-uti', 1);
                let src;
                let type;
                let obtn = img.closest('[aria-modal]').querySelector('[aria-label="More"],[aria-label="View Tweet"]');
                switch (img.tagName) {
                    case 'IMG':
                        src = img.src.replace(/&name=[^&]+/, '');
                        type = 'img';
                        break;
                }
                img.title = twitterCount;
                let btn = document.createElement('button');
                btn.textContent = `imgur: ${twitterCount++}`;
                btn.title = src;
                btn.addEventListener('click', ()=>{
                    addUpload(type, 'twitter', src);
                });
                obtn.parentElement.appendChild(btn);
                btns.push(btn);
            });
            adding = false;
        }
        const mo = new MutationObserver(muts=>{
            addSaveButtons();
            btns.forEach(btn=>{
            });
        });
        mo.observe(document.body, {childList:true, subtree:true, attributes:true});
    }

    else if (window.name == 'uti' && location.href.search(/^https:\/\/imgur\.com\/upload\?(?:url=)(http[^&]+)/i) == 0) {
        let url = decodeURIComponent(location.search.match(/(?:url=)(http[^&]+)/)[1]);
        let form = new FormData();
        form.append('url', url);

        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            GM_setValue('uti', '1');
            location.href = 'https://imgur.com/' + xhr.response.data.hash;
        };
        xhr.open('POST', 'https://imgur.com/upload', true);
        xhr.responseType = "json";
        xhr.send(form);
    }
    else if (window.name == 'uti' && location.href.search(/^https:\/\/imgur\.com\/vidgif\?(?:url=)(http[^&]+)/i) == 0) {
        let url = decodeURIComponent(location.search.match(/(?:url=)(http[^&]+)/)[1]);
    }
    else if (window.name == 'uti' && location.href.search(/^https:\/\/imgur\.com\//i) == 0 && GM_getValue('uti') == '1') {
        let src = document.querySelector('.post-image-placeholder, .post-image-container > .post-image > img').src;
        src = src.replace(/\/([a-zA-Z0-9]{7})(?:[hrlgmtbs]|_d)(\.[^/.?]*)$/, "/$1$2");
        location.href = 'https://www.reddit.com/r/' + sr + '/submit?url=' + encodeURIComponent(src);
    }

    else if (window.name == 'uti' && location.href.search(/^https:\/\/gfycat\.com\/upload\?(?:url=)(http[^&]+)/i) == 0) {
        let url = decodeURIComponent(location.search.match(/(?:url=)(http[^&]+)/)[1]);
        let xhr = new XMLHttpRequest();
        let doCheck;
        doCheck = (gfyname)=>{
            return new Promise(resolve=>{
                let check = new XMLHttpRequest();
                check.open('GET', `https://api.gfycat.com/v1/gfycats/fetch/status/${gfyname}`, true);
                check.addEventListener('load', ()=>{
                    let response = {};
                    try {
                        response = JSON.parse(check.responseText);
                    } catch (ex) {
                        console.warn(ex);
                    }
                    if (response.task == 'complete') {
                        console.log('COMPLETE', check.responseText);
                        resolve();
                    } else {
                        console.log(check.responseText);
                        setTimeout(()=>doCheck(gfyname).then(()=>resolve()), 1000);
                    }
                });
                check.send();
            });
        };
        xhr.open('POST', 'https://api.gfycat.com/v1/gfycats', true);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.addEventListener('load', ()=>{
            let response = {};
            try {
                response = JSON.parse(xhr.responseText);
            } catch (ex) {
                console.warn(ex);
            }
            if (response.isOk) {
                doCheck(response.gfyname).then(()=>{
                    console.log('RESOLVED');
                    GM_setValue('uti', '1');
                    location.href = `https://www.reddit.com/r/${sr}/submit?url=${encodeURIComponent('https://gfycat.com/')}${response.gfyname}`;
                });
            } else {
                console.warn('USERSCRIPT', response);
            }
        });
        xhr.send(JSON.stringify({
            fetchUrl: url,
            keepAudio: false,
            nsfw: true,
            private: false,
            tags: [GM_getValue('uti_title')],
            title: GM_getValue('uti_title'),
            cut: {
                start: 0,
                duration: 60
            }
        }));
    }

    else if (window.name == 'uti' && location.href.search(/^https:\/\/www\.reddit\.com/i) == 0 && GM_getValue('uti') == '1') {
        console.log('reddit submit', GM_getValue('uti_title'));
        GM_setValue('uti', null);
        document.querySelector('#title-field textarea').value = '[insta] ' + GM_getValue('uti_title');
        document.querySelector('#newlink button.btn[name="submit"]').click();
    }
    else if (window.name == 'uti' && location.href.search(/^https:\/\/www\.reddit\.com\/.+\/comments\//i) == 0) {
        continueUpload();
    } else if (window.name == 'uti') {
        console.log('WHAT??', GM_getValue('uti_title'), GM_getValue('uti'), location.href);
    }
})();
