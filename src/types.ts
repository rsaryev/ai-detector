export abstract class Detector {
    abstract detect(code: string): Promise<number>;
    abstract getModels(): Promise<string[]>;
}

export interface DetectorOptions {
    model?: string;
    token?: string;
}