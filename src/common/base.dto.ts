export class BaseDTO<T = any> {
    public constructor(data: T) {
        if (data) {
            Object.assign(this, data);
        }
    }
}
