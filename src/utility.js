// fit a number in a range
export function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

// look for an image asset inside the assetsMonad and return its size
export function getAssetImageSize(assetsMonad, imageUrl) {
    return assetsMonad.chain(assets => {
        const image = assets[imageUrl];
        return {
            width: image.width,
            height: image.height,
        };
    });
}