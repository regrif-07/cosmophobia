import {hasComponents} from "./components.js";

// fit a number in a range
export function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

// look for an image asset inside the assetsMonad and return its size
// if asset was not found - return null
export function getAssetImageSize(assetsMonad, imageUrl) {
    return assetsMonad.chain(assets => {
        const image = assets[imageUrl];
        if (!image)  {
            return null;
        }

        return { // this is NOT a Size component; conversation required
            width: image.width,
            height: image.height,
        };
    });
}

// hash function for seed generation from
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
export function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    // noinspection CommaExpressionJS
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

// RNG from
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
export function sfc32(a, b, c, d) {
    return function() {
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (a + b | 0) + d | 0;
        d = d + 1 | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

// check if two entities are colliding; return true or false based on the check
// if any entity will not have position or size component - return false
export function areColliding(firstEntity, secondEntity) {
    if (!hasComponents(firstEntity, "position", "size") ||
        !hasComponents(secondEntity, "position", "size")) {
        return false;
    }

    return (
        firstEntity.position.x < secondEntity.position.x + secondEntity.size.width &&
        firstEntity.position.x + firstEntity.size.width > secondEntity.position.x &&
        firstEntity.position.y < secondEntity.position.y + secondEntity.size.height &&
        firstEntity.position.y + firstEntity.size.height > secondEntity.position.y
    );
}