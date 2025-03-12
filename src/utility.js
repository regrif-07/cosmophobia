export function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

export function getAssetImageSize(assetsMonad, imageUrl) {
    return assetsMonad.chain(assets => {
        const image = assets[imageUrl];
        return {
            width: image.width,
            height: image.height,
        };
    });
}