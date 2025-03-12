import {AssetsMonad} from "./monads.js";

export function preloadImages(...imageUrls) {
    const uniqueUrls = [...new Set(imageUrls)];

    return new Promise((resolve, reject) => {
        if (uniqueUrls.length === 0) {
            resolve(new AssetsMonad({}));
            return;
        }

        const promises = uniqueUrls.map(url => new Promise((res, rej) => {
            const image = new Image();

            image.onload = () => {
                res({ url, image });
            };

            image.onerror = (error) => {
                const errorMessage = `Error loading image: ${url}`;
                console.error(errorMessage, error);
                rej(errorMessage);
            };

            image.src = url;
        }));

        Promise.all(promises)
            .then(results => {
                const assets = results.reduce((assetsAcc, { url, image }) => {
                    assetsAcc[url] = image;
                    return assetsAcc;
                }, {});
                resolve(new AssetsMonad(assets));
            })
            .catch(reject);
    });
}