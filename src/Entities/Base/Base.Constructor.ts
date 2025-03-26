

export class BaseConstructor {
    constructor(properties?: Partial<any>) {
        if (properties) {
            Object.assign(this, { ...this, ...properties }); // Merge default fields and provided properties
        }
    }
}

