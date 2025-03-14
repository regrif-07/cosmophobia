import {AssetsMonad} from "./monads.js";

// this function is based on something I round in the internet
// for each provided image url create a promise that should load that image
// after that, wait for all promises to resolve and combine results into the AssetsMonad
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