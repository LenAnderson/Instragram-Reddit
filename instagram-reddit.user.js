// ==UserScript==
// @name         Instagram - Upload to Imgur and Save to Reddit
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/Instragram-Reddit/raw/master/instagram-reddit.user.js
// @version      0.4
// @description  Instagram -> Imgur -> Reddit
// @author       LenAnderson
// @match        https://www.instagram.com
// @match        https://www.instagram.com/*
// @match        https://imgur.com/*
// @match        https://gfycat.com/*
// @match        https://www.reddit.com/r/*/submit?url=*
// @match        https://www.reddit.com/r/*/comments/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    let sr = 'LenAndersonSaves';
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
        switch (type) {
            case 'img':
                return 'https://imgur.com/upload?url=' + encodeURIComponent(url);
            case 'vid':
                return 'https://gfycat.com/upload?url=' + encodeURIComponent(url);
        }
    };


    let addUpload = (type, title, url) => {
        if (type == 'vid') return;
        if (popup && !popup.closed) {
            console.log('adding to queue');
            let queue = getQueue();
            queue.push({type:type, title:title, url:url});
            setQueue(queue);
        } else {
            console.log('starting upload');
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
        if (queue.length > 0) {
            let item = queue.shift();
            setQueue(queue);
            if (item.type == 'vid') return continueUpload();
            let imgurl = makeImgurl(item.type, item.url);
            GM_setValue('uti_title', item.title);
            location.href = imgurl;
        } else {
            window.close();
        }
    };



    if (location.href.search(/^https:\/\/www\.instagram\.com/i) == 0) {
        let addSaveButtons = () => {
            [].forEach.call(document.querySelectorAll('article._8Rm4L img[srcset], article._622au img[srcset]'), img => {
                if (img.getAttribute('data-uti')) return;
                let thing = img.closest('article');
                if (img && thing) {
                    let srcset = img.getAttribute('srcset').split(',').pop().split(' ')[0];
                    let header = thing.querySelector('header');
                    [].forEach.call(header.querySelectorAll('.uti-btn'), oldBtn => oldBtn.remove());
                    let btn = document.createElement('button');
                    btn.classList.add('uti-btn');
                    btn.textContent = 'imgur';
                    btn.addEventListener('click', () => {
                        addUpload('img', header.querySelector('a.notranslate').textContent.trim(), srcset);
                    });
                    btn.style.position = 'absolute';
                    btn.style.top = '10px';
                    btn.style.right = '10px';
                    header.appendChild(btn);
                    img.setAttribute('data-uti', '1');
                }
            });
            [].forEach.call(document.querySelectorAll('article._622au video[src]'), img => {
                if (img.getAttribute('data-uti')) return;
                let thing = img.closest('article');
                if (img && thing){
                    let srcset = img.src;
                    let header = thing.querySelector('header');
                    [].forEach.call(header.querySelectorAll('.uti-btn'), oldBtn => oldBtn.remove());
                    let btn = document.createElement('button');
                    btn.classList.add('uti-btn');
                    btn.textContent = 'imgur';
                    btn.addEventListener('click', () => {
                        addUpload('vid', header.querySelector('a.notranslate').textContent.trim(), srcset);
                    });
                    btn.style.position = 'absolute';
                    btn.style.top = '10px';
                    btn.style.right = '10px';
                    header.appendChild(btn);
                    img.setAttribute('data-uti', '1');
                }
            });
            [].forEach.call(document.querySelectorAll('img._ntjhp, video._ntjhp'), img => {
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
                let obtn = document.querySelector('._t848o');
                let btn = document.createElement('button');
                btn.textContent = 'imgur';
                btn.addEventListener('click', ()=>{
                    addUpload(type, document.querySelector('._2g7d5.notranslate').textContent.trim(), srcset);
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
        });
        mo.observe(document.body, {childList: true, subtree: true, attributes:true});
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
        document.querySelector('.input-container > input[type="URL"]').value = url;
    }

    else if (window.name == 'uti' && location.href.search(/^https:\/\/www\.reddit\.com/i) == 0 && GM_getValue('uti') == '1') {
        GM_setValue('uti', null);
        document.querySelector('#title-field textarea').value = '[insta] ' + GM_getValue('uti_title');
        document.querySelector('#newlink button.btn[name="submit"]').click();
    }
    else if (window.name == 'uti' && location.href.search(/^https:\/\/www\.reddit\.com\/.+\/comments\//i) == 0) {
        continueUpload();
    }
})();
