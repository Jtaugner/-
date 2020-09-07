let localStars = localStorage.getItem('stars') ? JSON.parse(localStorage.getItem('stars')) : false;
if (!localStars) {
    localStars = [];
    for (let i = 0; i < questions.length; i++) localStars.push(0);
} else if (localStars.length !== questions.length) {
    for (let i = 0; i < questions.length - localStars.length; i++) {
        localStars.push(0);
    }
}
let advTime = false;
setTimeout(()=>{
    advTime = true;
}, 20000);
let showAdv;
let records = localStorage.getItem('records');
if (records) {
    records = JSON.parse(records);
} else {
    records = [];
}
const game = new Vue({
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
        moneyQuestions: [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 250000, 500000, 800000, 1250000,
            2000000, 3000000, 5000000],
        nGame: 0,
        usedTips: [false, false, false, false],
        rightMistake: false,
        canGiveAnswer: false,
        records: records,
        recordSeen: false

    },
    methods: {
        startGame() {
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
        getQuestion() {
            this.rightMistake = false;
            this.numQ = Math.floor(Math.random() * questions[this.numOfQuestions].length);
            this.question = questions[this.numOfQuestions][this.numQ];
        },
        getVariants() {
            this.activeVariant = -1;
            this.rightAnswer = -1;
            this.wrongAnswer = -1;
            this.variants = ['', '', '', ''];
            let possibleVariants = [0, 1, 2, 3];
            let variants = [];
            for (let i = 0; i < 4; i++) {
                let index = Math.floor(Math.random() * possibleVariants.length);
                let rand = possibleVariants[index];
                if (i === 0) {
                    this.rightVariant = rand;
                }
                variants[rand] = answers[this.numOfQuestions][this.numQ][i];
                possibleVariants.splice(index, 1);
            }
            let thisgame = this.nGame;
            this.canGiveAnswer = false;
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    if (this.nGame !== thisgame) return;
                    this.setVariant(i, variants[i]);
                    if (i === 3) this.canGiveAnswer = true;
                }, 750 * i + 750)
            }
        },
        setVariant(index, q) {
            this.variants.splice(index, 1, q);
        },
        setAnswer(variant) {
            if (this.rightAnswer !== -1 || this.variants[variant] === '') return;
            this.activeVariant = variant;
        },
        giveAnswer() {
            if (!this.canGiveAnswer || this.activeVariant === -1) return;
            if (this.endGame) {
                this.startGame();
                return
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
                    return;
                } else {
                    this.endGame = true;
                }
            } else {
                if (this.numOfQuestions === 14) {
                    this.win();
                }
            }
            this.rightAnswer = this.rightVariant;
        },
        nextLevel() {
            this.numOfQuestions++;
            this.getQuestion();
            this.getVariants();
        },
        returnMenu() {
            this.content = false;
            this.endGame = false;
            this.levels = true;
        },
        useTip(index) {
            if (this.usedTips[index] === true) return;
            if (index === 0) {
                this.rightMistake = true
            } else if (index === 1 || index === 3) {
                for (let i = 0; i < 4; i++) {
                    if (this.variants[i] === '') return;
                }
                this.setFifty();
            } else if (index === 2) {
                this.getQuestion();
                this.getVariants();
            }
            this.usedTips.splice(index, 1, true);
        },
        setFifty() {
            this.activeVariant = -1;
            let arr = [0, 1, 2, 3];
            arr.splice(this.rightVariant, 1);
            let rand1 = Math.floor(Math.random() * arr.length);
            this.variants.splice(arr[rand1], 1, '');
            arr.splice(rand1, 1);
            let rand2 = Math.floor(Math.random() * arr.length);
            this.variants.splice(arr[rand2], 1, '');
        },
        win() {
            for (let i = 0; i < 4; i++) this.variants[i] = 'Победа';
            this.endGame = true;
            this.rightAnswer = -1;
            this.wrongAnswer = -1;
            this.question = 'Поздравляем! Вы победили и заработали 5.000.000 рублей! Продолжайте развивать себя, отвечая на вопросы игры!';
            let date = new Date();
            let d = date.getDay();
            let m = date.getMonth();
            let y = date.getFullYear();
            date = addNull(d) + '/' + addNull(m) + '/' + y;
            this.records.push(date);
            localStorage.setItem('records', JSON.stringify(records));
        },
        toggleRecords() {
            this.blackout = !this.blackout;
            this.recordSeen = !this.recordSeen;
        }
    },
    mounted: function () {
        this.$nextTick(function () {
            document.querySelector(".start").remove()
        })
    }
});

function addNull(str) {
    return String(str).length === 1 ? '0' + str : str;
}

if (window.YaGames) {
    YaGames.init({
        adv: {
            onAdvClose: wasShown => {
                if (!wasShown) advTime = true;
            }
        }
    }).then(ysdk => {
        showAdv = () => {
            ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onClose: function () {
                        advTime = false;
                        setTimeout(() => {
                            advTime = true;
                        }, 190000);
                    }
                }
            });
        };
    });
}