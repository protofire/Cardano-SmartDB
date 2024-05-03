

export class BaseConstructor {
    constructor(properties?: Partial<any>) {
        if (properties) {
            Object.assign(this, properties);
        }
    }
}

