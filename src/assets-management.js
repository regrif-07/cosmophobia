import {AssetsMonad} from "./monads.js";

// this function is based on something I found in the internet
// for each provided image url create a promise that should load that image
// after that, wait for all promises to resolve and combine results into the AssetsMonad
// if image loading failed - display error in the console,
// and proceed without adding the image to the AssetsMonad
export function preloadImages(...imageUrls) {
    const uniqueUrls = [...new Set(imageUrls)];

    return new Promise((resolve, reject) => {
        if (uniqueUrls.length === 0) {
            resolve(new AssetsMonad({}));
            return;
        }

        const promises = uniqueUrls.map(url => new Promise((res) => {
            const image = new Image();

            image.onload = () => {
                res({ url, image, success: true });
            };

            image.onerror = (error) => {
                const errorMessage = `Error loading image: ${url}`;
                console.error(errorMessage, error);
                // Return success: false instead of rejecting
                res({ url, success: false });
            };

            image.src = url;
        }));

        Promise.all(promises)
            .then(results => {
                const assets = results
                    .filter(result => result.success)
                    .reduce((assetsAcc, { url, image }) => {
                        assetsAcc[url] = image;
                        return assetsAcc;
                    }, {});
                resolve(new AssetsMonad(assets));
            })
            .catch(reject);
    });
}