const CACHE_NAME = 'Milloner';
const cacheList = [
    'index.html',
    'images/balloons.svg',
    'images/business.png',
    'images/conversation.svg',
    'images/fifty.png',
    'images/menu.png',
    'images/mistake.png',
    'images/question.png',
    'images/sounds.png',
    'images/soundsOff.png',
    'index.js',
    'index.css',
    'Montserrat-ExtraLight.ttf',
    'notRight.mp3',
    'questions.js',
    'reset.min.css',
    'right.mp3',
    'vue.min.js',
    'win.mp3',
    'wrong.mp3',
    'anotherVariant.mp3',
];
this.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(cacheList);
        })
    );
});
const CACHE_PREFIX = 'Milloner-12';

this.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

this.addEventListener('fetch', function (event) {
    if (
        event.request.method !== 'GET' ||
        event.request.url.indexOf('http://') === 0 ||
        event.request.url.indexOf('an.yandex.ru') !== -1
    ) {
        return;
    }
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
