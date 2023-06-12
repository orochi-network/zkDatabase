export const groupProps = ["constructor", "add", "neg", "sub", "scale", "assertEquals", "equals", "toFields", "toJSON"]
export const fieldProps = ['constructor', 'add', 'sub', 'div', 'mul', 'neg', 'inv', 'square', 'sqrt', 'toString', 'sizeInFields', 'toFields', 'toBigInt', 'lt', 'lte', 'gt', 'gte', 'assertLt', 'assertLte', 'assertGt', 'assertGte', 'assertEquals', 'assertBoolean',
    'isZero', 'toBits', 'equals', 'seal', 'rangeCheckHelper', 'isConstant', 'toConstant', 'toJSON'
]
export const fieldArrayProps =
    [
        'length', 'constructor', 'concat', 'copyWithin', 'fill', 'find', 'findIndex', 'lastIndexOf', 'pop', 'push', 'reverse', 'shift',
        'unshift', 'slice', 'sort', 'splice', 'includes', 'indexOf', 'join', 'keys', 'entries', 'values', 'forEach', 'filter',
        'flat', 'flatMap', 'map', 'every', 'some', 'reduce', 'reduceRight', 'toLocaleString', 'toString', 'at', 'findLast', 'findLastIndex'
    ]
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