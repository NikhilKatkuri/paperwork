type HSL = [number, number, number];

const getHashOfString = (str: string): number => {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0;
    }

    return Math.abs(hash);
};

const normalize = (value: number, min: number, max: number): number => {
    return (value % (max - min + 1)) + min;
};

const generateHSL = (name: string): HSL => {
    const hash = getHashOfString(name);

    const h = normalize(hash, 0, 359);

    const s = normalize(hash >> 8, 55, 75);
    const l = normalize(hash >> 16, 45, 65);

    return [h, s, l];
};

const HSLtoString = (hsl: HSL): string => {
    return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
};

export { HSLtoString, generateHSL };
