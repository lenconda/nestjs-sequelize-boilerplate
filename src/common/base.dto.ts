export class BaseDTO<T = any> {
    public constructor(data: T) {
        Object.assign(this, data);
    }
}
