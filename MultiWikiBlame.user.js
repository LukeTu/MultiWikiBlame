// ==UserScript==
// @name         MultiWikiBlame
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  MultiWikiBlame is a userscript that allows users to translate the content of a Wikipedia page into different languages using Baidu's translation API. The script also supports changing the language of the article title. Please note that this script is provided "as is", without warranty of any kind. Use at your own risk.
// @author       HUA Zhiwen, TU Zhilu
// @match        http://wikipedia.ramselehof.de/*
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js
// ==/UserScript==

// Acknowledgment: This script is made possible thanks to the GP4 language model developed by OpenAI.

// Disclaimer: The authors of this script are not responsible for any issues or damages that may arise from using this script. Please use responsibly.

(async function() {
    'use strict';

    // 百度翻译 API
    const appid = '20210620000867906';
    const key = '0NNfT6b27iPaMVw9hAgp';

    const languageMap = {
        'zh': 'zh', // 中文
        'en': 'en', // 英语
        'zh-yue': 'yue', // 粤语
        'lzh': 'wyw', // 文言文
        'ja': 'jp', // 日语
        'ko': 'kor', // 韩语
        'fr': 'fra', // 法语
        'es': 'spa', // 西班牙语
        'th': 'th', // 泰语
        'ar': 'ara', // 阿拉伯语
        'ru': 'ru', // 俄语
        'pt': 'pt', // 葡萄牙语
        'de': 'de', // 德语
        'it': 'it', // 意大利语
        'el': 'el', // 希腊语
        'nl': 'nl', // 荷兰语
        'pl': 'pl', // 波兰语
        'bg': 'bul', // 保加利亚语
        'et': 'est', // 爱沙尼亚语
        'da': 'dan', // 丹麦语
        'fi': 'fin', // 芬兰语
        'cs': 'cs', // 捷克语
        'ro': 'rom', // 罗马尼亚语
        'sl': 'slo', // 斯洛文尼亚语
        'sv': 'swe', // 瑞典语
        'hu': 'hu', // 匈牙利语
        'zh-tw': 'cht', // 繁体中文
        'vi': 'vie' // 越南语
    };

    let originalArticleName = $('#article').val(); // Store the original English article name

    function createLangDropdown(selectedLang) {
        const options = Object.keys(languageMap).map(lang => {
            return `<option value="${lang}" ${lang === selectedLang ? 'selected' : ''}>${lang}</option>`;
        }).join('');
        return `<select name="lang" id="lang">${options}</select>`;
    }

    async function getLangName(enname, lang) {
        if (lang === 'en') {
            return enname;
        } else {
            const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${enname}&prop=langlinks&lllang=${lang}&format=json&origin=*`;
            const response = await fetch(url);
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const langlinks = pages[pageId].langlinks;
            let langname = enname;
            if (langlinks) {
                const langlink = langlinks.find(link => link.lang === lang);
                if (langlink) {
                    langname = langlink['*'];
                }
            }
            return langname;
        }
    }

    async function translation() {
        const query = (sessionStorage.getItem('temp') === $('#needle').val()) ? sessionStorage.getItem('raw') : $('#needle').val();
        if ($('#needle').val()) {
            const salt = (new Date).getTime();
            const from = 'en';
            const selectedLang = $("#lang").val();
            const to = languageMap[selectedLang] || selectedLang;
            const str1 = appid + query + salt + key;
            const sign = md5(str1);
            $.ajax({
                url: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
                type: 'get',
                dataType: 'jsonp',
                data: {
                    q: query,
                    appid: appid,
                    salt: salt,
                    from: from,
                    to: to,
                    sign: sign,
                    article: $('#article').val() // 使用当前的article值
                },
                success: function (data) {
                    console.log(query + from + to);
                    console.log(data);
                    $("#needle").val(data['trans_result'][0].dst);
                    sessionStorage.setItem('temp', data['trans_result'][0].dst);
                    sessionStorage.setItem('raw', query);
                },
                error: function (res) {
                    console.log(query + from + to);
                }
            });
        }
    }

    const selectedLang = 'en'; // 默认语言为英语
    const inner = createLangDropdown(selectedLang);
    $("#lang").replaceWith(inner);

    // Update originalArticleName when #article loses focus and the selected language is English
    $("#article").blur(function () {
        if ($("#lang").val() === 'en') {
            originalArticleName = $('#article').val();
        }
    });

    $("#needle").blur(translation);
    $("#lang").change(async function () {
        const selectedLang = $("#lang").val();
        const langname = await getLangName(originalArticleName, selectedLang); // Use the original English article name
        $('#article').val(langname);
        if ($('#needle').val()) {
            translation();
        }
    });
})();
