export const groupProps = ["constructor", "add", "neg", "sub", "scale", "assertEquals", "equals", "toFields", "toJSON"]
export const boolProps = ["constructor", "toField", "not", "and", "or", "assertEquals", "assertTrue", "assertFalse", "equals", "toBoolean", "sizeInFields", "toString", "toFields", "toJSON"]


export function checkType(value: unknown, _allowedProperties: string[]): Boolean {
    const allowedProperties = new Set(_allowedProperties);
    const prototype = Object.getPrototypeOf(value);
    const properties = Object.getOwnPropertyNames(prototype);
    if (properties.length !== allowedProperties.size) {
        return false;
    }
    for (const property of properties) {
        if (!allowedProperties.has(property)) {
            return false;
        }
    }
    return true;
}