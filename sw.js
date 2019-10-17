const CACHE_NAME = 'Milloner';
const cacheList = [
    'index.html',
    'vue.min.js',
    'index.js',
    'reset.min.css',
    'index.css',
    'images/balloons.svg',
    'images/business.png',
    'images/business.svg',
    'images/conversation.svg',
    'images/fifty.svg',
    'images/menu.svg',
    'images/mistake.svg',
    'images/money-bag.svg',
    'images/question.svg',
    'Electronica-Regular.otf',
];
this.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(cacheList);
        })
    );
});
const CACHE_PREFIX = 'Milloner-1';

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
