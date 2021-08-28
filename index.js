"use strict";

var localStars = getFromStorage('stars') ? JSON.parse(getFromStorage('stars')) : false;
var isSoundsLocal = getFromStorage('sounds');


function getFromStorage(name) {
    try {
        let val = localStorage.getItem(name);
        if (val) return val;
    } catch (e) {
    }
}

function setToStorage(name, val) {
    try {
        localStorage.setItem(name, val);
    } catch (e) {}
}

if (isSoundsLocal) {
    isSoundsLocal = isSoundsLocal === "true";
} else {
    isSoundsLocal = true;
}

if (!localStars) {
    localStars = [];

    for (var i = 0; i < questions.length; i++) {
        localStars.push(0);
    }
} else if (localStars.length !== questions.length) {
    for (var _i = 0; _i < questions.length - localStars.length; _i++) {
        localStars.push(0);
    }
}

function giveParams(data) {
    try {
        window.ym(55673383, 'params', data);
    } catch (ignored) {}
}

var NewAudioContext = function () {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.audioContext = new window.AudioContext();
    } catch (e) {
        console.log("No Web Audio API support");
    }

    var WebAudioAPISoundManager = function WebAudioAPISoundManager(context) {
        this.context = context;
        this.bufferList = {};
        this.playingSounds = {};
    };

    WebAudioAPISoundManager.prototype = {
        addSound: function addSound(url) {
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";
            var self = this;

            request.onload = function () {
                self.context.decodeAudioData(request.response, function (buffer) {
                    if (!buffer) {
                        console.log('error decoding file data: ' + url);
                        return;
                    }

                    self.bufferList[url] = buffer;
                });
            };

            request.onerror = function () {
                console.log('BufferLoader: XHR error');
            };

            request.send();
        },
        stopSoundWithUrl: function stopSoundWithUrl(url) {
            if (this.playingSounds.hasOwnProperty(url)) {
                for (var i in this.playingSounds[url]) {
                    if (this.playingSounds[url].hasOwnProperty(i)) {
                        this.playingSounds[url][i].stop(0);
                    }
                }
            }
        }
    };

    var WebAudioAPISound = function WebAudioAPISound(url, options) {
        this.settings = {
            loop: false
        };

        for (var i in options) {
            if (options.hasOwnProperty(i)) {
                this.settings[i] = options[i];
            }
        }

        this.url = url;
        this.volume = 0.6;
        window.webAudioAPISoundManager = window.webAudioAPISoundManager || new WebAudioAPISoundManager(window.audioContext);
        this.manager = window.webAudioAPISoundManager;
        this.manager.addSound(this.url);
    };

    WebAudioAPISound.prototype = {
        play: function play() {
            var buffer = this.manager.bufferList[this.url]; //Only play if it loaded yet

            if (typeof buffer !== "undefined") {
                var source = this.makeSource(buffer);
                source.loop = this.settings.loop;
                source.start(0);

                if (!this.manager.playingSounds.hasOwnProperty(this.url)) {
                    this.manager.playingSounds[this.url] = [];
                }

                this.manager.playingSounds[this.url].push(source);
            }
        },
        stop: function stop() {
            this.manager.stopSoundWithUrl(this.url);
        },
        getVolume: function getVolume() {
            return this.translateVolume(this.volume, true);
        },
        //Expect to receive in range 0-100
        setVolume: function setVolume(volume) {
            this.volume = this.translateVolume(volume);
        },
        translateVolume: function translateVolume(volume, inverse) {
            return inverse ? volume * 100 : volume / 100;
        },
        makeSource: function makeSource(buffer) {
            var source = this.manager.context.createBufferSource();
            var gainNode = this.manager.context.createGain();
            source.connect(gainNode);
            gainNode.gain.value = this.volume;
            source.buffer = buffer;
            gainNode.connect(this.manager.context.destination);
            return source;
        }
    };
    return WebAudioAPISound;
}();

var sounds = {
    rightAnswer: new NewAudioContext('right.mp3'),
    wrongAnswer: new NewAudioContext('wrong.mp3'),
    tip: new NewAudioContext('anotherVariant.mp3'),
    notRight: new NewAudioContext('notRight.mp3'),
    win: new NewAudioContext('win.mp3')
};
var advTime = false;
setTimeout(function () {
    advTime = true;
}, 20000);
var showAdv;
var records = getFromStorage('records');

if (records) {
    records = records.replace(/\//g, '.');
    records = JSON.parse(records);
} else {
    records = [];
}

// for(let i = 0; i < questions.length; i++){
//     for(let q = 0; q < questions[i].length; q++){
//         if(questions[i][q].indexOf('хоть потоп') !== -1){
//             console.log(questions[i][q]);
//             console.log(answers[i][q]);
//         }
//     }
// }

let isNotificationLocal = !getFromStorage('isNotification');



var game = new Vue({
    el: '.game',
    data: {
        menu: false,
        isPhone: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        content: false,
        levels: true,
        stars: localStars,
        numOfLevels: questions.length,
        levelNum: 0,
        numOfQuestions: 0,
        lvl: 4,
        selectedNum: -1,
        time: 0,
        question: 'Правда ли?',
        isAnswerGiven: false,
        answer: true,
        result: 0,
        blackout: false,
        intervalTimer: 0,
        endGame: false,
        givenStars: 0,
        gameResult: 0,
        gotQuestions: [],
        variants: ['0', '1', '2', '3'],
        numQ: 0,
        activeVariant: -1,
        rightVariant: -1,
        rightAnswer: -1,
        wrongAnswer: -1,
        moneyQuestions: [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 250000, 500000, 800000, 1250000, 2000000, 3000000, 5000000],
        nGame: 0,
        usedTips: [false, false, false, false],
        rightMistake: false,
        canGiveAnswer: false,
        records: records,
        recordSeen: false,
        isSounds: isSoundsLocal,
        isNotification: isNotificationLocal
    },
    methods: {
        startGame: function startGame() {
            if (showAdv && advTime) {
                showAdv();
            }

            this.numOfQuestions = 0;
            this.nGame++;
            this.getQuestion();
            this.getVariants();
            this.content = true;
            this.levels = false;
            this.endGame = false;
            this.rightMistake = false;
            this.usedTips = [false, false, false, false];
        },
        getQuestion: function getQuestion() {
            this.rightMistake = false;
            this.numQ = Math.floor(Math.random() * questions[this.numOfQuestions].length);
            this.question = questions[this.numOfQuestions][this.numQ];
        },
        getVariants: function getVariants() {
            var _this = this;

            this.activeVariant = -1;
            this.rightAnswer = -1;
            this.wrongAnswer = -1;
            this.variants = ['', '', '', ''];
            var possibleVariants = [0, 1, 2, 3];
            var variants = [];

            for (var _i2 = 0; _i2 < 4; _i2++) {
                var index = Math.floor(Math.random() * possibleVariants.length);
                var rand = possibleVariants[index];

                if (_i2 === 0) {
                    this.rightVariant = rand;
                }

                variants[rand] = answers[this.numOfQuestions][this.numQ][_i2];
                possibleVariants.splice(index, 1);
            }

            var thisgame = this.nGame;
            this.canGiveAnswer = false;

            var _loop = function _loop(_i3) {
                setTimeout(function () {
                    if (_this.nGame !== thisgame) return;

                    _this.setVariant(_i3, variants[_i3]);

                    if (_i3 === 3) _this.canGiveAnswer = true;
                }, 750 * _i3 + 750);
            };

            for (var _i3 = 0; _i3 < 4; _i3++) {
                _loop(_i3);
            }
        },
        closeNotification(){
          this.isNotification = false;
          setToStorage('isNotification', 'true');
        },
        setVariant: function setVariant(index, q) {
            this.variants.splice(index, 1, q);
        },
        setAnswer: function setAnswer(variant) {
            if (this.rightAnswer !== -1 || this.variants[variant] === '') return;
            this.activeVariant = variant;
        },
        toggleSounds: function toggleSounds() {
            this.isSounds = !this.isSounds;

            if (this.isSounds) {
                setToStorage('sounds', 'true');
                giveParams({
                    'sounds': true
                });
            } else {
                setToStorage('sounds', 'false');
                giveParams({
                    'sounds': false
                });
            }
        },
        giveAnswer: function giveAnswer() {
            if (!this.canGiveAnswer || this.activeVariant === -1) return;

            if (this.endGame) {
                this.startGame();
                return;
            }

            if (this.rightAnswer !== -1) {
                this.nextLevel();
                return;
            }

            if (this.activeVariant !== this.rightVariant) {
                this.wrongAnswer = this.activeVariant;

                if (this.rightMistake) {
                    this.rightMistake = false;
                    this.activeVariant = -1;
                    if (this.isSounds) sounds.notRight.play();
                    return;
                } else {
                    if (this.isSounds) sounds.wrongAnswer.play();
                    this.endGame = true;
                }
            } else {
                if (this.numOfQuestions === 14) {
                    if (this.isSounds) sounds.win.play();
                    this.win();
                } else {
                    if (this.isSounds) sounds.rightAnswer.play();
                }
            }

            this.rightAnswer = this.rightVariant;
        },
        nextLevel: function nextLevel() {
            this.numOfQuestions++;
            this.getQuestion();
            this.getVariants();
        },
        returnMenu: function returnMenu() {
            this.content = false;
            this.endGame = false;
            this.levels = true;
        },
        useTip: function useTip(index) {
            if (this.usedTips[index] === true || !this.canGiveAnswer) return;

            if (index === 0) {
                this.rightMistake = true;
                if (this.isSounds) sounds.tip.play();
            } else if (index === 1 || index === 3) {
                for (var _i4 = 0; _i4 < 4; _i4++) {
                    if (this.variants[_i4] === '') return;
                }

                if (this.isSounds) sounds.tip.play();
                this.setFifty();
            } else if (index === 2) {
                if (this.isSounds) sounds.tip.play();
                this.getQuestion();
                this.getVariants();
            }

            this.usedTips.splice(index, 1, true);
        },
        setFifty: function setFifty() {
            this.activeVariant = -1;
            var arr = [0, 1, 2, 3];
            arr.splice(this.rightVariant, 1);
            var rand1 = Math.floor(Math.random() * arr.length);
            this.variants.splice(arr[rand1], 1, '');
            arr.splice(rand1, 1);
            var rand2 = Math.floor(Math.random() * arr.length);
            this.variants.splice(arr[rand2], 1, '');
        },
        win: function win() {
            for (var _i5 = 0; _i5 < 4; _i5++) {
                this.variants[_i5] = 'Победа';
            }

            this.endGame = true;
            this.rightAnswer = -1;
            this.wrongAnswer = -1;
            this.question = 'Поздравляем! Вы победили и заработали 5.000.000 рублей! Продолжайте развивать себя, отвечая на вопросы игры!';
            var date = new Date();
            var d = date.getDate();
            var m = date.getMonth() + 1;
            var y = date.getFullYear();
            date = addNull(d) + '.' + addNull(m) + '.' + y;
            this.records.push(date);
            setToStorage('records', JSON.stringify(records));
        },
        toggleRecords: function toggleRecords() {
            this.blackout = !this.blackout;
            this.recordSeen = !this.recordSeen;
        }
    },
    mounted: function mounted() {
        this.$nextTick(function () {
            document.querySelector(".start").remove();
        });
    }
});

function addNull(str) {
    return String(str).length === 1 ? '0' + str : str;
}

if (window.YaGames) {
    YaGames.init({
        adv: {
            onAdvClose: function onAdvClose(wasShown) {
                if (!wasShown) advTime = true;
            }
        }
    }).then(function (ysdk) {
        var isNativeCache = ysdk.yandexApp && ysdk.yandexApp.enabled;

        if ('serviceWorker' in navigator && !isNativeCache) {
            window.onload = function () {
                navigator.serviceWorker.register('sw.js').then(function (reg) {
                    console.log('Registration succeeded. Scope is ' + reg.scope);
                }).catch(function (error) {
                    console.error('Trouble with sw: ', error);
                });
            };
        }

        showAdv = function showAdv() {
            ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onClose: function onClose() {
                        advTime = false;
                        setTimeout(function () {
                            advTime = true;
                        }, 190000);
                    }
                }
            });
        };
    });
}